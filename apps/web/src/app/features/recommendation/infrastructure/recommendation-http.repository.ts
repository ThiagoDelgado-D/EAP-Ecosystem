import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RecommendationRepository } from '../domain/recommendation.repository';
import type {
  RecommendationContext,
  ScoredRecommendation,
  SetRecommendationContextPayload,
} from '../domain/recommendation.model';
import type {
  RecommendationContextResponseDto,
  ScoredRecommendationDto,
  SetRecommendationContextRequestDto,
} from './recommendation.dto';
import { API_CONFIG } from '@core/config/api.config';
import { isApiError } from '@core/errors/api-error';

function isContextMissing(error: unknown): boolean {
  return isApiError(error) && error.name === 'RECOMMENDATION_CONTEXT_NOT_FOUND_ERROR';
}

@Injectable()
export class RecommendationHttpRepository extends RecommendationRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/recommendations`;

  async getRecommendations(excludedCandidateIds: string[] = []): Promise<ScoredRecommendation[]> {
    const params = new HttpParams({ fromObject: { exclude: excludedCandidateIds } });
    try {
      const dtos = await firstValueFrom(
        this.http.get<ScoredRecommendationDto[]>(this.baseUrl, { params }),
      );
      return dtos.map((dto) => this.toDomain(dto));
    } catch (err) {
      if (isContextMissing(err)) return [];
      throw err;
    }
  }

  async getContext(): Promise<RecommendationContext | null> {
    try {
      const dto = await firstValueFrom(
        this.http.get<RecommendationContextResponseDto>(`${this.baseUrl}/context`),
      );
      return {
        energyLevel: dto.energyLevel,
        availableMinutes: dto.availableMinutes,
        mentalState: dto.mentalState,
      };
    } catch (err) {
      if (isContextMissing(err)) return null;
      throw err;
    }
  }

  async setContext(payload: SetRecommendationContextPayload): Promise<void> {
    const dto: SetRecommendationContextRequestDto = {
      energyLevel: payload.energyLevel,
      availableMinutes: payload.availableMinutes,
      mentalState: payload.mentalState,
    };
    await firstValueFrom(this.http.post(`${this.baseUrl}/context`, dto));
  }

  private toDomain(dto: ScoredRecommendationDto): ScoredRecommendation {
    return {
      resourceId: dto.resourceId,
      nodeId: dto.nodeId,
      pathId: dto.pathId,
      title: dto.title,
      score: dto.score,
      why: dto.why,
    };
  }
}
