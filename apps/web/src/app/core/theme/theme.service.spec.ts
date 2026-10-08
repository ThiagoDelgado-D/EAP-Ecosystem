import { TestBed } from '@angular/core/testing';
import { inMemoryLocalStorage } from '@features/pomodoro/application/mocks/mock-local-storage';
import { THEME_STORAGE_KEY, ThemeService, type ThemePreference } from './theme.service';

const PAPER: ThemePreference = 'paper';
const INK: ThemePreference = 'ink';
const SYSTEM: ThemePreference = 'system';

function fakeColorScheme(prefersDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    matches: prefersDark,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', () => query);
  return {
    switchTo(dark: boolean) {
      query.matches = dark;
      listeners.forEach((listener) => listener({ matches: dark } as MediaQueryListEvent));
    },
  };
}

function setup() {
  const service = TestBed.inject(ThemeService);
  TestBed.tick();
  return { service, appliedTheme: () => document.documentElement.dataset['theme'] };
}

describe('ThemeService', () => {
  let storage: ReturnType<typeof inMemoryLocalStorage>;

  beforeEach(() => {
    storage = inMemoryLocalStorage();
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete document.documentElement.dataset['theme'];
  });

  test('should follow a dark system scheme when nothing was chosen', () => {
    fakeColorScheme(true);

    const { service, appliedTheme } = setup();

    expect(service.preference()).toBe(SYSTEM);
    expect(appliedTheme()).toBe(INK);
  });

  test('should not store anything while following the system', () => {
    fakeColorScheme(false);

    setup();

    expect(storage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  test('should switch live when the system scheme changes and nothing was chosen', () => {
    const colorScheme = fakeColorScheme(false);
    const { service, appliedTheme } = setup();

    colorScheme.switchTo(true);
    TestBed.tick();

    expect(service.theme()).toBe(INK);
    expect(appliedTheme()).toBe(INK);
  });

  test('should keep a stored choice over the system scheme', () => {
    storage.setItem(THEME_STORAGE_KEY, PAPER);
    fakeColorScheme(true);

    const { service, appliedTheme } = setup();

    expect(service.preference()).toBe(PAPER);
    expect(appliedTheme()).toBe(PAPER);
  });

  test('should ignore system scheme changes once a theme was chosen', () => {
    const colorScheme = fakeColorScheme(false);
    const { service } = setup();
    service.setPreference(PAPER);

    colorScheme.switchTo(true);
    TestBed.tick();

    expect(service.theme()).toBe(PAPER);
  });

  test('should store the opposite theme as an explicit choice when toggled', () => {
    fakeColorScheme(true);
    const { service } = setup();

    service.toggle();
    TestBed.tick();

    expect(service.theme()).toBe(PAPER);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe(PAPER);
  });

  test('should forget the stored choice when going back to the system', () => {
    storage.setItem(THEME_STORAGE_KEY, INK);
    fakeColorScheme(false);
    const { service, appliedTheme } = setup();

    service.setPreference(SYSTEM);
    TestBed.tick();

    expect(storage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(appliedTheme()).toBe(PAPER);
  });
});
