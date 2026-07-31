/**
 * Shared vocabulary for the whole app. Nothing in here imports Svelte — the
 * detection domain is deliberately framework-free so it can be reasoned about,
 * and eventually unit-tested, on its own.
 */

/**
 * Sensitivity tier. Drives colour, grouping and ordering in the UI.
 *
 * `3` is Art. 9 GDPR (special categories) and owns the one alarming colour in
 * the palette; nothing else is allowed to use it.
 */
export type Tier = 0 | 1 | 2 | 3;

/** One switchable detector. */
export type RuleKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'date'
  | 'passport'
  | 'ip'
  | 'iban'
  | 'creditcard'
  | 'taxid'
  | 'insurance'
  | 'health'
  | 'religion'
  | 'political'
  | 'sexual';

/**
 * Placeholder type written into the outgoing text. Several detectors collapse
 * into `NUMBER` on purpose — the model does not benefit from knowing whether an
 * identifier was an IBAN or a tax ID, and fewer buckets means fewer chances for
 * it to mangle a token.
 */
export type TokenType =
  | 'NAME'
  | 'EMAIL'
  | 'PHONE'
  | 'ADDRESS'
  | 'DATE'
  | 'NUMBER'
  | 'HEALTH_DATA'
  | 'RELIGION'
  | 'POLITICAL'
  | 'SEXUAL_ORIENT'
  | 'CUSTOM';

export interface Rule {
  /** Human label, shown in the rule list. */
  label: string;
  re: RegExp;
  /** Art. 9 GDPR special category. */
  art9?: boolean;
  /** Rejects a regex hit that matched structurally but is not plausible. */
  validate?: (match: string) => boolean;
}

/**
 * A detection, addressed by character offset rather than by value.
 *
 * Offsets are the load-bearing design choice: they make live highlighting
 * possible, and they make replacement exact. Replacing by value with a global
 * substring rewrite means a detected name `Jan` also corrupts the word
 * `Januar`.
 */
export interface Span {
  /** Index in the resolved, document-ordered span list. */
  id: number;
  start: number;
  end: number;
  value: string;
  type: TokenType;
  /** Absent for manual marks, which belong to no detector. */
  ruleKey?: RuleKey;
  /** Detector precedence; lower wins an overlap. Manual marks use -1. */
  prio: number;
  manual: boolean;
  /** User dismissed this detection — it is transmitted in the clear. */
  muted: boolean;
  /** Assigned by `buildRun`; absent while muted. */
  replacement?: string;
}

/** One unique original value and the token that stands in for it. */
export interface Finding {
  original: string;
  /** Empty for muted findings. */
  replacement: string;
  type: TokenType;
  manual: boolean;
  muted: boolean;
  /** Every span that carries this value, for hover cross-highlighting. */
  spanIds: number[];
}

/**
 * original value → placeholder. The one piece of state that must never be
 * transmitted; every code path that builds a request body has to be checked
 * against that.
 */
export type Mapping = Record<string, { replacement: string; type: TokenType }>;

export interface RunResult {
  /** Exactly what the model would receive. */
  text: string;
  mapping: Mapping;
  findings: Finding[];
  /** Dismissed values, kept so the rail can offer to re-enable them. */
  muted: Finding[];
}

export interface RestoreResult {
  text: string;
  /** How many placeholders were successfully written back. */
  count: number;
  /** Placeholder-shaped strings the mapping did not know — model invented or mangled them. */
  leftover: string[];
  /** Size of the mapping used. */
  total: number;
}

export type ProviderId = 'mistral' | 'openai' | 'anthropic' | 'gemini' | 'ollama';

/** Transport definition for one model provider. Purely technical. */
export interface Provider {
  keyPlaceholder: string;
  needsKey: boolean;
  needsUrl?: boolean;
  models: string[];
  endpoint: (model: string, key: string, baseUrl: string) => string;
  headers: (key: string) => Record<string, string>;
  body: (model: string, system: string, user: string) => unknown;
  extract: (data: any) => string | undefined;
}

/** User-facing, GDPR-relevant facts about a provider. */
export interface ProviderMeta {
  label: string;
  /** Shown on the header pill. */
  region: string;
  /** Triggers the Art. 44 third-country warning. */
  third: boolean;
  note: string;
}

export type TransmitTone = 'busy' | 'ok' | 'error';

export interface TransmitState {
  target: string;
  message: string;
  tone: TransmitTone;
}
