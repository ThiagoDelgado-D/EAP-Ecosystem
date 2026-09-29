import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'paper' | 'ink';

const STORAGE_KEY = 'eap-theme';

function readStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'paper' || stored === 'ink' ? stored : null;
}

function systemPreferredTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'ink' : 'paper';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly theme = signal<Theme>(
    this.isBrowser ? (readStoredTheme() ?? systemPreferredTheme()) : 'ink',
  );

  constructor() {
    effect(() => {
      const theme = this.theme();
      if (!this.isBrowser) return;
      document.documentElement.dataset['theme'] = theme;
      localStorage.setItem(STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this.theme.update((current) => (current === 'paper' ? 'ink' : 'paper'));
  }
}
