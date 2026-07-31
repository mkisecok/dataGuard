<!--
  @component
  Header: identity, the "stays local" stamp, and the model status pill.

  The pill replaces what used to be a permanently visible provider/model/key
  form. Once configured it is four words of status; unconfigured it turns red and
  says so, because a tool that silently cannot send is worse than one that admits
  it up front.
-->
<script lang="ts">
  import { config } from '../state/config.svelte';
  import { theme } from '../state/theme.svelte';
</script>

<header>
  <span class="logo">Data<em>Guard</em><span class="logo-sub">Pseudonymisierung nach DSGVO</span></span>
  <span class="stamp">lokal · kein Server</span>

  <div class="head-right no-print">
    <button
      class="pill"
      class:unset={!config.ready}
      aria-haspopup="dialog"
      onclick={() => (config.open = true)}
    >
      <span class="pill-model">
        {config.ready ? `${config.meta.label} · ${config.effectiveModel}` : 'Modell konfigurieren'}
      </span>
      {#if config.ready}
        <span class="pill-flag" class:warn={config.meta.third}>{config.meta.region}</span>
      {/if}
      <span class="pill-gear" aria-hidden="true">⚙</span>
    </button>

    <button
      class="icon-btn"
      title="Darstellung wechseln"
      aria-label="Darstellung wechseln"
      onclick={() => theme.toggle()}
    >
      ◐
    </button>
  </div>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 60;
    background: var(--sheet);
    border-bottom: 1px solid var(--rule);
    padding: 0 clamp(16px, 3vw, 40px);
    height: 60px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo {
    font-family: var(--serif);
    font-size: 21px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: var(--ink);
  }
  /* The only place the Art. 9 red appears outside a data context — as the
     wordmark's seal, which is the point of the identity. */
  .logo em {
    font-style: normal;
    color: var(--wax);
  }
  .logo-sub {
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 400;
    color: var(--ink3);
    margin-left: 10px;
    letter-spacing: 0;
  }

  .stamp {
    font-family: var(--mono);
    font-size: 9.5px;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--seal);
    border: 1px solid var(--seal);
    border-radius: 2px;
    padding: 3px 8px;
    white-space: nowrap;
  }

  .head-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pill {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 32px;
    padding: 0 12px;
    border: 1px solid var(--rule);
    border-radius: 3px;
    background: var(--sheet2);
    cursor: pointer;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--ink2);
    transition: border-color 0.14s;
  }
  .pill:hover {
    border-color: var(--navy);
  }
  .pill.unset {
    border-color: var(--wax);
    color: var(--wax);
    background: var(--wax-soft);
  }

  .pill-model {
    color: var(--ink);
  }
  .pill.unset .pill-model {
    color: inherit;
  }

  .pill-flag {
    font-size: 9.5px;
    letter-spacing: 0.8px;
    color: var(--ink3);
  }
  /* Third-country transfer: flagged on the pill, not buried in the panel. */
  .pill-flag.warn {
    color: var(--wax);
  }

  .pill-gear {
    color: var(--ink3);
    font-size: 12px;
  }

  @media (max-width: 620px) {
    header {
      height: auto;
      padding: 10px 14px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .logo {
      font-size: 18px;
    }
    .logo-sub,
    .stamp {
      display: none;
    }
    .head-right {
      width: 100%;
    }
    .pill {
      flex: 1;
    }
  }
</style>
