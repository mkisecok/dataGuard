import { lsGet, lsSet } from '../lib/storage';

export type Theme = 'light' | 'dark';

function initial(): Theme {
  const saved = lsGet('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  // Light is the identity default — DataGuard is styled as a paper document —
  // but an explicit OS preference for dark wins on first visit.
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Theme is written to `<html data-theme>` because the token blocks in
 * `tokens.css` are keyed off that attribute, which keeps every colour decision
 * in CSS rather than spread across components.
 */
class ThemeState {
  #value = $state<Theme>('light');

  constructor() {
    this.#value = initial();
    this.#apply();
  }

  get value() {
    return this.#value;
  }

  toggle(): void {
    this.#value = this.#value === 'dark' ? 'light' : 'dark';
    lsSet('theme', this.#value);
    this.#apply();
  }

  #apply(): void {
    document.documentElement.setAttribute('data-theme', this.#value);
  }
}

export const theme = new ThemeState();
