<!--
  @component
  The audit trail: every value that will be replaced, grouped by tier with
  Art. 9 first.

  Always visible on wide screens, because "which of my sensitive fields did it
  actually catch?" is the question a user has continuously — not one they should
  have to open a panel to answer.

  Scrolls as a single column rather than giving each section its own scroll area.
  An earlier flex layout shared the height between findings and rules, which
  squeezed the findings list — the part you read — down to a few rows whenever the
  rules were expanded.
-->
<script lang="ts">
  import { TIER_LABEL, TIER_ORDER, tierOf } from '../lib/display';
  import { session } from '../state/session.svelte';
  import { ui } from '../state/ui.svelte';
  import FindingRow from './FindingRow.svelte';
  import LegalNotes from './LegalNotes.svelte';
  import RuleGroups from './RuleGroups.svelte';
</script>

<aside class="rail" class:open={ui.railOpen} aria-label="Erkennungen und Regeln">
  <div class="rail-head">
    <h2>Erkannt</h2>
    <span class="tally">{session.findings.length}</span>
    <button class="icon-btn rail-close" aria-label="Schließen" onclick={() => (ui.railOpen = false)}>
      ✕
    </button>
  </div>

  <div class="rail-scroll">
    {#if session.rows.length === 0}
      <p class="empty">
        {#if session.hasText}
          Keine personenbezogenen Daten erkannt. Die Erkennung ist best-effort — Text bitte selbst
          prüfen.
        {:else}
          Noch keine personenbezogenen Daten erkannt. Die Liste füllt sich, während Sie schreiben.
        {/if}
      </p>
    {:else}
      {#each TIER_ORDER as tier (tier)}
        {@const group = session.rows.filter((f) => tierOf(f.type) === tier)}
        {#if group.length}
          <div class="tier-head t{tier}">
            <span class="bar"></span>
            {TIER_LABEL[tier]}
            <span class="tier-count">{group.length}</span>
          </div>
          {#each group as finding (finding.original)}
            <FindingRow {finding} />
          {/each}
        {/if}
      {/each}
    {/if}
  </div>

  <RuleGroups />
  <LegalNotes />
</aside>

<button class="rail-fab no-print" onclick={() => (ui.railOpen = true)}>
  Erkannt <span>{session.findings.length}</span>
</button>

<style>
  .rail {
    position: sticky;
    top: 88px;
    background: var(--sheet);
    border: 1px solid var(--rule);
    border-radius: 3px;
    box-shadow: var(--lift);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 116px);
    overflow-y: auto;
  }

  .rail-head {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 15px 18px 12px;
    background: var(--sheet);
    border-bottom: 1px solid var(--rule);
  }
  .rail-head h2 {
    font-family: var(--serif);
    font-size: 15px;
    font-weight: 600;
  }
  .rail-head .tally {
    margin-left: auto;
  }

  .rail-scroll {
    flex: 0 0 auto;
  }

  .empty {
    padding: 26px 18px;
    font-size: 12.5px;
    color: var(--ink3);
    line-height: 1.7;
  }

  .tier-head {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 12px 18px 5px;
    font-family: var(--mono);
    font-size: 9.5px;
    letter-spacing: 1.1px;
    text-transform: uppercase;
    color: var(--tier);
  }
  .tier-head .bar {
    width: 14px;
    height: 2px;
    flex-shrink: 0;
    background: var(--tier);
  }
  .tier-count {
    margin-left: auto;
  }

  /* Close button and the floating opener only exist in bottom-sheet mode. */
  .rail-close,
  .rail-fab {
    display: none;
  }

  @media (max-width: 1080px) {
    .rail {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      top: auto;
      z-index: 80;
      max-height: 72vh;
      border: 0;
      border-top: 1px solid var(--rule);
      border-radius: 0;
      box-shadow: var(--lift2);
      transform: translateY(100%);
      transition: transform 0.22s cubic-bezier(0.2, 0.7, 0.3, 1);
    }
    .rail.open {
      transform: translateY(0);
    }

    .rail-close {
      display: grid;
    }

    .rail-fab {
      display: block;
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 70;
      height: 42px;
      padding: 0 18px;
      background: var(--sheet);
      border: 1px solid var(--navy);
      border-radius: 3px;
      color: var(--navy);
      cursor: pointer;
      box-shadow: var(--lift2);
      font-family: var(--mono);
      font-size: 11.5px;
      letter-spacing: 0.5px;
    }
  }
</style>
