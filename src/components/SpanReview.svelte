<!--
  @component
  Review one detection: what it is, what it will become, and what to do about it.

  The "Erkennung verwerfen" action matters more than it looks. Several rules are
  intentionally loose — the phone pattern is `/\+?[\d \-()]{9,20}/` — so false
  positives are expected by design, and without a way to dismiss one the user's
  only option would be to switch off a whole rule and lose its real hits too.
-->
<script lang="ts">
  import { displayFor } from '../lib/display';
  import type { Span } from '../lib/types';

  interface Props {
    span: Span;
    onmute: () => void;
    onrecategorise: () => void;
    onunmark: () => void;
  }

  let { span, onmute, onrecategorise, onunmark }: Props = $props();

  const display = $derived(displayFor(span.type));
</script>

<div class="pop-head t{display.tier}">
  <div class="pop-type">
    {display.label}{display.tier === 3 ? ' · Art. 9 DSGVO' : ''}
  </div>
  <div class="pop-val">{span.value}</div>
  <div class="pop-tok">
    {span.muted ? 'wird unverändert gesendet' : `→ ${span.replacement ?? ''}`}
  </div>
</div>

<div class="pop-list">
  <button class="pop-item t0" onclick={onmute}>
    <span class="swatch"></span>
    {span.muted ? 'Wieder erfassen' : 'Erkennung verwerfen'}
  </button>
  <button class="pop-item t{display.tier}" onclick={onrecategorise}>
    <span class="swatch"></span>
    Kategorie ändern
  </button>
  {#if span.manual}
    <button class="pop-item t0" onclick={onunmark}>
      <span class="swatch"></span>
      Manuelle Markierung entfernen
    </button>
  {/if}
</div>

<style>
  .pop-head {
    padding: 9px 12px 7px;
    border-bottom: 1px solid var(--rule2);
  }

  .pop-type {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.9px;
    text-transform: uppercase;
    color: var(--tier);
  }

  .pop-val {
    font-size: 12.5px;
    color: var(--ink);
    margin-top: 3px;
    word-break: break-word;
  }

  .pop-tok {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--ink3);
    margin-top: 3px;
  }
</style>
