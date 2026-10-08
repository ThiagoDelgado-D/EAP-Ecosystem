export type Tone = 'pine' | 'ochre' | 'ember' | 'info' | 'plum' | 'slate';

export function toneVar(tone: Tone): string {
  return `var(--tone-${tone})`;
}
