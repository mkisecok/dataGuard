<!--
  @component
  The one input field. Detected personal data is underlined in place as the user
  types; clicking a highlight reviews it, selecting text marks it by hand.

  ## How the highlighting works

  A `<div>` mirror sits behind a transparent `<textarea>`, both sharing exactly
  the same text metrics (`.doc-metrics`). The mirror draws the tinted underlines;
  the textarea draws the actual glyphs and owns all interaction.

  Deliberately not `contenteditable`: that would break native undo, IME
  composition for non-Latin input, and spellcheck — a real cost for a tool whose
  entire job is editing prose. The price is that the two boxes must stay metric
  for metric identical, which is why every font and spacing declaration lives in
  the one shared `.doc-metrics` class.
-->
<script lang="ts">
  import { tierOf } from '../lib/display';
  import type { Span, TokenType } from '../lib/types';
  import { session } from '../state/session.svelte';
  import { ui } from '../state/ui.svelte';
  import CategoryMenu from './CategoryMenu.svelte';
  import Popover from './Popover.svelte';
  import SpanReview from './SpanReview.svelte';

  // Captured by attachment rather than `bind:this`, so neither node is ever read
  // reactively from the template and neither needs to be `$state`.
  let textarea: HTMLTextAreaElement | null = null;
  let mirror: HTMLDivElement | null = null;

  /** Which floating surface is open, if any. */
  type Floating =
    | { kind: 'span'; span: Span; anchor: DOMRect }
    | { kind: 'span-category'; span: Span; anchor: DOMRect }
    | { kind: 'selection'; value: string; anchor: DOMRect }
    | { kind: 'selection-category'; value: string; anchor: DOMRect };

  let floating = $state<Floating | null>(null);

  /**
   * Last pointer position, used to anchor the selection chip. A text selection
   * has no addressable element, so the mouse is the only honest anchor.
   */
  let pointer = { x: 160, y: 220 };

  /** Split the document into plain runs and highlighted runs. */
  const segments = $derived.by(() => {
    const out: { text: string; span?: Span }[] = [];
    let cursor = 0;
    for (const span of session.spans) {
      if (span.start > cursor) out.push({ text: session.text.slice(cursor, span.start) });
      out.push({ text: span.value, span });
      cursor = span.end;
    }
    // Trailing newline keeps the mirror's last line box the same height as the
    // textarea's, which reserves a line for the caret.
    out.push({ text: session.text.slice(cursor) + '\n' });
    return out;
  });

  /**
   * Capture the node and grow it to fit, so the page has one scrollbar instead
   * of a nested one. Re-runs on every document change because it reads
   * `session.text`.
   */
  function composerField(node: HTMLTextAreaElement) {
    textarea = node;
    void session.text;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  }

  function mirrorLayer(node: HTMLDivElement) {
    mirror = node;
  }

  function rectFor(span: Span): DOMRect {
    const el = mirror?.querySelector(`[data-sid="${span.id}"]`);
    return el?.getBoundingClientRect() ?? new DOMRect(pointer.x, pointer.y, 0, 0);
  }

  /**
   * Decide what to show after the caret or selection moved.
   *
   * Runs on a macrotask delay because `selectionStart` is not yet updated during
   * the click/keydown that caused the move.
   */
  function afterCaretMove() {
    if (!textarea) return;
    const { selectionStart: start, selectionEnd: end, value } = textarea;

    if (start !== end) {
      const selected = value.slice(start, end).trim();
      floating = selected
        ? { kind: 'selection', value: selected, anchor: new DOMRect(pointer.x, pointer.y, 0, 0) }
        : null;
      return;
    }

    const span = session.spans.find((s) => start >= s.start && start <= s.end);
    floating = span ? { kind: 'span', span, anchor: rectFor(span) } : null;
  }

  function onMouseup(event: MouseEvent) {
    pointer = { x: event.clientX, y: event.clientY + 14 };
    setTimeout(afterCaretMove);
  }

  function onKeyup(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      floating = null;
      return;
    }
    setTimeout(afterCaretMove);
  }

  function markSelection(type: TokenType) {
    if (floating?.kind !== 'selection-category') return;
    session.mark(floating.value, type);
    floating = null;
  }

  function recategorise(type: TokenType) {
    if (floating?.kind !== 'span-category') return;
    session.mark(floating.span.value, type);
    floating = null;
  }
</script>

