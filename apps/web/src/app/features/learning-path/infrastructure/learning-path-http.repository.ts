import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LearningPathRepository } from '../domain/learning-path.repository';
import type {
  AddLearningPathEdgePayload,
  AddLearningPathNodePayload,
  CreateLearningPathPayload,
  LearningPath,
  LearningPathEdge,
  LearningPathNode,
  LearningPathWithNodes,
  NodeProgress,
  PathMode,
  PathSource,
  StubScope,
  UpdateLearningPathNodePayload,
  UpdateLearningPathPayload,
} from '../domain/learning-path.model';
import type {
  LearningPathDto,
  LearningPathEdgeDto,
  LearningPathNodeDto,
  LearningPathWithNodesDto,
} from './learning-path.dto';
import { API_CONFIG } from '@core/config/api.config';

@Injectable()
export class LearningPathHttpRepository extends LearningPathRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/learning-paths`;

  async getAll(): Promise<LearningPath[]> {
    const dtos = await firstValueFrom(this.http.get<LearningPathDto[]>(this.baseUrl));
    return dtos.map((dto) => this.toDomain(dto));
  }

  async getById(id: string): Promise<LearningPathWithNodes> {
    const dto = await firstValueFrom(
      this.http.get<LearningPathWithNodesDto>(`${this.baseUrl}/${id}`),
    );
    return {
      path: this.toDomain(dto.path),
      nodes: dto.nodes.map((node) => this.toNodeDomain(node)),
      edges: dto.edges.map((edge) => this.toEdgeDomain(edge)),
    };
  }

  async create(payload: CreateLearningPathPayload): Promise<LearningPath> {
    const dto = await firstValueFrom(this.http.post<LearningPathDto>(this.baseUrl, payload));
    return this.toDomain(dto);
  }

  async update(id: string, payload: UpdateLearningPathPayload): Promise<LearningPath> {
    const dto = await firstValueFrom(
      this.http.patch<LearningPathDto>(`${this.baseUrl}/${id}`, payload),
    );
    return this.toDomain(dto);
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
  }

  async addNode(pathId: string, payload: AddLearningPathNodePayload): Promise<LearningPathNode> {
    const dto = await firstValueFrom(
      this.http.post<LearningPathNodeDto>(`${this.baseUrl}/${pathId}/nodes`, payload),
    );
    return this.toNodeDomain(dto);
  }

  async updateNode(
    pathId: string,
    nodeId: string,
    payload: UpdateLearningPathNodePayload,
  ): Promise<LearningPathNode> {
    const dto = await firstValueFrom(
      this.http.patch<LearningPathNodeDto>(`${this.baseUrl}/${pathId}/nodes/${nodeId}`, payload),
    );
    return this.toNodeDomain(dto);
  }

  async deleteNode(pathId: string, nodeId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${pathId}/nodes/${nodeId}`));
  }

  async updateNodeProgress(
    pathId: string,
    nodeId: string,
    progress: NodeProgress,
  ): Promise<LearningPathNode> {
    const dto = await firstValueFrom(
      this.http.patch<LearningPathNodeDto>(
        `${this.baseUrl}/${pathId}/nodes/${nodeId}/progress`,
        { progress },
      ),
    );
    return this.toNodeDomain(dto);
  }

  async updateNodePosition(
    pathId: string,
    nodeId: string,
    x: number,
    y: number,
  ): Promise<LearningPathNode> {
    const dto = await firstValueFrom(
      this.http.patch<LearningPathNodeDto>(
        `${this.baseUrl}/${pathId}/nodes/${nodeId}/position`,
        { x, y },
      ),
    );
    return this.toNodeDomain(dto);
  }

  async addEdge(pathId: string, payload: AddLearningPathEdgePayload): Promise<LearningPathEdge> {
    const dto = await firstValueFrom(
      this.http.post<LearningPathEdgeDto>(`${this.baseUrl}/${pathId}/edges`, payload),
    );
    return this.toEdgeDomain(dto);
  }

  async deleteEdge(pathId: string, edgeId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${pathId}/edges/${edgeId}`));
  }

  private parseDate(value: string | null | undefined): Date {
    if (!value) {
      console.warn('Missing date value, using current date as fallback');
      return new Date();
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(`Invalid date string: ${value}`);
    return date;
  }

  private toDomain(dto: LearningPathDto): LearningPath {
    return {
      id: dto.id,
      userId: dto.userId,
      title: dto.title,
      description: dto.description ?? undefined,
      mode: dto.mode as PathMode,
      source: dto.source as PathSource,
      sourceSlug: dto.sourceSlug ?? undefined,
      createdAt: this.parseDate(dto.createdAt),
      updatedAt: this.parseDate(dto.updatedAt),
      stats: dto.stats,
    };
  }

  private toNodeDomain(dto: LearningPathNodeDto): LearningPathNode {
    return {
      id: dto.id,
      pathId: dto.pathId,
      title: dto.title,
      description: dto.description ?? undefined,
      externalUrl: dto.externalUrl ?? undefined,
      learningResourceId: dto.learningResourceId ?? undefined,
      stubScope: dto.stubScope as StubScope | undefined,
      order: dto.order ?? undefined,
      progress: dto.progress as NodeProgress,
      x: dto.x ?? undefined,
      y: dto.y ?? undefined,
      createdAt: this.parseDate(dto.createdAt),
      updatedAt: this.parseDate(dto.updatedAt),
    };
  }

  private toEdgeDomain(dto: LearningPathEdgeDto): LearningPathEdge {
    return {
      id: dto.id,
      pathId: dto.pathId,
      sourceNodeId: dto.sourceNodeId,
      targetNodeId: dto.targetNodeId,
    };
  }
}
