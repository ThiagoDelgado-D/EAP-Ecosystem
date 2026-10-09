import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TopicRepository } from '../domain/topic.repository';
import type { CreateTopicPayload, Topic, UpdateTopicPayload } from '../domain/topic.model';
import type { TopicDto, TopicListDto } from './topic.dto';
import { API_CONFIG } from '@core/config/api.config';
import { toTone } from '@shared/utils/tone';

@Injectable()
export class TopicHttpRepository extends TopicRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/topics`;

  async getAll(): Promise<Topic[]> {
    const response = await firstValueFrom(this.http.get<TopicListDto>(this.baseUrl));
    return response.topics.map((dto) => this.toDomain(dto));
  }

  async create(payload: CreateTopicPayload): Promise<Topic> {
    const dto = await firstValueFrom(this.http.post<TopicDto>(this.baseUrl, payload));
    return this.toDomain(dto);
  }

  async update(id: string, payload: UpdateTopicPayload): Promise<Topic> {
    const dto = await firstValueFrom(this.http.patch<TopicDto>(`${this.baseUrl}/${id}`, payload));
    return this.toDomain(dto);
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }

  private toDomain(dto: TopicDto): Topic {
    return {
      id: dto.id,
      name: dto.name,
      color: toTone(dto.color),
      resourceCount: dto.resourceCount ?? 0,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }
}
