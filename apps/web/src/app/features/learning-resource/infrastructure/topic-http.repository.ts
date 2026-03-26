import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TopicRepository } from '../domain/topic.repository';
import type { Topic } from '../domain/topic.model';
import type { TopicDto, TopicListDto } from './topic.dto';
import { API_CONFIG } from '@core/config/api.config';

@Injectable()
export class TopicHttpRepository extends TopicRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/topics`;

  async getAll(): Promise<Topic[]> {
    const response = await firstValueFrom(this.http.get<TopicListDto>(this.baseUrl));
    return response.topics.map((dto) => this.toDomain(dto));
  }

  private toDomain(dto: TopicDto): Topic {
    return {
      id: dto.id,
      name: dto.name,
      color: dto.color ?? undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }
}
