<!--
  @component
  Stage III — Antwort, with real values written back locally.

  Two things here are load-bearing rather than decorative:

  - The leftover warning. If the model invented or mangled a placeholder, the
    restored text silently *loses* a value — a reader would see a sentence that
    looks complete but names nobody. Naming the unmatched tokens is the only
    honest option.
  - The placeholder-view toggle. It lets the user see exactly the text the model
    produced, which is what you need in order to tell a restore bug from a model
    mistake.
-->
<script lang="ts">
  import { session } from '../state/session.svelte';

  let copied = $state(false);

  const shown = $derived(
    session.showRaw ? session.rawAnswer : (session.restored?.text ?? ''),
  );

  async function copy() {
    if (!shown) return;
    await navigator.clipboard.writeText(shown);
    copied = true;
    setTimeout(() => (copied = false), 1600);
  }
</script>

<section class="sheet">
  <div class="stage-head">
    <span class="numeral">III.</span>
    <h2>Antwort</h2>
    <span class="head-note">
      {#if session.restored}
        {session.restored.count
          ? `${session.restored.count} Platzhalter lokal zurückgeschrieben`
          : 'Keine Platzhalter in der Antwort'}
      {/if}
    </span>
    <div class="stage-tools no-print">
      <button
        class="btn"
        class:on={session.showRaw}
        onclick={() => (session.showRaw = !session.showRaw)}
      >
        {session.showRaw ? 'Klartext-Fassung' : 'Platzhalter-Fassung'}
      </button>
      <button class="btn" class:ok={copied} onclick={copy}>
        {copied ? 'Kopiert' : 'Kopieren'}
      </button>
    </div>
  </div>

  {#if session.restored}
    {@const r = session.restored}
    {#if r.leftover.length}
      <div class="notice">
        {r.leftover.length}
        {r.leftover.length > 1 ? 'Platzhalter konnten' : 'Platzhalter konnte'} nicht zugeordnet
        werden — das Modell hat sie verändert. Bitte manuell prüfen:
        {#each r.leftover as token, i (token)}{i > 0 ? ', ' : ''}<code>{token}</code>{/each}
      </div>
    {:else if r.count === 0 && r.total > 0}
      <div class="notice info">
        Die Antwort enthielt keine Platzhalter — es wurde nichts zurückgeschrieben.
      </div>
    {/if}
  {/if}

  <div class="answer" class:placeholder-view={session.showRaw}>{shown}</div>
</section>

<style>
  .notice {
    margin: 16px 24px 0;
  }

  .answer {
    padding: 22px 26px;
    font-family: var(--sans);
    font-size: 14.5px;
    line-height: 1.9;
    color: var(--ink);
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }

  /* The raw view is machine output; monospace makes mangled tokens obvious. */
  .answer.placeholder-view {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--ink2);
  }

  @media (max-width: 620px) {
    .answer {
      padding: 18px 16px;
    }
    .notice {
      margin-left: 16px;
      margin-right: 16px;
    }
  }
</style>
