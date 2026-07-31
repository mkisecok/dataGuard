import type { Provider, ProviderId, ProviderMeta } from './types';

/**
 * Transport definitions. Purely technical — anything the user reads lives in
 * `PROVIDER_META` below.
 */
export const PROVIDERS: Record<ProviderId, Provider> = {
  mistral: {
    keyPlaceholder: 'Mistral API-Key',
    needsKey: true,
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
    endpoint: () => 'https://api.mistral.ai/v1/chat/completions',
    headers: (key) => ({ Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }),
    body: (model, system, user) => ({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    extract: (d) => d?.choices?.[0]?.message?.content,
  },
  openai: {
    keyPlaceholder: 'OpenAI API-Key',
    needsKey: true,
    models: ['gpt-4o', 'gpt-4o-mini'],
    endpoint: () => 'https://api.openai.com/v1/chat/completions',
    headers: (key) => ({ Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }),
    body: (model, system, user) => ({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    extract: (d) => d?.choices?.[0]?.message?.content,
  },
  anthropic: {
    keyPlaceholder: 'Anthropic API-Key',
    needsKey: true,
    models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
    endpoint: () => 'https://api.anthropic.com/v1/messages',
    headers: (key) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      // Required for browser-originated calls; Anthropic blocks them otherwise.
      'anthropic-dangerous-direct-browser-access': 'true',
      'Content-Type': 'application/json',
    }),
    body: (model, system, user) => ({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    extract: (d) => d?.content?.[0]?.text,
  },
  gemini: {
    keyPlaceholder: 'Gemini API-Key',
    needsKey: true,
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
    endpoint: (model, key) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (_model, system, user) => ({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: user }] }],
    }),
    extract: (d) => d?.candidates?.[0]?.content?.parts?.[0]?.text,
  },
  ollama: {
    keyPlaceholder: '',
    needsKey: false,
    needsUrl: true,
    models: ['llama3.1', 'mistral', 'qwen2.5'],
    endpoint: (_model, _key, baseUrl) =>
      (baseUrl.trim() || 'http://localhost:11434').replace(/\/+$/, '') + '/api/chat',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (model, system, user) => ({
      model,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    extract: (d) => d?.message?.content,
  },
};

/**
 * What the user needs to know before transmitting. `third` drives the Art. 44
 * GDPR third-country warning — the tool should not quietly ship a German case
 * file to a US endpoint without saying so.
 */
export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  mistral: {
    label: 'Mistral',
    region: 'EU',
    third: false,
    note: 'Übertragung an api.mistral.ai — in der EU gehostet.',
  },
  openai: {
    label: 'OpenAI',
    region: 'USA',
    third: true,
    note: 'Übertragung an api.openai.com. US-Anbieter — Art. 44 DSGVO (Drittlandübermittlung) ist zu prüfen.',
  },
  anthropic: {
    label: 'Anthropic',
    region: 'USA',
    third: true,
    note: 'Übertragung an api.anthropic.com. US-Anbieter — Art. 44 DSGVO (Drittlandübermittlung) ist zu prüfen.',
  },
  gemini: {
    label: 'Google',
    region: 'USA',
    third: true,
    note: 'Übertragung an generativelanguage.googleapis.com. US-Anbieter — Art. 44 DSGVO (Drittlandübermittlung) ist zu prüfen.',
  },
  ollama: {
    label: 'Ollama',
    region: 'LOKAL',
    third: false,
    note: 'Lokales Modell — es verlässt nichts diesen Rechner.',
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

/**
 * Told to the model as a system prompt. English on purpose: instruction
 * following for verbatim-token tasks is more reliable in English across all
 * five providers, and the user never reads this string.
 */
export const SYSTEM_PROMPT =
  'The user text contains placeholders like «TYPE_N» (e.g. «NAME_1», «EMAIL_2»). ' +
  'They replace sensitive personal data. Reproduce every placeholder EXACTLY as written — ' +
  'never translate, rename, expand, merge or reformat them.';

export interface CallArgs {
  providerId: ProviderId;
  model: string;
  key: string;
  baseUrl: string;
  instruction: string;
  /** The pseudonymized document. Never the mapping. */
  payload: string;
}

export type CallResult = { ok: true; content: string } | { ok: false; error: string };

/**
 * Single place where a network request is built and sent.
 *
 * Deliberately narrow: it takes the pseudonymized payload as a plain string and
 * has no access to the mapping, so no future edit here can leak one.
 */
export async function callModel(args: CallArgs): Promise<CallResult> {
  const provider = PROVIDERS[args.providerId];
  const user = args.instruction + '\n\n---\n\n' + args.payload;

  try {
    const res = await fetch(provider.endpoint(args.model, args.key, args.baseUrl), {
      method: 'POST',
      headers: provider.headers(args.key),
      body: JSON.stringify(provider.body(args.model, SYSTEM_PROMPT, user)),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = j?.message ?? j?.error?.message ?? '';
      } catch {
        // Body was not JSON; the status alone has to do.
      }
      return { ok: false, error: `HTTP ${res.status}${detail ? ' — ' + detail : ''}` };
    }

    const content = provider.extract(await res.json());
    if (!content) return { ok: false, error: 'Leere Antwort vom Anbieter' };
    return { ok: true, content };
  } catch (err) {
    return {
      ok: false,
      error: (err instanceof Error && err.message) || 'Netzwerkfehler — CORS oder offline?',
    };
  }
}