<div class="composer">
  <div {@attach mirrorLayer} class="mirror doc-metrics" aria-hidden="true">
    <!-- Keyed by index on purpose: segments are positional slices of the
         document, recomputed wholesale, with no identity beyond their order. -->
    {#each segments as segment, i (i)}
      {#if segment.span}
        <mark
          class={[
            't' + tierOf(segment.span.type),
            segment.span.muted && 'muted',
            ui.hoveredSpans.includes(segment.span.id) && 'focus',
          ]}
          data-sid={segment.span.id}>{segment.text}</mark
        >
      {:else}{segment.text}{/if}
    {/each}
  </div>

  <textarea
    bind:value={session.text}
    {@attach composerField}
    class="doc-metrics"
    spellcheck="false"
    aria-label="Dokument mit personenbezogenen Daten"
    onmouseup={onMouseup}
    onkeyup={onKeyup}
    oninput={() => (floating = null)}
    placeholder="Akte, Protokoll oder E-Mail hier einfügen.

Erkannte personenbezogene Daten werden direkt im Text unterstrichen.
Anklicken, um eine Erkennung zu prüfen oder zu verwerfen.
Text markieren, um einen eigenen Platzhalter zu setzen."
  ></textarea>
</div>

{#if floating?.kind === 'selection'}
  <!--
    mousedown + preventDefault: the textarea must keep its selection while the
    chip is clicked, otherwise there is nothing left to mark.
  -->
  <button
    class="sel-chip no-print"
    style:left="{Math.min(Math.max(floating.anchor.left - 95, 10), window.innerWidth - 200)}px"
    style:top="{Math.min(floating.anchor.top, window.innerHeight - 46)}px"
    onmousedown={(e) => {
      e.preventDefault();
      if (floating?.kind === 'selection') {
        floating = { kind: 'selection-category', value: floating.value, anchor: floating.anchor };
      }
    }}
  >
    Als Platzhalter markieren
  </button>
{/if}

{#if floating?.kind === 'selection-category'}
  <!-- No `ignore`: a mousedown back in the textarea should dismiss this, and the
       caret handler then decides whether a new popover is due. -->
  <Popover anchor={floating.anchor} onclose={() => (floating = null)}>
    <CategoryMenu label="Kategorie für Auswahl" onpick={markSelection} />
  </Popover>
{/if}

{#if floating?.kind === 'span'}
  <!-- No `ignore`: a mousedown back in the textarea should dismiss this, and the
       caret handler then decides whether a new popover is due. -->
  <Popover anchor={floating.anchor} onclose={() => (floating = null)}>
    <SpanReview
      span={floating.span}
      onmute={() => {
        if (floating?.kind === 'span') session.toggleMute(floating.span.value);
        floating = null;
      }}
      onrecategorise={() => {
        if (floating?.kind === 'span') {
          floating = { kind: 'span-category', span: floating.span, anchor: floating.anchor };
        }
      }}
      onunmark={() => {
        if (floating?.kind === 'span') session.unmark(floating.span.value);
        floating = null;
      }}
    />
  </Popover>
{/if}

{#if floating?.kind === 'span-category'}
  <!-- No `ignore`: a mousedown back in the textarea should dismiss this, and the
       caret handler then decides whether a new popover is due. -->
  <Popover anchor={floating.anchor} onclose={() => (floating = null)}>
    <CategoryMenu label="Neue Kategorie" onpick={recategorise} />
  </Popover>
{/if}

<style>
  .composer {
    position: relative;
  }

  /*
   * Shared metrics. The mirror and the textarea MUST agree on every one of
   * these, or the underlines drift away from the words they belong to.
   */
  .doc-metrics {
    font-family: var(--sans);
    font-size: 14.5px;
    line-height: 1.85;
    letter-spacing: 0;
    padding: 22px 26px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: normal;
    border: 0;
    margin: 0;
    text-align: left;
    tab-size: 4;
  }

  .mirror {
    position: absolute;
    inset: 0;
    color: transparent;
    pointer-events: none;
    user-select: none;
    overflow: hidden;
  }

  textarea {
    position: relative;
    display: block;
    width: 100%;
    min-height: 320px;
    resize: none;
    overflow: hidden;
    background: transparent;
    color: var(--ink);
    outline: none;
    caret-color: var(--navy);
  }
  textarea::placeholder {
    color: var(--ink3);
  }

  /*
   * Underline, not a box. A boxed span inside running text reads as a form
   * field and fights the document identity; an underline reads as an
   * annotation, which is what a detection is.
   */
  .mirror mark {
    color: transparent;
    background: var(--tier-soft);
    border-bottom: 2px solid var(--tier);
    border-radius: 1px;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .mirror mark.muted {
    background: none;
    border-bottom: 1px dotted var(--ink3);
  }
  .mirror mark.focus {
    outline: 1px solid var(--ink2);
    outline-offset: 1px;
  }

  .sel-chip {
    position: fixed;
    z-index: 118;
    height: 30px;
    padding: 0 13px;
    background: var(--navy);
    color: var(--on-navy);
    border: 0;
    border-radius: 3px;
    cursor: pointer;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.4px;
    box-shadow: var(--lift2);
  }

  @media (max-width: 620px) {
    .doc-metrics {
      padding: 16px;
      font-size: 14px;
    }
  }
</style>
