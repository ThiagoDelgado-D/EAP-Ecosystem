import { inject, Injectable, signal } from '@angular/core';
import { RecommendationRepository } from '@features/recommendation/domain/recommendation.repository';
import type { ScoredRecommendation } from '@features/recommendation/domain/recommendation.model';

@Injectable()
export class RecommendationService {
  private readonly repository = inject(RecommendationRepository);

  readonly recommendations = signal<ScoredRecommendation[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const recommendations = await this.repository.getRecommendations();
      this.recommendations.set(recommendations);
    } catch {
      this.error.set('No pudimos cargar tus recomendaciones.');
    } finally {
      this.loading.set(false);
    }
  }
}
