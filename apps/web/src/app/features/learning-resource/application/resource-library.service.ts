import { Injectable, signal, computed } from '@angular/core';

const SAVED_KEY = 'eap_saved_resources';
const RECENT_KEY = 'eap_recent_resources';
const RECENT_MAX = 10;

@Injectable({ providedIn: 'root' })
export class ResourceLibraryService {
  private readonly _savedIds = signal<Set<string>>(this.loadSaved());

  readonly savedIds = computed(() => this._savedIds());

  toggleSaved(id: string): void {
    const current = new Set(this._savedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this._savedIds.set(current);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...current]));
  }

  isSaved(id: string): boolean {
    return this._savedIds().has(id);
  }

  private readonly _recentIds = signal<string[]>(this.loadRecent());

  readonly recentIds = computed(() => this._recentIds());

  trackRecent(id: string): void {
    const current = this._recentIds().filter((r) => r !== id);
    const updated = [id, ...current].slice(0, RECENT_MAX);
    this._recentIds.set(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  }

  private loadSaved(): Set<string> {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  }

  private loadRecent(): string[] {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }
}
