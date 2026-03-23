import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LearningResourceRepository } from '../domain/learning-resource.repository';
import type {
  LearningResource,
  LearningResourceFilter,
  ResourceStatus,
} from '../domain/learning-resource.model';
import type { LearningResourceDto, LearningResourceListDto } from './learning-resource.dto';
import { API_CONFIG } from '@core/config/api.config';

@Injectable()
export class LearningResourceHttpRepository extends LearningResourceRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/learning-resources`;

  async getAll(): Promise<LearningResource[]> {
    const response = await firstValueFrom(this.http.get<LearningResourceListDto>(this.baseUrl));
    return response.resources.map((dto) => this.toDomain(dto));
  }

  async getByFilter(filter: LearningResourceFilter): Promise<LearningResource[]> {
    const response = await firstValueFrom(
      this.http.get<LearningResourceListDto>(`${this.baseUrl}/filter`, {
        params: { ...filter },
      }),
    );
    return response.resources.map((dto) => this.toDomain(dto));
  }

  async getById(id: string): Promise<LearningResource> {
    const dto = await firstValueFrom(this.http.get<LearningResourceDto>(`${this.baseUrl}/${id}`));
    return this.toDomain(dto);
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  private capitalizeStatus(value: string): ResourceStatus {
    if (value === 'in_progress') return 'InProgress';
    return this.capitalize(value) as ResourceStatus;
  }

  private toDomain(dto: LearningResourceDto): LearningResource {
    return {
      id: dto.id,
      title: dto.title,
      url: dto.url ?? undefined,
      notes: dto.notes ?? undefined,
      difficulty: this.capitalize(dto.difficulty) as LearningResource['difficulty'],
      energyLevel: this.capitalize(dto.energyLevel) as LearningResource['energyLevel'],
      status: this.capitalizeStatus(dto.status),
      estimatedDuration: dto.estimatedDuration ?? { value: 0, isEstimated: true },
      topicIds: dto.topicIds,
      typeId: dto.typeId,
      lastViewed: dto.lastViewed ? new Date(dto.lastViewed) : undefined,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
    };
  }
}
