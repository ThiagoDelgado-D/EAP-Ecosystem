import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ResourceLibraryService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly savedIdsSignal = signal<string[]>([]);
  private readonly recentIdsSignal = signal<string[]>([]);

  readonly savedIds = this.savedIdsSignal.asReadonly();
  readonly recentIds = this.recentIdsSignal.asReadonly();

  private initialized = false;

  constructor() {
    if (this.isBrowser) {
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage(): void {
    this.savedIdsSignal.set(this.loadSaved());
    this.recentIdsSignal.set(this.loadRecent());
    this.initialized = true;
  }

  private loadSaved(): string[] {
    if (!this.isBrowser) return [];
    const saved = localStorage.getItem('saved_resources');
    return saved ? JSON.parse(saved) : [];
  }

  private loadRecent(): string[] {
    if (!this.isBrowser) return [];
    const recent = localStorage.getItem('recent_resources');
    return recent ? JSON.parse(recent) : [];
  }

  private persistSaved(): void {
    if (!this.isBrowser) return;
    localStorage.setItem('saved_resources', JSON.stringify(this.savedIdsSignal()));
  }

  private persistRecent(): void {
    if (!this.isBrowser) return;
    localStorage.setItem('recent_resources', JSON.stringify(this.recentIdsSignal()));
  }

  isSaved(id: string): boolean {
    return this.savedIdsSignal().includes(id);
  }

  toggleSaved(id: string): void {
    if (!this.isBrowser) return;
    const current = this.savedIdsSignal();
    const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
    this.savedIdsSignal.set(updated);
    this.persistSaved();
  }

  trackRecent(id: string): void {
    if (!this.isBrowser) return;
    const current = this.recentIdsSignal();
    const filtered = current.filter((i) => i !== id);
    const updated = [id, ...filtered].slice(0, 20);
    this.recentIdsSignal.set(updated);
    this.persistRecent();
  }
}
