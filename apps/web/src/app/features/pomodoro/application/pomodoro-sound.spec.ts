import { afterEach, describe, expect, test, vi } from 'vitest';
import { mockAudio, mockBlockedAudio, mockThrowingAudio } from './mocks/mock-audio-element';
import { mockLocalStorage, mockThrowingLocalStorage } from './mocks/mock-local-storage';
import {
  SOUND_ID,
  SOUND_OPTIONS,
  playBoundaryChime,
  readSoundId,
  readSoundPreference,
  readVolume,
  writeSoundId,
  writeSoundPreference,
  writeVolume,
} from './pomodoro-sound';

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

describe('readSoundId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should default to chime when nothing is stored', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));

    expect(readSoundId()).toBe(SOUND_ID.CHIME);
  });

  test('should return a stored, known sound id', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(SOUND_ID.KITCHEN));

    expect(readSoundId()).toBe(SOUND_ID.KITCHEN);
  });

  test('should default to chime when the stored value is not a known sound id', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('not-a-real-sound'));

    expect(readSoundId()).toBe(SOUND_ID.CHIME);
  });

  test('should default to chime when localStorage throws', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(readSoundId()).toBe(SOUND_ID.CHIME);
  });
});

describe('writeSoundId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should persist the chosen sound id', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);

    writeSoundId(SOUND_ID.DIGITAL);

    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_sound_id', SOUND_ID.DIGITAL);
  });

  test('should not throw when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(() => writeSoundId(SOUND_ID.WOOD)).not.toThrow();
  });
});

describe('readVolume', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should default to 0.6 when nothing is stored', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));

    expect(readVolume()).toBe(0.6);
  });

  test('should return the stored volume', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('0.3'));

    expect(readVolume()).toBe(0.3);
  });

  test('should clamp an out-of-range stored value', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('5'));

    expect(readVolume()).toBe(1);
  });

  test('should default to 0.6 when the stored value is not a number', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('not-a-number'));

    expect(readVolume()).toBe(0.6);
  });

  test('should default to 0.6 when localStorage throws', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(readVolume()).toBe(0.6);
  });
});

describe('writeVolume', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should persist the clamped volume as a string', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);

    writeVolume(1.5);

    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_sound_volume', '1');
  });

  test('should not throw when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(() => writeVolume(0.4)).not.toThrow();
  });
});

describe('playBoundaryChime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const chimeUrl = SOUND_OPTIONS.find((option) => option.id === SOUND_ID.CHIME)!.url;

  test('should play the default chime file when no sound id is given', () => {
    const { AudioCtor, instances } = mockAudio();
    vi.stubGlobal('Audio', AudioCtor);

    playBoundaryChime();

    expect(instances).toHaveLength(1);
    expect(instances[0].src).toBe(chimeUrl);
    expect(instances[0].play).toHaveBeenCalled();
  });

  test.each(SOUND_OPTIONS)('should play the real audio file for $id', ({ id, url }) => {
    const { AudioCtor, instances } = mockAudio();
    vi.stubGlobal('Audio', AudioCtor);

    playBoundaryChime(id);

    expect(instances[0].src).toBe(url);
    expect(instances[0].play).toHaveBeenCalled();
  });

  test('should fall back to the chime file for an unknown sound id', () => {
    const { AudioCtor, instances } = mockAudio();
    vi.stubGlobal('Audio', AudioCtor);

    playBoundaryChime('not-a-real-sound' as never);

    expect(instances[0].src).toBe(chimeUrl);
  });

  test('should apply the given volume to the audio element', () => {
    const { AudioCtor, instances } = mockAudio();
    vi.stubGlobal('Audio', AudioCtor);

    playBoundaryChime(SOUND_ID.CHIME, 0.25);

    expect(instances[0].volume).toBe(0.25);
  });

  test('should clamp an out-of-range volume', () => {
    const { AudioCtor, instances } = mockAudio();
    vi.stubGlobal('Audio', AudioCtor);

    playBoundaryChime(SOUND_ID.CHIME, 2);

    expect(instances[0].volume).toBe(1);
  });

  test('should not throw when playback is blocked by an autoplay policy', () => {
    vi.stubGlobal('Audio', mockBlockedAudio());

    expect(() => playBoundaryChime()).not.toThrow();
  });

  test('should not throw when Audio itself is unavailable', () => {
    vi.stubGlobal('Audio', mockThrowingAudio());

    expect(() => playBoundaryChime()).not.toThrow();
  });
});
