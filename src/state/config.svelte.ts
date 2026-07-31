import { PROVIDER_META, PROVIDERS } from '../lib/providers';
import { lsDel, lsGet, lsSet, migrateLegacyKeys } from '../lib/storage';
import type { ProviderId } from '../lib/types';

const CUSTOM = '__custom__';

/**
 * Model configuration: provider, model, credential.
 *
 * Set up once, then collapsed to a header pill — it is the part of the old UI
 * that took permanent screen space for a decision the user makes once.
 *
 * Persistence uses accessor pairs rather than an `$effect`, so a write to
 * localStorage is visibly attached to the assignment that caused it. That also
 * keeps `bind:value` usable in the panel.
 */
export class ModelConfig {
  #providerId = $state<ProviderId>('mistral');
  #model = $state('');
  #customModel = $state('');
  #key = $state('');
  #baseUrl = $state('http://localhost:11434');

  /** Slide-over visibility. */
  open = $state(false);

  constructor() {
    migrateLegacyKeys();
    const saved = lsGet('provider') as ProviderId | null;
    this.#providerId = saved && saved in PROVIDERS ? saved : 'mistral';
    this.#loadProviderState();
  }

  get providerId() {
    return this.#providerId;
  }

  set providerId(id: ProviderId) {
    this.#providerId = id;
    lsSet('provider', id);
    // Model and credential are per provider, so switching reloads both.
    this.#loadProviderState();
  }

  /** Reads the stored model/key/url for the current provider. */
  #loadProviderState(): void {
    const provider = PROVIDERS[this.#providerId];
    const savedModel = lsGet('model.' + this.#providerId);

    if (savedModel && provider.models.includes(savedModel)) {
      this.#model = savedModel;
      this.#customModel = '';
    } else if (savedModel) {
      this.#model = CUSTOM;
      this.#customModel = savedModel;
    } else {
      this.#model = provider.models[0] ?? '';
      this.#customModel = '';
    }

    this.#key = provider.needsKey ? (lsGet('key.' + this.#providerId) ?? '') : '';
    this.#baseUrl = lsGet('ollama_url') ?? 'http://localhost:11434';
  }

  get model() {
    return this.#model;
  }

  set model(value: string) {
    this.#model = value;
    if (value !== CUSTOM) lsSet('model.' + this.#providerId, value);
  }

  get customModel() {
    return this.#customModel;
  }

  set customModel(value: string) {
    this.#customModel = value;
    lsSet('model.' + this.#providerId, value.trim());
  }

  get key() {
    return this.#key;
  }

  set key(value: string) {
    this.#key = value;
    lsSet('key.' + this.#providerId, value.trim());
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  set baseUrl(value: string) {
    this.#baseUrl = value;
    lsSet('ollama_url', value.trim());
  }

  readonly provider = $derived(PROVIDERS[this.#providerId]);
  readonly meta = $derived(PROVIDER_META[this.#providerId]);
  readonly isCustomModel = $derived(this.#model === CUSTOM);

  /** The model id actually sent. */
  readonly effectiveModel = $derived(
    this.#model === CUSTOM ? this.#customModel.trim() : this.#model,
  );

  readonly ready = $derived(
    Boolean(this.effectiveModel) && (!this.provider.needsKey || this.#key.trim().length > 0),
  );

  clearKey(): void {
    lsDel('key.' + this.#providerId);
    this.#key = '';
  }
}

export const CUSTOM_MODEL = CUSTOM;
export const config = new ModelConfig();
