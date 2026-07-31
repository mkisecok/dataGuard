<!--
  @component
  Floating panel anchored to a rect in viewport coordinates.

  Anchored to a `DOMRect` rather than to an element, because the most important
  caller anchors to a highlight inside the composer — and the thing with real
  geometry there is the mirror `<mark>`, not the element the user clicked.

  Flips above the anchor when it would overflow the bottom of the viewport.
  Closes on Escape and on a mousedown outside itself; pass `ignore` (usually the
  trigger) so clicking the trigger toggles instead of closing-then-reopening.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    anchor: DOMRect;
    onclose: () => void;
    /** Element whose mousedowns must not count as "outside". */
    ignore?: HTMLElement | null;
    children: Snippet;
  }

  let { anchor, onclose, ignore = null, children }: Props = $props();

  // Not $state: only ever read from an event handler, never from the template.
  let el: HTMLDivElement | null = null;

  /**
   * Measure, then place. Writes straight to the node instead of going through
   * reactive state — position is a function of the rendered size, so it cannot
   * be derived without first rendering.
   *
   * Re-runs whenever `anchor` changes, because it reads it.
   */
  function place(node: HTMLDivElement) {
    el = node;
    const { left: aLeft, top: aTop, bottom: aBottom } = anchor;
    const { offsetWidth: w, offsetHeight: h } = node;

    let l = aLeft;
    let t = aBottom + 6;
    if (l + w > window.innerWidth - 10) l = window.innerWidth - w - 10;
    if (t + h > window.innerHeight - 10) t = Math.max(10, aTop - h - 6);

    node.style.left = `${Math.max(10, l)}px`;
    node.style.top = `${t}px`;
  }

  function onWindowMousedown(event: MouseEvent) {
    const target = event.target as Node | null;
    if (!target) return;
    if (el?.contains(target)) return;
    if (ignore?.contains(target)) return;
    onclose();
  }
</script>

<svelte:window onmousedown={onWindowMousedown} onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div {@attach place} class="pop no-print">
  {@render children()}
</div>

<style>
  .pop {
    position: fixed;
    /* Parked off-screen until `place` runs, so there is no first-frame flash. */
    left: -9999px;
    top: -9999px;
    z-index: 120;
    background: var(--sheet);
    border: 1px solid var(--rule);
    border-radius: 3px;
    box-shadow: var(--lift2);
    min-width: 210px;
    max-width: 290px;
    animation: fade 0.12s ease;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
