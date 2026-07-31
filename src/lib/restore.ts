import type { Mapping, RestoreResult } from './types';

/**
 * Tolerant matcher for one placeholder core such as `EMAIL_1`.
 *
 * Requires a leading «/[ and a trailing »/] delimiter, but tolerates case
 * changes and stray whitespace. Models reformat tokens more often than they
 * preserve them exactly, and a strict matcher would silently leave real
 * placeholders in the restored text.
 */
export function tolerantTokenRe(core: string): RegExp {
  const [type = '', num = ''] = core.split(/_(?=\d+$)/);
  const t = type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/_/g, '[_ ]');
  return new RegExp(
    `(?:\\u00ab|\\[\\[?)\\s*${t}\\s*[_ ]\\s*${num}\\s*(?:\\u00bb|\\]\\]?)`,
    'gi',
  );
}

/**
 * Write real values back into a model reply.
 *
 * Always restores against the mapping of the run that was actually transmitted.
 * Editing the document afterwards must not silently change what a token in an
 * older answer means.
 */
export function restoreFrom(aiText: string, mapping: Mapping): RestoreResult {
  const entries = Object.keys(mapping)
    .map((original) => ({ original, core: mapping[original]!.replacement.replace(/^«|»$/g, '') }))
    // Longest core first, so NAME_1 cannot consume the prefix of NAME_10.
    .sort((a, b) => b.core.length - a.core.length);

  let text = aiText;
  let count = 0;
  for (const { original, core } of entries) {
    text = text.replace(tolerantTokenRe(core), () => {
      count++;
      return original;
    });
  }

  // Anything still shaped like a placeholder was invented or mangled by the
  // model. Reporting it is the point: a silently unresolved token is how a
  // reader ends up trusting an answer that is missing a name.
  const leftover = [
    ...new Set(
      (text.match(/(?:«|\[\[?)\s*[A-Z][A-Z_ ]*[_ ]\d+\s*(?:»|\]\]?)/gi) ?? []).map((s) => s.trim()),
    ),
  ];

  return { text, count, leftover, total: entries.length };
}
