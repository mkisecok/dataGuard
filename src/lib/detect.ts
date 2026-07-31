import { DETECT_ORDER, RULES, RULE_TYPE } from './rules';
import type { Finding, Mapping, RuleKey, RunResult, Span, TokenType } from './types';

/**
 * Placeholder format: «TYPE_N».
 *
 * Guillemets are unusual enough that models rarely reword them, and they
 * survive Markdown formatting. The restore matcher additionally tolerates
 * `[TYPE N]` and case changes.
 */
export function token(type: TokenType, n: number): string {
  return `«${type}_${n}»`;
}

/** Every index at which `needle` occurs, non-overlapping. */
function allOccurrences(text: string, needle: string): number[] {
  const out: number[] = [];
  if (!needle) return out;
  let i = text.indexOf(needle);
  while (i !== -1) {
    out.push(i);
    i = text.indexOf(needle, i + needle.length);
  }
  return out;
}

/**
 * Find every piece of personal data in `text`.
 *
 * Returns character-offset spans rather than a rewritten string. That is what
 * makes live highlighting possible, and it is what makes replacement exact —
 * see the note on `buildRun`.
 *
 * Pure function: same inputs, same output. All UI state is passed in.
 */
export function detect(
  text: string,
  activeRules: ReadonlySet<RuleKey>,
  manualMarks: ReadonlyMap<string, TokenType>,
  mutedValues: ReadonlySet<string>,
): Span[] {
  const raw: Omit<Span, 'id'>[] = [];

  // Priority -1: the user has explicitly ruled on these, so no detector may
  // override them.
  for (const [value, type] of manualMarks) {
    for (const i of allOccurrences(text, value)) {
      raw.push({
        start: i,
        end: i + value.length,
        value,
        type,
        prio: -1,
        manual: true,
        muted: false,
      });
    }
  }

  DETECT_ORDER.forEach((key, prio) => {
    if (!activeRules.has(key)) return;
    const rule = RULES[key];
    // Fresh RegExp per pass: the shared literals are stateful through lastIndex.
    const flags = rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g';
    const re = new RegExp(rule.re.source, flags);

    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0] === '') {
        re.lastIndex++;
        continue;
      }
      if (rule.validate && !rule.validate(m[0])) continue;

      // A variable-length lookbehind such as (?<=Diagnose[:\s]{1,4}) lets the
      // match start on the separator space, which then renders as
      // "Diagnose:«HEALTH_DATA_1»". Trim both edges so a placeholder never eats
      // its own padding.
      let start = m.index;
      let end = m.index + m[0].length;
      while (start < end && /\s/.test(text[start]!)) start++;
      while (end > start && /\s/.test(text[end - 1]!)) end--;
      if (end <= start) continue;

      raw.push({
        start,
        end,
        value: text.slice(start, end),
        type: RULE_TYPE[key],
        ruleKey: key,
        prio,
        manual: false,
        muted: false,
      });
    }
  });

  return resolveOverlaps(raw, mutedValues);
}

/**
 * Drop overlapping detections by an explicit, checkable rule: detector priority
 * first, then leftmost, then longest.
 *
 * The previous implementation got this implicitly — it rewrote the text after
 * each rule, so a later regex simply could not match inside an already-inserted
 * token. That worked, but it was invisible and it forced value-based
 * replacement. This is the same guarantee, stated out loud.
 */
function resolveOverlaps(list: Omit<Span, 'id'>[], mutedValues: ReadonlySet<string>): Span[] {
  list.sort(
    (a, b) => a.prio - b.prio || a.start - b.start || (b.end - b.start) - (a.end - a.start),
  );

  const kept: Omit<Span, 'id'>[] = [];
  for (const s of list) {
    const overlaps = kept.some((k) => s.start < k.end && k.start < s.end);
    if (!overlaps) kept.push(s);
  }

  kept.sort((a, b) => a.start - b.start);
  return kept.map((s, id) => ({ ...s, id, muted: mutedValues.has(s.value) }));
}

/**
 * Turn text + spans into the outgoing document and its mapping.
 *
 * One left-to-right pass over the spans. No global substring replace: that is
 * the bug this design removes — rewriting by value meant a detected name `Jan`
 * also rewrote the word `Januar`, and a detected date rewrote every other copy
 * of that date whether or not it had been detected there.
 *
 * The same original value anywhere in the document gets the same token, so the
 * model can tell that two mentions are the same person.
 */
export function buildRun(text: string, spans: Span[]): RunResult {
  const live = spans.filter((s) => !s.muted);
  const mapping: Mapping = Object.create(null);
  const counters: Record<string, number> = Object.create(null);
  const byValue = new Map<string, Finding>();
  const findings: Finding[] = [];

  for (const s of live) {
    let f = byValue.get(s.value);
    if (!f) {
      counters[s.type] = (counters[s.type] ?? 0) + 1;
      const replacement = token(s.type, counters[s.type]!);
      mapping[s.value] = { replacement, type: s.type };
      f = {
        original: s.value,
        replacement,
        type: s.type,
        manual: s.manual,
        muted: false,
        spanIds: [],
      };
      byValue.set(s.value, f);
      findings.push(f);
    }
    s.replacement = f.replacement;
    f.spanIds.push(s.id);
  }

  let out = '';
  let cursor = 0;
  for (const s of live) {
    out += text.slice(cursor, s.start) + s.replacement;
    cursor = s.end;
  }
  out += text.slice(cursor);

  // Muted values still get a row in the rail so they can be brought back.
  const mutedByValue = new Map<string, Finding>();
  const muted: Finding[] = [];
  for (const s of spans) {
    if (!s.muted) continue;
    let f = mutedByValue.get(s.value);
    if (!f) {
      f = {
        original: s.value,
        replacement: '',
        type: s.type,
        manual: s.manual,
        muted: true,
        spanIds: [],
      };
      mutedByValue.set(s.value, f);
      muted.push(f);
    }
    f.spanIds.push(s.id);
  }

  return { text: out, mapping, findings, muted };
}
