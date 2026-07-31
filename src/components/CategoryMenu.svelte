<!--
  @component
  Category picker used both for marking a selection by hand and for
  re-categorising an existing detection.
-->
<script lang="ts">
  import { MANUAL_TYPES, displayFor } from '../lib/display';
  import type { TokenType } from '../lib/types';

  interface Props {
    label: string;
    onpick: (type: TokenType) => void;
  }

  let { label, onpick }: Props = $props();
</script>

<div class="pop-label">{label}</div>
<div class="pop-list">
  {#each MANUAL_TYPES as type (type)}
    {@const display = displayFor(type)}
    <button class="pop-item t{display.tier}" onclick={() => onpick(type)}>
      <span class="swatch"></span>
      {display.label}
      <span class="pop-code">{type}</span>
    </button>
  {/each}
</div>
