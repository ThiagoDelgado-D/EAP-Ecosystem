import { FALLBACK_TONE, TONES, toTone, toneVar } from './tone';

const LEGACY_HEX_COLOR = '#FF5733';
const UNKNOWN_TONE_NAME = 'neon';

describe('toTone', () => {
  test('keeps every known tone name', () => {
    expect(TONES.map((tone) => toTone(tone))).toEqual([...TONES]);
  });

  test('falls back for an unknown tone name, a legacy hex color or a missing value', () => {
    expect(toTone(UNKNOWN_TONE_NAME)).toBe(FALLBACK_TONE);
    expect(toTone(LEGACY_HEX_COLOR)).toBe(FALLBACK_TONE);
    expect(toTone(null)).toBe(FALLBACK_TONE);
    expect(toTone(undefined)).toBe(FALLBACK_TONE);
  });
});

describe('toneVar', () => {
  test('resolves a tone to its theme variable', () => {
    expect(toneVar(FALLBACK_TONE)).toBe(`var(--tone-${FALLBACK_TONE})`);
  });
});
