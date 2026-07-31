<!--
  @component
  "What the model receives" — the pseudonymized document, tokens rendered as
  chips.

  Collapsed by default and never blocking. It exists so the claim this tool makes
  is *checkable*: a user who does not believe the mapping stays local can read
  the exact outgoing text before pressing send.

  Tokens show their category on hover and nothing else. Revealing the original
  here would defeat the panel's purpose.
-->
<script lang="ts">
  import { displayFor } from '../lib/display';
  import type { TokenType } from '../lib/types';
  import { session } from '../state/session.svelte';

  let open = $state(false);
  let copied = $state(false);

  /** Placeholder → type, so a chip can be coloured by tier. */
  const typeByToken = $derived.by(() => {
    const out: Record<string, TokenType> = {};
    for (const value of Object.keys(session.mapping)) {
      const entry = session.mapping[value]!;
      out[entry.replacement] = entry.type;
    }
    return out;
  });

  /** Split on placeholders, keeping them as delimiters. */
  const parts = $derived(session.pseudoText.split(/(«[A-Z_]+?_\d+»)/g));

  const isToken = (s: string) => /^«[A-Z_]+?_\d+»$/.test(s);

  async function copy() {
    await navigator.clipboard.writeText(session.pseudoText);
    copied = true;
    setTimeout(() => (copied = false), 1600);
  }
</script>

<div class="preview-zone">
  <button
    class="disc"
    aria-expanded={open}
    aria-controls="preview-body"
    onclick={() => (open = !open)}
  >
    Vorschau — was das Modell erhält
    <span class="marker" aria-hidden="true">▾</span>
  </button>

  {#if open}
    <div class="preview-body" id="preview-body">
      <div class="preview-text">
        {#if session.hasText}
          {#each parts as part, i (i)}
            {#if isToken(part)}
              {@const display = displayFor(typeByToken[part] ?? 'CUSTOM')}
              <span class="tok t{display.tier}" title={display.label}>{part}</span>
            {:else}{part}{/if}
          {/each}
        {:else}
          <span class="empty">Noch kein Text eingegeben.</span>
        {/if}
      </div>

      <div class="preview-actions">
        <button class="btn" class:ok={copied} onclick={copy} disabled={!session.hasText}>
          {copied ? 'Kopiert' : 'Pseudonymisierten Text kopieren'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .preview-zone {
    padding: 0 24px 4px;
  }

  .preview-body {
    padding: 4px 0 18px;
  }

  .preview-text {
    font-family: var(--sans);
    font-size: 13.5px;
    line-height: 1.95;
    color: var(--ink2);
    white-space: pre-wrap;
    overflow-wrap: break-word;
    background: var(--sheet2);
    border: 1px solid var(--rule2);
    border-radius: 3px;
    padding: 18px 20px;
    max-height: 460px;
    overflow: auto;
  }

  .empty {
    color: var(--ink3);
    font-size: 13px;
  }

  .tok {
    font-family: var(--mono);
    font-size: 11.5px;
    font-weight: 500;
    padding: 1px 5px;
    border-radius: 2px;
    border: 1px solid var(--tier);
    background: var(--tier-soft);
    color: var(--tier);
    cursor: help;
    white-space: nowrap;
  }

  .preview-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }

  @media (max-width: 620px) {
    .preview-zone {
      padding-left: 16px;
      padding-right: 16px;
    }
  }
</style>
