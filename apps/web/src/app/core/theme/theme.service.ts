import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private get systemPrefersDark(): boolean {
    return this.isBrowser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  }

  readonly currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      this.persistTheme(theme);
    });
  }

  toggleTheme(): void {
    this.currentTheme.update((theme) => (theme === 'light' ? 'dark' : 'light'));
  }

  isDarkMode(): boolean {
    return this.currentTheme() === 'dark';
  }

  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  private persistTheme(theme: Theme): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  private getInitialTheme(): Theme {
    if (!this.isBrowser) return 'light';
    const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return this.systemPrefersDark ? 'dark' : 'light';
  }
}
