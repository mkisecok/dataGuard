<!--
  @component
  Stage I — Eingabe.

  Collapses to a one-line summary once something has been transmitted, so the
  answer gets the screen without the document ever leaving the page. Clicking
  "Bearbeiten" brings it back.
-->
<script lang="ts">
  import { session } from '../state/session.svelte';
  import { canTransmit, transmit } from '../state/transmit';
  import { config } from '../state/config.svelte';
  import Composer from './Composer.svelte';
  import InstructionField from './InstructionField.svelte';
  import PreviewPanel from './PreviewPanel.svelte';
  import SampleMenu from './SampleMenu.svelte';

  const plural = $derived(session.findings.length === 1 ? 'Ersetzung' : 'Ersetzungen');
</script>

<section class="sheet">
  {#if session.collapsed}
    <div class="strip">
      <span class="numeral">I.</span>
      <span>Eingabe</span>
      <!-- Separator as a string expression: Svelte trims literal whitespace at
           block and element boundaries, an expression it leaves alone. -->
      <span class="strip-facts">
        <b>{session.findings.length}</b>
        {plural}{#if session.art9Count}{' · '}<span class="art9"
            >{session.art9Count} × Art. 9</span
          >{/if}
      </span>
      <div class="stage-tools no-print">
        <button class="btn" onclick={() => (session.collapsed = false)}>Bearbeiten</button>
      </div>
    </div>
  {:else}
    <div class="stage-head">
      <span class="numeral">I.</span>
      <h2>Eingabe</h2>
      <span class="head-note">Erkennung läuft live · nichts verlässt den Browser</span>
      <div class="stage-tools no-print">
        <SampleMenu />
        <button class="btn" onclick={() => session.load('')}>Leeren</button>
      </div>
    </div>

    <Composer />
    <InstructionField />

    <div class="send-row no-print">
      <button class="btn-send" disabled={!canTransmit()} onclick={transmit}>
        {session.transmitting ? 'Sendet …' : 'Senden ▸'}
      </button>

      <span class="send-hint" class:err={!config.ready && session.hasText}>
        {#if session.transmitting}
          Übertragung läuft …
        {:else if !session.hasText}
          Text einfügen — die Erkennung startet automatisch.
        {:else if !config.ready}
          Kein Modell konfiguriert.
          <button class="link-btn" onclick={() => (config.open = true)}>Jetzt einrichten</button>
        {:else}
          {session.findings.length}
          {plural}{#if session.art9Count}{' · '}<span class="art9"
              >{session.art9Count} × Art. 9</span
            >{/if}
          · <kbd>Strg</kbd> + <kbd>Enter</kbd>
        {/if}
      </span>
    </div>

    <PreviewPanel />
  {/if}
</section>

<style>
  .send-row {
    border-top: 1px solid var(--rule2);
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .send-hint {
    font-size: 11.5px;
    color: var(--ink3);
    flex: 1;
    min-width: 140px;
    line-height: 1.5;
  }
  .send-hint.err {
    color: var(--wax);
  }
  .send-hint .art9 {
    color: var(--wax);
  }

  kbd {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink2);
    border: 1px solid var(--rule);
    border-radius: 2px;
    padding: 1px 4px;
    background: var(--sheet2);
  }

  @media (max-width: 620px) {
    .send-row {
      padding-left: 16px;
      padding-right: 16px;
    }
    .btn-send {
      width: 100%;
    }
  }
</style>
