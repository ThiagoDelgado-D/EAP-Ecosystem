import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LearningResourceRepository } from '../domain/learning-resource.repository';
import type {
  DifficultyLevel,
  EnergyLevel,
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
    let params = new HttpParams();

    if (filter.difficulty) {
      params = params.set('difficulty', this.toApiDifficulty(filter.difficulty));
    }
    if (filter.energyLevel) {
      params = params.set('energyLevel', this.toApiEnergyLevel(filter.energyLevel));
    }
    if (filter.status) {
      params = params.set('status', this.toApiStatus(filter.status));
    }
    if (filter.topicIds && filter.topicIds.length > 0) {
      filter.topicIds.forEach((id) => {
        params = params.append('topicIds', id);
      });
    }
    if (filter.typeId) {
      params = params.set('resourceTypeId', filter.typeId);
    }

    const response = await firstValueFrom(
      this.http.get<LearningResourceListDto>(`${this.baseUrl}/filter`, { params }),
    );
    return response.resources.map((dto) => this.toDomain(dto));
  }

  async getById(id: string): Promise<LearningResource> {
    const dto = await firstValueFrom(this.http.get<LearningResourceDto>(`${this.baseUrl}/${id}`));
    return this.toDomain(dto);
  }

  async addResourceLearning(
    resource: Omit<LearningResource, 'id' | 'createdAt' | 'updatedAt' | 'lastViewed'>,
  ): Promise<void> {
    const payload = {
      title: resource.title,
      url: resource.url ?? undefined,
      notes: resource.notes ?? undefined,
      difficulty: resource.difficulty.toLowerCase(),
      energyLevel: resource.energyLevel.toLowerCase(),
      estimatedDurationMinutes: resource.estimatedDuration.value,
      topicIds: resource.topicIds,
      resourceTypeId: resource.typeId,
      status: this.toApiStatus(resource.status),
    };

    await firstValueFrom(this.http.post<void>(this.baseUrl, payload));
  }

  private toApiStatus(status: ResourceStatus): string {
    const map: Record<ResourceStatus, string> = {
      Pending: 'pending',
      InProgress: 'in_progress',
      Completed: 'completed',
    };
    return map[status];
  }

  private toApiDifficulty(difficulty: DifficultyLevel): string {
    return difficulty.toLowerCase();
  }

  private toApiEnergyLevel(energyLevel: EnergyLevel): string {
    return energyLevel.toLowerCase();
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
