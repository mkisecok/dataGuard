<!--
  @component
  One row of the audit trail: placeholder, original value, and the verb that
  changes it.

  Hovering cross-highlights every occurrence of the value in the document, which
  is how a user checks a detection without hunting through the text for it.
-->
<script lang="ts">
  import { displayFor } from '../lib/display';
  import type { Finding } from '../lib/types';
  import { session } from '../state/session.svelte';
  import { ui } from '../state/ui.svelte';

  interface Props {
    finding: Finding;
  }

  let { finding }: Props = $props();

  const display = $derived(displayFor(finding.type));
  const isArt9 = $derived(display.tier === 3);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="find t{display.tier}"
  class:off={finding.muted}
  onmouseenter={() => ui.hover(finding.spanIds)}
  onmouseleave={() => ui.clearHover()}
>
  <!-- § for an ordinary entry, ⌁ for Art. 9. Section marks rather than emoji:
       they render identically everywhere and match the document identity. -->
  <span class="mark" aria-hidden="true">{isArt9 ? '⌁' : '§'}</span>

  <span class="token">
    {#if finding.muted}
      {display.label} — ignoriert
    {:else}
      {finding.replacement}{#if finding.manual}<span class="manual">manuell</span>{/if}
    {/if}
    {#if isArt9}<span class="art9">Art. 9</span>{/if}
  </span>

  <span class="orig" title={finding.original}>{finding.original}</span>

  <button class="link-btn act" onclick={() => session.toggleMute(finding.original)}>
    {finding.muted ? 'Wieder erfassen' : 'Ignorieren'}
  </button>
</div>

<style>
  .find {
    display: grid;
    grid-template-columns: 14px minmax(0, 1fr);
    gap: 0 8px;
    padding: 7px 18px;
    border-left: 2px solid transparent;
    transition:
      background 0.12s,
      border-color 0.12s;
  }
  .find:hover {
    background: var(--sheet2);
    border-left-color: var(--tier);
  }

  .mark {
    font-family: var(--serif);
    font-size: 13px;
    color: var(--ink3);
    line-height: 1.5;
  }
  .find.t3 .mark {
    color: var(--wax);
  }

  .token {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    color: var(--tier);
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .manual {
    color: var(--ink3);
  }

  .art9 {
    font-size: 8.5px;
    letter-spacing: 0.7px;
    color: var(--wax);
    border: 1px solid var(--wax);
    border-radius: 2px;
    padding: 0 4px;
    margin-left: auto;
  }

  .orig {
    grid-column: 2;
    font-size: 12px;
    color: var(--ink2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 1px;
  }

  .act {
    grid-column: 2;
    margin-top: 4px;
    justify-self: start;
  }

  .find.off .token,
  .find.off .orig {
    text-decoration: line-through;
    color: var(--ink3);
  }
</style>
