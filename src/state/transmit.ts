import { callModel } from '../lib/providers';
import { config } from './config.svelte';
import { session } from './session.svelte';
import { ui } from './ui.svelte';

const FALLBACK_INSTRUCTION = 'Bearbeite den folgenden Text sinnvoll und antworte auf Deutsch.';

export function canTransmit(): boolean {
  return session.hasText && config.ready && !session.transmitting;
}

/**
 * Send the pseudonymized document and write the reply back.
 *
 * Snapshots both the payload and the mapping before awaiting. Editing the
 * document mid-flight must not change what was actually transmitted, nor how an
 * answer that is already on its way gets read back.
 */
export async function transmit(): Promise<void> {
  if (!canTransmit()) return;

  const payload = session.pseudoText;
  const tokenCount = session.findings.length;
  session.sentMapping = session.mapping;

  const target = `${config.meta.label} · ${config.effectiveModel} · ${config.meta.region}`;

  session.transmitting = true;
  session.collapsed = true;
  session.rawAnswer = '';
  session.transmit = { target, message: 'Übertragung läuft …', tone: 'busy' };

  const result = await callModel({
    providerId: config.providerId,
    model: config.effectiveModel,
    key: config.key.trim(),
    baseUrl: config.baseUrl,
    instruction: session.instruction.trim() || FALLBACK_INSTRUCTION,
    payload,
  });

  session.transmitting = false;

  if (!result.ok) {
    session.transmit = { target, message: result.error, tone: 'error' };
    // Offer the copy/paste route immediately — a CORS block is not something
    // the user can fix from here.
    ui.manualOpen = true;
    return;
  }

  session.transmit = {
    target,
    message: `${tokenCount} Platzhalter übertragen`,
    tone: 'ok',
  };
  session.rawAnswer = result.content;
}

/** Restore an answer the user pasted in by hand. */
export function restoreManual(text: string): void {
  if (!text.trim()) return;
  if (!session.sentMapping) session.sentMapping = session.mapping;
  session.rawAnswer = text;
  session.showRaw = false;
}
