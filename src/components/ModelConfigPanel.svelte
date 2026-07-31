<!--
  @component
  Model configuration as a slide-over. Opens once on first visit, then lives
  behind the header pill.

  The Art. 44 transfer note is not boilerplate. Four of the five providers are
  US-hosted, and sending a German case file — even a pseudonymized one — to a
  third country is a decision with legal weight. The panel states which it is
  before the user commits.
-->
<script lang="ts">
  import { PROVIDER_IDS, PROVIDER_META } from '../lib/providers';
  import type { ProviderId } from '../lib/types';
  import { CUSTOM_MODEL, config } from '../state/config.svelte';

  const transferHead = $derived(
    config.meta.third
      ? 'Art. 44 DSGVO — Drittlandübermittlung'
      : config.providerId === 'ollama'
        ? 'Keine Übermittlung'
        : 'Verarbeitung in der EU',
  );
</script>

<div
  class="scrim no-print"
  role="presentation"
  onclick={() => (config.open = false)}
></div>

<!-- A plain <div>: role="dialog" is interactive, and <aside> is not, so the two
     cannot be combined. -->
<div class="slideover no-print" role="dialog" aria-modal="true" aria-labelledby="cfg-title">
  <div class="so-head">
    <h2 id="cfg-title">Modell konfigurieren</h2>
    <button class="icon-btn" aria-label="Schließen" onclick={() => (config.open = false)}>✕</button>
  </div>

  <div class="so-body">
    <div class="field">
      <label for="provider">Anbieter</label>
      <select
        id="provider"
        value={config.providerId}
        onchange={(e) => (config.providerId = e.currentTarget.value as ProviderId)}
      >
        {#each PROVIDER_IDS as id (id)}
          <option value={id}>
            {PROVIDER_META[id].label} — {PROVIDER_META[id].region === 'LOKAL'
              ? 'lokal'
              : PROVIDER_META[id].region}
          </option>
        {/each}
      </select>
    </div>

    <div class="field">
      <label for="model">Modell</label>
      <select id="model" bind:value={config.model}>
        {#each config.provider.models as model (model)}
          <option value={model}>{model}</option>
        {/each}
        <option value={CUSTOM_MODEL}>eigene Modell-ID …</option>
      </select>
      {#if config.isCustomModel}
        <input
          type="text"
          bind:value={config.customModel}
          placeholder="eigene Modell-ID"
          aria-label="Eigene Modell-ID"
        />
      {/if}
    </div>

    {#if config.provider.needsKey}
      <div class="field">
        <label for="api-key">API-Key</label>
        <div class="field-row">
          <input
            id="api-key"
            type="password"
            autocomplete="off"
            bind:value={config.key}
            placeholder={config.provider.keyPlaceholder}
          />
          <button
            class="btn"
            title="Key aus diesem Browser entfernen"
            onclick={() => config.clearKey()}
          >
            Löschen
          </button>
        </div>
        <p class="field-hint">
          Wird ausschließlich im <code>localStorage</code> dieses Browsers gespeichert und direkt an
          den Anbieter gesendet.
        </p>
      </div>
    {/if}

    {#if config.provider.needsUrl}
      <div class="field">
        <label for="base-url">Base URL</label>
        <input id="base-url" type="text" bind:value={config.baseUrl} placeholder="http://localhost:11434" />
        <p class="field-hint">
          Für <code>file://</code>-Seiten muss Ollama mit <code>OLLAMA_ORIGINS=*</code> gestartet
          werden.
        </p>
      </div>
    {/if}

    <div class="transfer" class:warn={config.meta.third}>
      <span class="t-head">{transferHead}</span>
      {config.meta.note} Gesendet werden ausschließlich der pseudonymisierte Text und Ihre
      Anweisung — niemals das Mapping.
    </div>
  </div>

  <div class="so-foot">
    <button class="btn-send" onclick={() => (config.open = false)}>Übernehmen</button>
    <span class="field-hint">{config.ready ? 'Bereit' : 'Modell oder Key fehlt'}</span>
  </div>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(25, 31, 41, 0.32);
    backdrop-filter: blur(1.5px);
    animation: fade 0.16s ease;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .slideover {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 101;
    width: min(400px, 100vw);
    background: var(--sheet);
    border-left: 1px solid var(--rule);
    box-shadow: var(--lift2);
    display: flex;
    flex-direction: column;
    animation: slidein 0.2s cubic-bezier(0.2, 0.7, 0.3, 1);
  }

  @keyframes slidein {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .so-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 22px 14px;
    border-bottom: 1px solid var(--rule);
  }
  .so-head h2 {
    font-family: var(--serif);
    font-size: 18px;
    font-weight: 600;
  }
  .so-head .icon-btn {
    margin-left: auto;
  }

  .so-body {
    padding: 20px 22px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .so-foot {
    padding: 14px 22px;
    border-top: 1px solid var(--rule);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .transfer {
    border: 1px solid var(--rule);
    border-left: 3px solid var(--seal);
    background: var(--sheet2);
    padding: 11px 13px;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--ink2);
  }
  .transfer.warn {
    border-left-color: var(--wax);
  }

  .t-head {
    display: block;
    font-family: var(--mono);
    font-size: 9.5px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--seal);
    margin-bottom: 4px;
  }
  .transfer.warn .t-head {
    color: var(--wax);
  }
</style>
