import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LearningResourceRepository } from '../domain/learning-resource.repository';
import type {
  AddResourcePayload,
  DifficultyLevel,
  EnergyLevel,
  LearningResource,
  LearningResourceFilter,
  MentalStateType,
  ResourceStatus,
  UpdateResourcePayload,
} from '../domain/learning-resource.model';
import type {
  LearningResourceByIdDto,
  LearningResourceDto,
  LearningResourceListDto,
} from './learning-resource.dto';
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
    // Added in PR #44 — mentalState filter support
    if (filter.mentalState) {
      params = params.set('mentalState', filter.mentalState);
    }

    const response = await firstValueFrom(
      this.http.get<LearningResourceListDto>(`${this.baseUrl}/filter`, { params }),
    );
    return response.resources.map((dto) => this.toDomain(dto));
  }

  async toggleDifficulty(id: string, difficulty: DifficultyLevel): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.baseUrl}/${id}/difficulty`, { difficulty }));
  }

  async toggleEnergy(id: string, energyLevel: EnergyLevel): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.baseUrl}/${id}/energy`, { energyLevel }));
  }

  async getById(id: string): Promise<LearningResource> {
    const dto = await firstValueFrom(
      this.http.get<LearningResourceByIdDto>(`${this.baseUrl}/${id}`),
    );
    return this.toDomainFromById(dto);
  }

  async addResourceLearning(resource: AddResourcePayload): Promise<void> {
    const payload = {
      title: resource.title,
      url: resource.url,
      imageUrl: resource.imageUrl,
      notes: resource.notes,
      difficulty: this.toApiDifficulty(resource.difficulty),
      estimatedDurationMinutes: resource.estimatedDurationMinutes,
      topicIds: resource.topicIds,
      resourceTypeId: resource.resourceTypeId,
      ...(resource.energyLevel !== undefined && {
        energyLevel: this.toApiEnergyLevel(resource.energyLevel),
      }),
      ...(resource.status !== undefined && { status: this.toApiStatus(resource.status) }),
      ...(resource.mentalState !== undefined && { mentalState: resource.mentalState }),
    };

    await firstValueFrom(this.http.post(`${this.baseUrl}`, payload));
  }

  async updateResource(id: string, resource: UpdateResourcePayload): Promise<void> {
    const payload = {
      ...(resource.title !== undefined && { title: resource.title }),
      ...(resource.url !== undefined && { url: resource.url }),
      ...(resource.imageUrl !== undefined && { imageUrl: resource.imageUrl }),
      ...(resource.notes !== undefined && { notes: resource.notes }),
      ...(resource.estimatedDurationMinutes !== undefined && {
        estimatedDurationMinutes: resource.estimatedDurationMinutes,
      }),
      ...(resource.topicIds !== undefined && { topicIds: resource.topicIds }),
      ...(resource.typeId !== undefined && { typeId: resource.typeId }),
      ...(resource.mentalState !== undefined && { mentalState: resource.mentalState }),
    };

    await firstValueFrom(this.http.patch(`${this.baseUrl}/${id}`, payload));
  }

  async deleteResource(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
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
    if (value === 'pending') return 'Pending';
    if (value === 'completed') return 'Completed';
    throw new Error(`Unknown status value from API: ${value}`);
  }

  private capitalizeDifficulty(value: string): DifficultyLevel {
    const capitalized = this.capitalize(value);
    if (capitalized === 'Low' || capitalized === 'Medium' || capitalized === 'High') {
      return capitalized;
    }
    throw new Error(`Unknown difficulty value from API: ${value}`);
  }

  private capitalizeEnergyLevel(value: string): EnergyLevel {
    const capitalized = this.capitalize(value);
    if (capitalized === 'Low' || capitalized === 'Medium' || capitalized === 'High') {
      return capitalized;
    }
    throw new Error(`Unknown energy level value from API: ${value}`);
  }

  private parseMentalState(value: string | null | undefined): MentalStateType | undefined {
    if (!value) return undefined;
    const valid: MentalStateType[] = ['deep_focus', 'light_read', 'creative', 'quick_op', 'review'];
    if (valid.includes(value as MentalStateType)) return value as MentalStateType;
    console.warn(`Unknown mentalState value from API: ${value}`);
    return undefined;
  }

  private parseDate(value: string | null | undefined): Date {
    if (!value) {
      console.warn('Missing date value, using current date as fallback');
      return new Date();
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error(`Invalid date string: ${value}`);
    return date;
  }

  private toDomain(dto: LearningResourceDto): LearningResource {
    return {
      id: dto.id,
      title: dto.title,
      difficulty: this.capitalizeDifficulty(dto.difficulty),
      energyLevel: this.capitalizeEnergyLevel(dto.energyLevel),
      status: this.capitalizeStatus(dto.status),
      typeId: dto.typeId,
      topicIds: dto.topicIds,
      estimatedDuration: { value: 0, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private toDomainFromById(dto: LearningResourceByIdDto): LearningResource {
    return {
      id: dto.resourceId,
      title: dto.title,
      url: dto.url ?? undefined,
      imageUrl: dto.imageUrl ?? undefined,
      notes: dto.notes ?? undefined,
      difficulty: this.capitalizeDifficulty(dto.difficulty),
      energyLevel: dto.energyLevel ? this.capitalizeEnergyLevel(dto.energyLevel) : 'Medium',
      mentalState: this.parseMentalState(dto.mentalState),
      status: dto.status ? this.capitalizeStatus(dto.status) : 'Pending',
      estimatedDuration: { value: dto.estimatedDurationMinutes, isEstimated: true },
      topicIds: dto.topicIds,
      typeId: dto.typeId,
      createdAt: this.parseDate(dto.createdAt),
      updatedAt: this.parseDate(dto.updatedAt),
    };
  }
}
