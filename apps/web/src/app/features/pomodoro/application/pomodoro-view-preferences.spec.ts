import { afterEach, describe, expect, test, vi } from 'vitest';
import { mockLocalStorage, mockThrowingLocalStorage } from './mocks/mock-local-storage';
import {
  POMODORO_VIEW_MODE,
  readDefaultDurationMin,
  readDefaultViewMode,
  readHideShortcutHints,
  writeDefaultDurationMin,
  writeDefaultViewMode,
  writeHideShortcutHints,
} from './pomodoro-view-preferences';

describe('readDefaultViewMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should default to full when nothing is stored', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));

    expect(readDefaultViewMode()).toBe(POMODORO_VIEW_MODE.FULL);
  });

  test('should return a stored, known view mode', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(POMODORO_VIEW_MODE.ZEN));

    expect(readDefaultViewMode()).toBe(POMODORO_VIEW_MODE.ZEN);
  });

  test('should default to full when the stored value is not a known view mode', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('not-a-real-mode'));

    expect(readDefaultViewMode()).toBe(POMODORO_VIEW_MODE.FULL);
  });

  test('should default to full when localStorage throws', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(readDefaultViewMode()).toBe(POMODORO_VIEW_MODE.FULL);
  });
});

describe('writeDefaultViewMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should persist the chosen view mode', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);

    writeDefaultViewMode(POMODORO_VIEW_MODE.MINI);

    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_default_view_mode', POMODORO_VIEW_MODE.MINI);
  });

  test('should not throw when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(() => writeDefaultViewMode(POMODORO_VIEW_MODE.ZEN)).not.toThrow();
  });
});

describe('readHideShortcutHints', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should default to shown (not hidden) when nothing is stored', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));

    expect(readHideShortcutHints()).toBe(false);
  });

  test('should return the stored preference', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('true'));

    expect(readHideShortcutHints()).toBe(true);
  });

  test('should default to shown when localStorage throws', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(readHideShortcutHints()).toBe(false);
  });
});

describe('writeHideShortcutHints', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should persist the preference as a string', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);

    writeHideShortcutHints(true);

    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_hide_shortcut_hints', 'true');
  });

  test('should not throw when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(() => writeHideShortcutHints(false)).not.toThrow();
  });
});

describe('readDefaultDurationMin', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should default to 25 when nothing is stored', () => {
    vi.stubGlobal('localStorage', mockLocalStorage(null));

    expect(readDefaultDurationMin()).toBe(25);
  });

  test('should return a stored, valid duration', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('50'));

    expect(readDefaultDurationMin()).toBe(50);
  });

  test('should default to 25 when the stored value is not a positive number', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('not-a-number'));
    expect(readDefaultDurationMin()).toBe(25);

    vi.stubGlobal('localStorage', mockLocalStorage('0'));
    expect(readDefaultDurationMin()).toBe(25);

    vi.stubGlobal('localStorage', mockLocalStorage('-15'));
    expect(readDefaultDurationMin()).toBe(25);
  });

  test('should default to 25 when the stored value exceeds the planned-duration ceiling', () => {
    vi.stubGlobal('localStorage', mockLocalStorage('9999'));

    expect(readDefaultDurationMin()).toBe(25);
  });

  test('should default to 25 when localStorage throws', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(readDefaultDurationMin()).toBe(25);
  });
});

describe('writeDefaultDurationMin', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should persist the chosen duration', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);

    writeDefaultDurationMin(50);

    expect(storage.setItem).toHaveBeenCalledWith('pomodoro_default_duration_min', '50');
  });

  test('should not throw when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());

    expect(() => writeDefaultDurationMin(50)).not.toThrow();
  });
});
