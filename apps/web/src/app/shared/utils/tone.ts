export const TONES = ['pine', 'ochre', 'ember', 'info', 'plum', 'slate'] as const;

export type Tone = (typeof TONES)[number];

export const FALLBACK_TONE: Tone = 'slate';

export function toneVar(tone: Tone): string {
  return `var(--tone-${tone})`;
}

export function toTone(value: string | null | undefined): Tone {
  const knownTone = TONES.find((tone) => tone === value);
  if (!knownTone) return FALLBACK_TONE;
  return knownTone;
}
