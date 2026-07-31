<!--
  @component
  Stage II — Übermittlung. States what went where, and holds the manual paste
  fallback for when a direct call cannot work.

  The fallback is not a nicety: browser calls to most providers are blocked by
  CORS unless they explicitly allow it, so without a copy/paste route the tool
  would simply be unusable for some users. It opens itself when a request fails.
-->
<script lang="ts">
  import { session } from '../state/session.svelte';
  import { restoreManual } from '../state/transmit';
  import { ui } from '../state/ui.svelte';

  let pasted = $state('');
</script>

<section class="sheet">
  <div class="strip">
    <span class="numeral">II.</span>
    <span>Übermittlung</span>
    {#if session.transmit}
      <span class="strip-facts">
        <b>{session.transmit.target}</b>
        · <span class="tone tone-{session.transmit.tone}">{session.transmit.message}</span>
      </span>
    {/if}
    <div class="stage-tools no-print">
      <button
        class="btn"
        class:on={ui.manualOpen}
        aria-expanded={ui.manualOpen}
        aria-controls="manual-zone"
        onclick={() => (ui.manualOpen = !ui.manualOpen)}
      >
        Antwort manuell einfügen
      </button>
    </div>
  </div>

  {#if ui.manualOpen}
    <div class="manual-zone" id="manual-zone">
      <p class="field-hint">
        Falls das Modell nicht direkt erreichbar ist (CORS, kein Key): pseudonymisierten Text oben
        kopieren, im Chat des Anbieters senden und die Antwort hier einfügen.
      </p>
      <textarea
        bind:value={pasted}
        spellcheck="false"
        aria-label="Antwort des Modells"
        placeholder="Antwort des Modells hier einfügen — sie sollte die «TYPE_N»-Platzhalter noch enthalten."
      ></textarea>
      <div class="manual-row">
        <button class="btn" disabled={!pasted.trim()} onclick={() => restoreManual(pasted)}>
          Platzhalter zurückschreiben
        </button>
      </div>
    </div>
  {/if}
</section>

<style>
  .tone-busy {
    color: var(--ochre);
  }
  .tone-ok {
    color: var(--seal);
  }
  .tone-error {
    color: var(--wax);
  }

  .manual-zone {
    padding: 0 24px 20px;
  }

  textarea {
    width: 100%;
    min-height: 130px;
    margin-top: 10px;
    padding: 14px 16px;
    font-family: var(--mono);
    font-size: 12.5px;
    line-height: 1.7;
    background: var(--sheet2);
    color: var(--ink);
    border: 1px solid var(--rule);
    border-radius: 3px;
    outline: none;
    resize: vertical;
  }
  textarea:focus {
    border-color: var(--navy);
  }

  .manual-row {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }

  @media (max-width: 620px) {
    .manual-zone {
      padding-left: 16px;
      padding-right: 16px;
    }
  }
</style>
