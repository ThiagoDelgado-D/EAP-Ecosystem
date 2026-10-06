import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthStore } from '@features/auth/application/auth.store';
import type { ScoredRecommendation } from '@features/recommendation/domain/recommendation.model';

export const MAX_EXCLUDED_CANDIDATES = 100;
const DISMISSALS_STORAGE_KEY_PREFIX = 'recommendation_dismissals';

interface Dismissal {
  candidateId: string;
  expiresAt: Date;
}

interface StoredDismissal {
  candidateId: string;
  expiresAt: string;
}

export function dismissalCandidateId(
  recommendation: Pick<ScoredRecommendation, 'resourceId' | 'nodeId'>,
): string | null {
  return recommendation.resourceId ?? recommendation.nodeId ?? null;
}

export function nextLocalMidnight(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

function isStoredDismissal(value: unknown): value is StoredDismissal {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate['candidateId'] === 'string' && typeof candidate['expiresAt'] === 'string';
}

@Injectable()
export class RecommendationDismissalsService {
  private readonly authStore = inject(AuthStore);
  private readonly dismissals = signal<Dismissal[]>([]);

  readonly dismissedIds = computed(() => new Set(this.dismissals().map((d) => d.candidateId)));
  readonly count = computed(() => this.dismissals().length);

  activeCandidateIds(): string[] {
    const active = this.readActive();
    this.persist(active);
    return active.map((d) => d.candidateId);
  }

  dismiss(recommendation: Pick<ScoredRecommendation, 'resourceId' | 'nodeId'>): void {
    const candidateId = dismissalCandidateId(recommendation);
    if (!candidateId) return;

    const kept = this.readActive().filter((d) => d.candidateId !== candidateId);
    const dismissal: Dismissal = { candidateId, expiresAt: nextLocalMidnight(new Date()) };
    this.persist(kept.concat(dismissal).slice(-MAX_EXCLUDED_CANDIDATES));
  }

  restoreAll(): void {
    this.persist([]);
  }

  private storageKey(): string | null {
    const userId = this.authStore.currentUser()?.id;
    if (!userId) return null;
    return `${DISMISSALS_STORAGE_KEY_PREFIX}:${userId}`;
  }

  private readActive(): Dismissal[] {
    const key = this.storageKey();
    const now = Date.now();
    const stored = key ? this.readStored(key) : null;
    const dismissals = stored
      ? stored.map((d) => ({ candidateId: d.candidateId, expiresAt: new Date(d.expiresAt) }))
      : this.dismissals();
    return dismissals.filter((d) => d.expiresAt.getTime() > now);
  }

  private readStored(key: string): StoredDismissal[] | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isStoredDismissal);
    } catch {
      return null;
    }
  }

  private persist(dismissals: Dismissal[]): void {
    this.dismissals.set(dismissals);
    const key = this.storageKey();
    if (!key) return;

    const stored: StoredDismissal[] = dismissals.map((d) => ({
      candidateId: d.candidateId,
      expiresAt: d.expiresAt.toISOString(),
    }));
    try {
      if (stored.length === 0) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(stored));
    } catch {
      return;
    }
  }
}
