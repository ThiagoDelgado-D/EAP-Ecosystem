import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LearningResourceRepository } from '../domain/learning-resource.repository';
import type { LearningResource, LearningResourceFilter } from '../domain/learning-resource.model';
import type { LearningResourceDto } from './learning-resource.dto';
import { API_CONFIG } from '@core/config/api.config';

@Injectable()
export class LearningResourceHttpRepository extends LearningResourceRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/learning-resources`;

  async getAll(): Promise<LearningResource[]> {
    const dtos = await firstValueFrom(this.http.get<LearningResourceDto[]>(this.baseUrl));
    return dtos.map(this.toDomain);
  }

  async getByFilter(filter: LearningResourceFilter): Promise<LearningResource[]> {
    const dtos = await firstValueFrom(
      this.http.get<LearningResourceDto[]>(`${this.baseUrl}/filter`, {
        params: { ...filter },
      }),
    );
    return dtos.map(this.toDomain);
  }

  async getById(id: string): Promise<LearningResource> {
    const dto = await firstValueFrom(this.http.get<LearningResourceDto>(`${this.baseUrl}/${id}`));
    return this.toDomain(dto);
  }

  private toDomain(dto: LearningResourceDto): LearningResource {
    return {
      id: dto.id,
      title: dto.title,
      url: dto.url ?? undefined,
      notes: dto.notes ?? undefined,
      difficulty: dto.difficulty as LearningResource['difficulty'],
      energyLevel: dto.energyLevel as LearningResource['energyLevel'],
      status: dto.status as LearningResource['status'],
      estimatedDuration: dto.estimatedDuration,
      topicIds: dto.topicIds,
      typeId: dto.typeId,
      lastViewed: dto.lastViewed ? new Date(dto.lastViewed) : undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }
}
