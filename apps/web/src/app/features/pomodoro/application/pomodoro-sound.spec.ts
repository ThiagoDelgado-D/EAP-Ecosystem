import { afterEach, describe, expect, test, vi } from 'vitest';
import { mockAudioContext, mockThrowingAudioContext } from './mocks/mock-audio-context';
import { mockLocalStorage, mockThrowingLocalStorage } from './mocks/mock-local-storage';
import { playBoundaryChime, readSoundPreference, writeSoundPreference } from './pomodoro-sound';

describe('readSoundPreference', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should default to enabled when nothing is stored', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));

    expect(readSoundPreference()).toBe(true);
  });

  test('should return the stored preference', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('false'));

    expect(readSoundPreference()).toBe(false);
  });

  test('should default to enabled when localStorage throws', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(readSoundPreference()).toBe(true);
  });
});

describe('writeSoundPreference', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should persist the preference as a string', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);

    writeSoundPreference(false);

    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_sound_enabled', 'false');
  });

  test('should not throw when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(() => writeSoundPreference(true)).not.toThrow();
  });
});

describe('playBoundaryChime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should do nothing when AudioContext is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);

    expect(() => playBoundaryChime()).not.toThrow();
  });

  test('should start and stop an oscillator through the gain node', () => {
    const { AudioContextCtor, oscillator, gain, instances } = mockAudioContext();
    vi.stubGlobal('AudioContext', AudioContextCtor);

    playBoundaryChime();

    expect(instances).toHaveLength(1);
    expect(oscillator.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalled();
    expect(oscillator.start).toHaveBeenCalled();
    expect(oscillator.stop).toHaveBeenCalled();
  });

  test('should not throw when the audio context itself throws', () => {
    vi.stubGlobal('AudioContext', mockThrowingAudioContext());

    expect(() => playBoundaryChime()).not.toThrow();
  });
});
