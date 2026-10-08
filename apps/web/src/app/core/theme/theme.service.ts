import {
  DestroyRef,
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'paper' | 'ink';
export type ThemePreference = Theme | 'system';

export const THEME_STORAGE_KEY = 'eap-theme';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function readStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'paper' || stored === 'ink') return stored;
  return 'system';
}

function themeForScheme(prefersDark: boolean): Theme {
  if (prefersDark) return 'ink';
  return 'paper';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly preference = signal<ThemePreference>('system');
  private readonly systemTheme = signal<Theme>('ink');

  readonly theme = computed<Theme>(() => {
    const preference = this.preference();
    if (preference === 'system') return this.systemTheme();
    return preference;
  });

  constructor() {
    if (!this.isBrowser) return;

    this.preference.set(readStoredPreference());
    const darkScheme = window.matchMedia(DARK_SCHEME_QUERY);
    this.systemTheme.set(themeForScheme(darkScheme.matches));
    const onSchemeChange = (event: MediaQueryListEvent) =>
      this.systemTheme.set(themeForScheme(event.matches));
    darkScheme.addEventListener('change', onSchemeChange);
    inject(DestroyRef).onDestroy(() => darkScheme.removeEventListener('change', onSchemeChange));

    effect(() => {
      document.documentElement.dataset['theme'] = this.theme();
    });
    effect(() => {
      const preference = this.preference();
      if (preference === 'system') {
        localStorage.removeItem(THEME_STORAGE_KEY);
        return;
      }
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
  }

  toggle(): void {
    if (this.theme() === 'paper') {
      this.setPreference('ink');
      return;
    }
    this.setPreference('paper');
  }
}
