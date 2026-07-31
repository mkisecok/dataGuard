<!--
  @component
  The instruction sent alongside the document.

  This is the one deliberate exception to "one input field", and it is a safety
  requirement rather than a layout preference: this text is transmitted
  **verbatim and unpseudonymized**. Merging it into the protected document would
  make it impossible to show the user which of their words are shielded and which
  are not, so it gets its own surface, its own background, and a red
  `ungefiltert` marker.
-->
<script lang="ts">
  import { session } from '../state/session.svelte';
  import { transmit } from '../state/transmit';
</script>

<div class="instruction">
  <div class="instruction-label">
    <label for="instr">Anweisung an das Modell</label>
    <span class="flag-raw" title="Dieses Feld wird unverändert übertragen und nicht pseudonymisiert.">
      ungefiltert
    </span>
  </div>
  <input
    id="instr"
    type="text"
    bind:value={session.instruction}
    onkeydown={(e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        transmit();
      }
    }}
    placeholder="z. B. Fasse diese Akte in fünf Sätzen zusammen"
  />
</div>

<style>
  .instruction {
    border-top: 1px solid var(--rule2);
    padding: 14px 26px 16px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    /* Different surface from the composer: the boundary has to be visible. */
    background: var(--sheet2);
  }

  .instruction-label {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .instruction-label label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.1px;
    text-transform: uppercase;
    color: var(--ink3);
  }

  .flag-raw {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.9px;
    text-transform: uppercase;
    color: var(--wax);
    border: 1px solid var(--wax);
    border-radius: 2px;
    padding: 1px 6px;
    cursor: help;
  }

  input {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    font-family: var(--sans);
    font-size: 14px;
    background: var(--sheet);
    color: var(--ink);
    border: 1px solid var(--rule);
    border-radius: 3px;
    outline: none;
  }
  input:focus {
    border-color: var(--navy);
  }
  input::placeholder {
    color: var(--ink3);
  }

  @media (max-width: 620px) {
    .instruction {
      padding: 12px 16px 14px;
    }
  }
</style>
