import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import type {
  AddResourcePayload,
  DifficultyLevel,
  EnergyLevel,
  LearningResource,
  MentalStateType,
  PaginatedResourcesResponse,
  ResourceQueryParams,
  ResourceStatus,
  UpdateResourcePayload,
} from '@features/learning-resource/domain/learning-resource.model';
import type { PaginatedResourcesDto } from '@features/learning-resource/infrastructure/learning-resource.dto';
import { API_CONFIG } from '@core/config/api.config';

@Injectable()
export class LearningResourceService {
  private readonly http = inject(HttpClient);
  private readonly repository = inject(LearningResourceRepository);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/learning-resources`;

  readonly resources = signal<LearningResource[]>([]);
  readonly total = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly queryCache = new Map<string, PaginatedResourcesResponse>();

  private buildQueryKey(params: ResourceQueryParams): string {
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return sorted || 'default';
  }

  async load(params: ResourceQueryParams = {}): Promise<void> {
    const key = this.buildQueryKey(params);
    const cached = this.queryCache.get(key);
    if (cached) {
      this.resources.set(cached.resources);
      this.total.set(cached.total);
      this.totalPages.set(cached.totalPages);
      this.currentPage.set(cached.page);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const dto = await firstValueFrom(
        this.http.get<PaginatedResourcesDto>(this.baseUrl, {
          params: this.toHttpParams(params),
        }),
      );
      const result: PaginatedResourcesResponse = {
        ...dto,
        resources: dto.resources.map((r) => this.dtoToDomain(r)),
      };
      this.queryCache.set(key, result);
      this.resources.set(result.resources);
      this.total.set(result.total);
      this.totalPages.set(result.totalPages);
      this.currentPage.set(result.page);
    } catch {
      this.error.set('Failed to load resources');
    } finally {
      this.loading.set(false);
    }
  }

  invalidateCache(): void {
    this.queryCache.clear();
  }

  async addResource(resource: AddResourcePayload): Promise<void> {
    await this.repository.addResourceLearning(resource);
    this.invalidateCache();
    await this.load({ page: 1, pageSize: 20 });
  }

  async getById(id: string): Promise<LearningResource> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.repository.getById(id);
      return result;
    } catch (err) {
      console.error('Error loading resource:', err);
      this.error.set('Failed to load resource');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async updateResource(id: string, payload: UpdateResourcePayload): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.repository.updateResource(id, payload);
      this.invalidateCache();
      await this.load({ page: 1, pageSize: 20 });
    } catch (err) {
      console.error('Error updating resource:', err);
      this.error.set('Failed to update resource');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  private patchResourceInCache(id: string, patch: Partial<LearningResource>): void {
    for (const [key, cached] of this.queryCache.entries()) {
      if (cached.resources.some((r) => r.id === id)) {
        this.queryCache.set(key, {
          ...cached,
          resources: cached.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        });
      }
    }
  }

  private async optimisticToggle(
    id: string,
    patch: Partial<LearningResource>,
    apiCall: () => Promise<void>,
  ): Promise<void> {
    const prev = this.resources().find((r) => r.id === id);
    if (!prev) return;

    this.resources.update((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

    try {
      await apiCall();
      this.patchResourceInCache(id, patch);
    } catch (err) {
      this.resources.update((rs) => rs.map((r) => (r.id === id ? prev : r)));
      throw err;
    }
  }

  async toggleDifficulty(id: string, difficulty: DifficultyLevel): Promise<void> {
    return this.optimisticToggle(id, { difficulty }, () =>
      this.repository.toggleDifficulty(id, difficulty),
    );
  }

  async toggleEnergy(id: string, energyLevel: EnergyLevel): Promise<void> {
    return this.optimisticToggle(id, { energyLevel }, () =>
      this.repository.toggleEnergy(id, energyLevel),
    );
  }

  async toggleStatus(id: string, status: ResourceStatus): Promise<void> {
    return this.optimisticToggle(id, { status }, () => this.repository.toggleStatus(id, status));
  }

  async toggleMentalState(id: string, mentalState: MentalStateType): Promise<void> {
    return this.optimisticToggle(id, { mentalState }, () =>
      this.repository.toggleMentalState(id, mentalState),
    );
  }

  async deleteResource(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.repository.deleteResource(id);
      this.invalidateCache();
      await this.load({ page: 1, pageSize: 20 });
    } catch (err) {
      console.error('Error deleting resource:', err);
      this.error.set('Failed to delete resource');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  private dtoToDomain(dto: PaginatedResourcesDto['resources'][number]): LearningResource {
    const capitalize = (v: string) =>
      (v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()) as DifficultyLevel & EnergyLevel;
    const toStatus = (v: string): ResourceStatus => {
      if (v === 'in_progress') return 'InProgress';
      if (v === 'pending') return 'Pending';
      if (v === 'completed') return 'Completed';
      return 'Pending';
    };
    return {
      id: dto.id,
      title: dto.title,
      difficulty: capitalize(dto.difficulty) as DifficultyLevel,
      energyLevel: capitalize(dto.energyLevel) as EnergyLevel,
      status: toStatus(dto.status),
      typeId: dto.typeId,
      topicIds: dto.topicIds,
      estimatedDuration: { value: 0, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private toHttpParams(params: ResourceQueryParams): Record<string, string> {
    const result: Record<string, string> = {};
    if (params.page !== undefined) result['page'] = String(params.page);
    if (params.pageSize !== undefined) result['pageSize'] = String(params.pageSize);
    if (params.q?.trim()) result['q'] = params.q.trim();
    if (params.difficulty) result['difficulty'] = params.difficulty.toLowerCase();
    if (params.energyLevel) result['energyLevel'] = params.energyLevel.toLowerCase();
    if (params.status) result['status'] = this.toApiStatus(params.status);
    if (params.mentalState) result['mentalState'] = params.mentalState;
    if (params.resourceTypeId) result['resourceTypeId'] = params.resourceTypeId;
    return result;
  }

  private toApiStatus(status: ResourceStatus): string {
    const map: Record<ResourceStatus, string> = {
      Pending: 'pending',
      InProgress: 'in_progress',
      Completed: 'completed',
    };
    return map[status];
  }
}
