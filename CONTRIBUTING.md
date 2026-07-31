# Contributing to DataGuard

Svelte 5, TypeScript, Vite. No framework beyond that, no UI library, no CSS framework.

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm check    # svelte-check — must be 0 errors, 0 warnings
pnpm build    # emits a single self-contained dist/index.html
```

---

## The one rule

**The mapping never leaves the browser.**

`Mapping` (original value → placeholder) is the only thing standing between a
case file and a third-party API. Any change that touches a network request has to
be checked against that.

The narrow waist is [`callModel`](src/lib/providers.ts). It takes the
pseudonymized payload as a plain `string` and has no access to the mapping at
all — so keep it that way. If you need more context in a request, thread it
through `CallArgs`, do not reach for the session.

There is one deliberate hole, and it is visible in the UI: the instruction field
is transmitted **verbatim**. That is why it has its own surface, its own
background and a red `ungefiltert` badge. Do not merge it into the composer to
"simplify the layout" — the separation *is* the feature.

---

## Layout

```
src/
├─ lib/            pure TypeScript, no Svelte imports — the testable core
│  ├─ types.ts       shared vocabulary
│  ├─ rules.ts       the 15 detectors + priority order + groups
│  ├─ detect.ts      detect() → spans, buildRun() → outgoing text + mapping
│  ├─ restore.ts     write placeholders back, report the ones that did not match
│  ├─ display.ts     TokenType → label + tier
│  ├─ providers.ts   five model transports + the GDPR facts about each
│  ├─ samples.ts     synthetic demo documents
│  └─ storage.ts     localStorage, wrapped so it cannot throw
├─ state/          reactive classes (.svelte.ts)
│  ├─ session.svelte.ts   the document and its derived detection chain
│  ├─ config.svelte.ts    provider / model / credential, persisted
│  ├─ theme.svelte.ts     light / dark
│  ├─ ui.svelte.ts        ephemeral cross-component UI state
│  └─ transmit.ts         the send action
├─ components/     one concern each
└─ styles/         tokens.css · base.css · primitives.css
```

`lib/` deliberately imports nothing from `state/` or `svelte`. Detection is a
pure function of `(text, activeRules, manualMarks, mutedValues)`, which is what
makes it reviewable — and is where a test suite should start (see *Wanted*).

---

## Conventions

**Runes only.** `$state`, `$derived`, `$props`, `$effect`. No stores, no
`export let`, no `on:click`, no `<slot>`.

**Prefer `$derived` over `$effect`.** The whole detection pipeline is a derived
chain; there is not a single `$effect` in `state/`. If you reach for one, check
whether the value can be derived instead.

**Prefer `{@attach}` over `bind:this`.** Where a component needs a real DOM node
— the composer textarea, the popover — an attachment both captures the node and
does the DOM work, and re-runs when the reactive values it reads change. See
`composerField` in [`Composer.svelte`](src/components/Composer.svelte).

**Reactive collections.** Use `SvelteSet` / `SvelteMap` from `svelte/reactivity`
when mutation has to trigger an update. `session.activeRules` is a `SvelteSet`
precisely so `activeRules.delete(key)` re-runs detection.

**Run the autofixer.** If you have the Svelte MCP server available, run
`svelte-autofixer` on any component you touch. `pnpm check` must come back clean
either way.

**Colour comes from tiers, never from components.** A component writes
`class="… t{tier}"` and reads `var(--tier)` / `var(--tier-soft)`.
[`tokens.css`](src/styles/tokens.css) owns the mapping.

> The sealing-wax red is reserved for Art. 9 GDPR data and is used nowhere else.
> An earlier version gave twelve PII types twelve colours, which made health data
> look like just another hue instead of the category carrying the highest legal
> duty. Please do not reintroduce a rainbow.

No emoji as iconography. `§` and `⌁` render identically on every platform; emoji
do not, and they read as "generic AI app".

**German UI, English code.** All user-facing strings are German. Identifiers,
comments and commit messages are English. The one English string a user never
sees is `SYSTEM_PROMPT` — instruction-following for verbatim-token tasks is more
reliable in English across all five providers.

---

## Two things that look like bugs and are not

**No IBAN mod-97, no Luhn check.** Deliberate. This is a PII stripper, so recall
beats precision: rejecting a number because it fails a checksum would let a real
but mistyped IBAN through to the model. That is the exact failure the tool exists
to prevent.

**Names are only detected with context** — a title, a person-label followed by a
colon, or a known first name. German capitalises every noun, so a blind
"two capitalised words" rule tags *Nächster Termin* as a person. The cost is that
an unknown name in free text is missed and has to be marked by hand; that is
stated in the UI under *Rechtliche Hinweise*.

---

## Offsets, not string replacement

`detect()` returns character offsets rather than a rewritten string. Two reasons,
and both matter:

1. Live highlighting needs positions.
2. Replacement by value is **wrong**. The original implementation did
   `text.split(original).join(placeholder)`, a global substring rewrite — so a
   detected name `Jan` also corrupted the word `Januar`, and a detected date
   rewrote every other copy of that date whether or not it had been detected
   there.

Overlaps resolve by an explicit rule in `resolveOverlaps`: detector priority
first, then leftmost, then longest. Span edges are whitespace-trimmed, because a
variable-length lookbehind like `(?<=Diagnose[:\s]{1,4})` otherwise lets a match
swallow its leading space and renders as `Diagnose:«HEALTH_DATA_1»`.

If you add a rule, put it in `DETECT_ORDER` at the position its specificity
deserves. Loose patterns go last.

---

## The composer

A `<div>` mirror behind a transparent `<textarea>`, both on the shared
`.doc-metrics` class. The mirror draws the underlines; the textarea draws the
glyphs and owns interaction.

Not `contenteditable` — that breaks native undo, IME composition and spellcheck,
which is a real cost in a tool whose job is editing prose. The price is that the
two boxes must agree on **every** font and spacing value, which is why they share
one class. If highlights ever drift from their words, that class is the first
place to look.

---

## Wanted

- **Unit tests for `lib/`.** Highest-value contribution available. `detect`,
  `buildRun` and `restoreFrom` are pure functions with no test suite yet. The
  `Januar` case and the `Diagnose:` spacing case are good first fixtures.
- **Better name detection** without wrecking precision on German nouns. An
  NER model would be a large change — discuss in an issue first, and it must stay
  local (WASM/ONNX in-browser, no inference API).
- **More rules**: Austrian and Swiss formats, EU VAT IDs, vehicle registrations.
- **Accessibility**: the composer's click-a-highlight interaction is
  mouse-first. A keyboard path to review the span under the caret is missing.
- **i18n.** Strings are inline German today. Extracting them is welcome; keep
  German as the default.

Please open an issue before large changes. Small fixes — a rule, a bug, a
tightened caveat — just send the PR.

---

## Licence

MIT. By contributing you agree your work ships under it.
