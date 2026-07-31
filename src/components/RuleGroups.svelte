<!--
  @component
  Per-rule switches, grouped the way the tiers are grouped.

  Collapsed by default: after the first session most users never touch these, and
  a permanently expanded 15-item checklist was the largest thing on the old
  screen. Each rule can be switched off individually, which matters because some
  patterns are deliberately loose.
-->
<script lang="ts">
  import { RULE_GROUPS, RULES, RULE_HINT } from '../lib/rules';
  import type { RuleKey } from '../lib/types';
  import { session } from '../state/session.svelte';

  let open = $state(false);

  const activeCount = $derived(session.activeRules.size);
  const totalCount = $derived(Object.keys(RULES).length);

  function toggle(key: RuleKey) {
    if (session.activeRules.has(key)) session.activeRules.delete(key);
    else session.activeRules.add(key);
  }

  function setGroup(keys: readonly RuleKey[], on: boolean) {
    for (const key of keys) {
      if (on) session.activeRules.add(key);
      else session.activeRules.delete(key);
    }
  }
</script>

<div class="rail-sec">
  <button class="disc" aria-expanded={open} aria-controls="rules-body" onclick={() => (open = !open)}>
    Regeln <span class="count">{activeCount}/{totalCount}</span>
    <span class="marker" aria-hidden="true">▾</span>
  </button>

  {#if open}
    <div class="rules-body" id="rules-body">
      {#each RULE_GROUPS as group (group.id)}
        {@const active = group.keys.filter((k) => session.activeRules.has(k)).length}
        <div class="group" class:art9={group.art9}>
          <div class="group-head">
            <h3>{group.title}</h3>
            <span class="count">{active}/{group.keys.length}</span>
          </div>

          <div class="group-links">
            <button class="link-btn" onclick={() => setGroup(group.keys, true)}>alle</button>
            <span class="sep">·</span>
            <button class="link-btn" onclick={() => setGroup(group.keys, false)}>keine</button>
          </div>

          {#each group.keys as key (key)}
            {@const on = session.activeRules.has(key)}
            <button
              class="rule"
              class:active={on}
              role="checkbox"
              aria-checked={on}
              title={RULE_HINT[key]}
              onclick={() => toggle(key)}
            >
              <span class="dot"></span>
              {RULES[key].label}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .rail-sec {
    border-top: 1px solid var(--rule);
    padding: 0 18px;
  }
  .rail-sec .disc {
    border-bottom: 0;
  }

  .count {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink3);
  }

  .rules-body {
    padding: 4px 0 12px;
  }

  .group {
    margin-bottom: 14px;
  }
  .group:last-child {
    margin-bottom: 4px;
  }

  .group-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 2px;
  }
  .group-head h3 {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
  }
  .group-head .count {
    margin-left: auto;
  }
  .group.art9 .group-head h3,
  .group.art9 .group-head .count {
    color: var(--wax);
  }

  .group-links {
    display: flex;
    gap: 5px;
    align-items: center;
    margin-bottom: 5px;
  }
  .sep {
    color: var(--rule);
    font-size: 9px;
  }

  .rule {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    min-height: 27px;
    padding: 2px 0;
    background: none;
    border: 0;
    cursor: pointer;
    text-align: left;
    font-size: 12.5px;
    color: var(--ink3);
    transition: color 0.12s;
  }
  .rule:hover {
    color: var(--ink);
  }
  .rule.active {
    color: var(--ink);
  }

  .dot {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    border-radius: 2px;
    border: 1px solid var(--rule);
    background: var(--sheet2);
    display: grid;
    place-items: center;
    transition:
      background 0.12s,
      border-color 0.12s;
  }
  .rule.active .dot {
    background: var(--navy);
    border-color: var(--navy);
  }
  /* A small square, not a checkmark glyph — matches the ruled, stamped look. */
  .rule.active .dot::after {
    content: '';
    width: 5px;
    height: 5px;
    background: var(--sheet);
    border-radius: 1px;
  }
  .group.art9 .rule.active .dot {
    background: var(--wax);
    border-color: var(--wax);
  }
</style>
