import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { playBoundaryChime, readSoundPreference, writeSoundPreference } from './pomodoro-sound';

describe('readSoundPreference', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should default to enabled when nothing is stored', () => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => null) });

    expect(readSoundPreference()).toBe(true);
  });

  test('should return the stored preference', () => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'false') });

    expect(readSoundPreference()).toBe(false);
  });

  test('should default to enabled when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('storage blocked');
      }),
    });

    expect(readSoundPreference()).toBe(true);
  });
});

describe('writeSoundPreference', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should persist the preference as a string', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });

    writeSoundPreference(false);

    expect(setItem).toHaveBeenCalledWith('pomodoro_sound_enabled', 'false');
  });

  test('should not throw when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(() => {
        throw new Error('storage blocked');
      }),
    });

    expect(() => writeSoundPreference(true)).not.toThrow();
  });
});

describe('playBoundaryChime', () => {
  let oscillator: { type: string; frequency: { value: number }; connect: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };
  let gain: { gain: { setValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> }; connect: ReturnType<typeof vi.fn> };
  let audioContextInstances: unknown[];

  beforeEach(() => {
    audioContextInstances = [];
    oscillator = {
      type: '',
      frequency: { value: 0 },
      connect: vi.fn(() => gain),
      start: vi.fn(),
      stop: vi.fn(),
    };
    gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };

    class FakeAudioContext {
      currentTime = 0;
      destination = {};
      constructor() {
        audioContextInstances.push(this);
      }
      createOscillator() {
        return oscillator;
      }
      createGain() {
        return gain;
      }
    }

    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should do nothing when AudioContext is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);

    expect(() => playBoundaryChime()).not.toThrow();
    expect(audioContextInstances).toHaveLength(0);
  });

  test('should start and stop an oscillator through the gain node', () => {
    playBoundaryChime();

    expect(audioContextInstances).toHaveLength(1);
    expect(oscillator.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalled();
    expect(oscillator.start).toHaveBeenCalled();
    expect(oscillator.stop).toHaveBeenCalled();
  });

  test('should not throw when the audio context itself throws', () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('autoplay blocked');
        }
      },
    );

    expect(() => playBoundaryChime()).not.toThrow();
  });
});
