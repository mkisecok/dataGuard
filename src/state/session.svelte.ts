import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { buildRun, detect } from '../lib/detect';
import { tierOf } from '../lib/display';
import { restoreFrom } from '../lib/restore';
import { RULE_KEYS } from '../lib/rules';
import type { Finding, Mapping, RuleKey, TokenType, TransmitState } from '../lib/types';

/**
 * The working session: one document, its detections, and the answer it produced.
 *
 * Detection is a `$derived` chain rather than an imperative "pseudonymize now"
 * step. That is the core UX decision of this rewrite — the outgoing text is
 * always current, so sending is only a transmission and never a transformation
 * the user has to remember to trigger.
 *
 * No debounce. Fifteen regexes over a normal case file is well under a
 * millisecond, and `$derived` is lazy and cached, so recomputing per keystroke
 * costs less than the machinery to defer it — and it removes the window where
 * highlights lag the caret. If someone pastes a very large document and this
 * ever becomes visible, deferring `text` is a one-line change.
 */
export class Session {
  /** The raw document. Never transmitted. */
  text = $state('');

  /**
   * Sent verbatim and NOT pseudonymized. Kept as its own field, and rendered as
   * its own visually quarantined input, precisely so the boundary between
   * protected and unprotected text stays visible.
   */
  instruction = $state('');

  /** Reactive collections: mutating them re-runs detection. */
  readonly activeRules = new SvelteSet<RuleKey>(RULE_KEYS);
  /** Values the user dismissed; transmitted in the clear. */
  readonly mutedValues = new SvelteSet<string>();
  /** Hand-marked values → category. Beats every detector. */
  readonly manualMarks = new SvelteMap<string, TokenType>();

  /** Stage I collapses to a summary strip once something has been sent. */
  collapsed = $state(false);
  transmitting = $state(false);
  transmit = $state<TransmitState | null>(null);

  rawAnswer = $state('');
  /** Show the answer as the model returned it, placeholders intact. */
  showRaw = $state(false);

  /**
   * Mapping snapshot from the run that was actually transmitted.
   *
   * `$state.raw` because it is only ever replaced wholesale, and because a
   * mapping of a few hundred entries does not need deep proxying.
   */
  sentMapping = $state.raw<Mapping | null>(null);

  readonly spans = $derived(
    detect(this.text, this.activeRules, this.manualMarks, this.mutedValues),
  );
  readonly run = $derived(buildRun(this.text, this.spans));

  /** Exactly what the model receives. */
  readonly pseudoText = $derived(this.run.text);
  readonly mapping = $derived(this.run.mapping);
  readonly findings = $derived(this.run.findings);
  readonly mutedFindings = $derived(this.run.muted);
  readonly art9Count = $derived(this.findings.filter((f) => tierOf(f.type) === 3).length);

  /** Findings and dismissed values together, as the rail lists them. */
  readonly rows = $derived<Finding[]>([...this.findings, ...this.mutedFindings]);

  readonly restored = $derived(
    this.rawAnswer ? restoreFrom(this.rawAnswer, this.sentMapping ?? this.mapping) : null,
  );

  readonly hasText = $derived(this.text.trim().length > 0);

  toggleMute(value: string): void {
    if (this.mutedValues.has(value)) this.mutedValues.delete(value);
    else this.mutedValues.add(value);
  }

  /** Mark a value as personal data by hand, or re-categorise a detection. */
  mark(value: string, type: TokenType): void {
    const trimmed = value.trim();
    if (!trimmed) return;
    this.manualMarks.set(trimmed, type);
    this.mutedValues.delete(trimmed);
  }

  unmark(value: string): void {
    this.manualMarks.delete(value);
  }

  /** New document: drop every per-document decision along with the text. */
  load(text: string): void {
    this.text = text;
    this.mutedValues.clear();
    this.manualMarks.clear();
    this.resetStages();
  }

  resetStages(): void {
    this.collapsed = false;
    this.transmitting = false;
    this.transmit = null;
    this.rawAnswer = '';
    this.showRaw = false;
    this.sentMapping = null;
  }
}

/**
 * One session per page. A module singleton rather than context: this is a
 * single-page, client-only tool with exactly one document open at a time, and
 * there is no SSR for state to leak between. Contributors adding a second
 * document surface should move this to `createContext` at that point.
 */
export const session = new Session();
