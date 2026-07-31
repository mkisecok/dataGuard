<!--
  @component
  Layout shell: document column on the left, audit rail on the right.

  Stages appear in order and never as separate screens — I. Eingabe collapses in
  place, II. Übermittlung and III. Antwort are appended below it. The whole point
  of the rewrite is that a user never has to carry text between windows.
-->
<script lang="ts">
  import AnswerStage from './components/AnswerStage.svelte';
  import AppHeader from './components/AppHeader.svelte';
  import DetectionRail from './components/DetectionRail.svelte';
  import InputStage from './components/InputStage.svelte';
  import ModelConfigPanel from './components/ModelConfigPanel.svelte';
  import TransmitStage from './components/TransmitStage.svelte';
  import { config } from './state/config.svelte';
  import { session } from './state/session.svelte';
  import { canTransmit, transmit } from './state/transmit';

  // Global send shortcut. The instruction field has its own handler so that a
  // press there does not also bubble to this one.
  function onKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      if ((event.target as HTMLElement | null)?.id === 'instr') return;
      event.preventDefault();
      if (canTransmit()) transmit();
    }
    if (event.key === 'Escape') config.open = false;
  }
</script>

<svelte:window onkeydown={onKeydown} />

<AppHeader />

<div class="wrap">
  <div class="column">
    <InputStage />

    {#if session.transmit}
      <TransmitStage />
    {/if}

    {#if session.rawAnswer || session.restored}
      <AnswerStage />
    {/if}
  </div>

  <DetectionRail />
</div>

{#if config.open}
  <ModelConfigPanel />
{/if}

<style>
  .wrap {
    max-width: 1340px;
    margin: 0 auto;
    padding: 28px clamp(16px, 3vw, 40px) 96px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 306px;
    gap: 28px;
    align-items: start;
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-width: 0;
  }

  @media (max-width: 1080px) {
    .wrap {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 620px) {
    .wrap {
      padding: 16px 14px 88px;
      gap: 16px;
    }
  }
</style>
