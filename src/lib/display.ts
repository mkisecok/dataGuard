import type { Tier, TokenType } from './types';

/**
 * Presentation metadata per placeholder type.
 *
 * Colour is NOT stored here — only a tier. The stylesheet owns the three signal
 * colours and the components address them as `t0`…`t3`. That is what keeps the
 * palette from drifting back into a twelve-colour rainbow, and it is what keeps
 * the Art. 9 red exclusive to Art. 9.
 */
export const DISPLAY: Record<TokenType, { label: string; tier: Tier }> = {
  NAME: { label: 'Name', tier: 1 },
  EMAIL: { label: 'E-Mail', tier: 1 },
  PHONE: { label: 'Telefon', tier: 1 },
  ADDRESS: { label: 'Adresse', tier: 1 },
  DATE: { label: 'Geburtsdatum', tier: 1 },
  NUMBER: { label: 'Kenn- / Finanznummer', tier: 2 },
  HEALTH_DATA: { label: 'Gesundheitsdaten', tier: 3 },
  RELIGION: { label: 'Religion', tier: 3 },
  POLITICAL: { label: 'Politische Meinung', tier: 3 },
  SEXUAL_ORIENT: { label: 'Sexuelle Orientierung', tier: 3 },
  CUSTOM: { label: 'Manuell markiert', tier: 0 },
};

export function displayFor(type: TokenType) {
  return DISPLAY[type] ?? DISPLAY.CUSTOM;
}

export function tierOf(type: TokenType): Tier {
  return displayFor(type).tier;
}

export const TIER_LABEL: Record<Tier, string> = {
  3: 'Art. 9 DSGVO',
  1: 'Direkte Identifikatoren',
  2: 'Kenn- & Finanznummern',
  0: 'Manuell markiert',
};

/**
 * Art. 9 first. The most sensitive findings must be the ones you see without
 * scrolling, even when a document produces thirty rows.
 */
export const TIER_ORDER: Tier[] = [3, 1, 2, 0];

/** Categories offered when the user marks a selection by hand. */
export const MANUAL_TYPES: TokenType[] = [
  'NAME',
  'EMAIL',
  'PHONE',
  'ADDRESS',
  'DATE',
  'NUMBER',
  'HEALTH_DATA',
  'RELIGION',
  'POLITICAL',
  'SEXUAL_ORIENT',
  'CUSTOM',
];
