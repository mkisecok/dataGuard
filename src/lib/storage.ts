const PREFIX = 'dataguard.';

/**
 * Thin localStorage wrapper. Wrapped in try/catch because a `file://` page in
 * private mode can throw on access, and losing a saved model preference must
 * never take the whole tool down.
 */
export function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // Storage unavailable — the session still works, it just will not persist.
  }
}

export function lsDel(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // See above.
  }
}

/**
 * One-time migration from the Mistral-only version, which stored a single
 * unprefixed key and model instead of one per provider.
 */
export function migrateLegacyKeys(): void {
  const legacyKey = lsGet('mistral_key');
  if (legacyKey && !lsGet('key.mistral')) {
    lsSet('key.mistral', legacyKey);
    lsDel('mistral_key');
  }
  const legacyModel = lsGet('model');
  if (legacyModel && !lsGet('model.mistral')) {
    lsSet('model.mistral', legacyModel);
    lsDel('model');
  }
}
