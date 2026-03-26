import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ResourceTypeRepository } from '../domain/resource-type.repository';
import type { ResourceType } from '../domain/resource-type.model';
import type { ResourceTypeDto, ResourceTypeListDto } from './resource-type.dto';
import { API_CONFIG } from '@core/config/api.config';

@Injectable()
export class ResourceTypeHttpRepository extends ResourceTypeRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/resource-types`;

  async getAll(): Promise<ResourceType[]> {
    const response = await firstValueFrom(this.http.get<ResourceTypeListDto>(this.baseUrl));
    return response.resourceTypes.map((dto) => this.toDomain(dto));
  }

  private toDomain(dto: ResourceTypeDto): ResourceType {
    return {
      id: dto.id,
      code: dto.code,
      displayName: dto.displayName,
      isActive: dto.isActive ?? undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }
}
