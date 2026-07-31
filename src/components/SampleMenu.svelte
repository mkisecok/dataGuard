<!--
  @component
  Loads a synthetic sample document. Every value is generated — see
  `lib/samples.ts` — so the detection can be evaluated honestly without pasting a
  real case file into a tool you have not audited yet.
-->
<script lang="ts">
  import { GENERATORS, SAMPLES } from '../lib/samples';
  import { session } from '../state/session.svelte';
  import Popover from './Popover.svelte';

  let trigger = $state<HTMLButtonElement | null>(null);
  let open = $state(false);

  const anchor = $derived(trigger?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0));
</script>

<button bind:this={trigger} class="btn" aria-haspopup="menu" onclick={() => (open = !open)}>
  Beispiel ▾
</button>

{#if open}
  <Popover {anchor} ignore={trigger} onclose={() => (open = false)}>
    <div class="pop-label">Beispielakte einfügen</div>
    <div class="pop-list">
      {#each SAMPLES as sample (sample.id)}
        <button
          class="pop-item t{sample.tier}"
          onclick={() => {
            session.load(GENERATORS[sample.id]());
            open = false;
          }}
        >
          <span class="swatch"></span>
          {sample.label}
          <span class="pop-code">{sample.code}</span>
        </button>
      {/each}
    </div>
  </Popover>
{/if}
