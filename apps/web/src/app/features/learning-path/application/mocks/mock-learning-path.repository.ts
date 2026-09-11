import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import type {
  AddLearningPathEdgePayload,
  AddLearningPathNodePayload,
  CreateLearningPathPayload,
  LearningPath,
  LearningPathEdge,
  LearningPathNode,
  LearningPathWithNodes,
  NodeProgress,
  UpdateLearningPathNodePayload,
  UpdateLearningPathPayload,
} from '@features/learning-path/domain/learning-path.model';

export interface MockedLearningPathRepository extends LearningPathRepository {
  paths: LearningPath[];
  nodes: LearningPathNode[];
  edges: LearningPathEdge[];
  reset(): void;
}

export function mockLearningPathRepository(
  initial: {
    paths?: LearningPath[];
    nodes?: LearningPathNode[];
    edges?: LearningPathEdge[];
  } = {},
): MockedLearningPathRepository {
  return {
    paths: [...(initial.paths ?? [])],
    nodes: [...(initial.nodes ?? [])],
    edges: [...(initial.edges ?? [])],

    async getAll(): Promise<LearningPath[]> {
      return this.paths;
    },

    async getAllWithNodes(): Promise<LearningPathWithNodes[]> {
      return this.paths.map((path) => ({
        path,
        nodes: this.nodes.filter((n) => n.pathId === path.id),
        edges: this.edges.filter((e) => e.pathId === path.id),
      }));
    },

    async getById(id: string): Promise<LearningPathWithNodes> {
      const path = this.paths.find((p) => p.id === id);
      if (!path) throw new Error(`LearningPath not found: ${id}`);
      return {
        path,
        nodes: this.nodes.filter((n) => n.pathId === id),
        edges: this.edges.filter((e) => e.pathId === id),
      };
    },

    async create(payload: CreateLearningPathPayload): Promise<LearningPath> {
      const now = new Date();
      const path: LearningPath = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        title: payload.title,
        description: payload.description,
        mode: payload.mode,
        source: payload.source ?? 'manual',
        sourceSlug: payload.sourceSlug,
        createdAt: now,
        updatedAt: now,
      };
      this.paths.push(path);
      return path;
    },

    async update(id: string, payload: UpdateLearningPathPayload): Promise<LearningPath> {
      const index = this.paths.findIndex((p) => p.id === id);
      const existing = this.paths[index]!;
      const updated = { ...existing, ...payload, updatedAt: new Date() };
      this.paths[index] = updated;
      return updated;
    },

    async delete(id: string): Promise<void> {
      this.paths = this.paths.filter((p) => p.id !== id);
      this.nodes = this.nodes.filter((n) => n.pathId !== id);
      this.edges = this.edges.filter((e) => e.pathId !== id);
    },

    async addNode(pathId: string, payload: AddLearningPathNodePayload): Promise<LearningPathNode> {
      const now = new Date();
      const node = {
        id: crypto.randomUUID(),
        pathId,
        title: payload.title,
        description: payload.description,
        externalUrl: payload.externalUrl,
        learningResourceId: payload.learningResourceId,
        stubScope: payload.stubScope,
        order: payload.order,
        progress: payload.progress ?? 'pending',
        createdAt: now,
        updatedAt: now,
      } as LearningPathNode;
      this.nodes.push(node);
      return node;
    },

    async updateNode(
      pathId: string,
      nodeId: string,
      payload: UpdateLearningPathNodePayload,
    ): Promise<LearningPathNode> {
      const index = this.nodes.findIndex((n) => n.id === nodeId);
      const existing = this.nodes[index]!;
      const updated = { ...existing, ...payload, updatedAt: new Date() } as LearningPathNode;
      this.nodes[index] = updated;
      return updated;
    },

    async deleteNode(pathId: string, nodeId: string): Promise<void> {
      this.nodes = this.nodes.filter((n) => n.id !== nodeId);
      this.edges = this.edges.filter(
        (e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId,
      );
    },

    async updateNodeProgress(
      pathId: string,
      nodeId: string,
      progress: NodeProgress,
    ): Promise<LearningPathNode> {
      const index = this.nodes.findIndex((n) => n.id === nodeId);
      const existing = this.nodes[index]!;
      const updated = { ...existing, progress, updatedAt: new Date() };
      this.nodes[index] = updated;
      return updated;
    },

    async updateNodePosition(
      pathId: string,
      nodeId: string,
      x: number,
      y: number,
    ): Promise<LearningPathNode> {
      const index = this.nodes.findIndex((n) => n.id === nodeId);
      const existing = this.nodes[index]!;
      const updated = { ...existing, x, y, updatedAt: new Date() };
      this.nodes[index] = updated;
      return updated;
    },

    async addEdge(pathId: string, payload: AddLearningPathEdgePayload): Promise<LearningPathEdge> {
      const edge: LearningPathEdge = {
        id: crypto.randomUUID(),
        pathId,
        sourceNodeId: payload.sourceNodeId,
        targetNodeId: payload.targetNodeId,
      };
      this.edges.push(edge);
      return edge;
    },

    async deleteEdge(pathId: string, edgeId: string): Promise<void> {
      this.edges = this.edges.filter((e) => e.id !== edgeId);
    },

    reset(): void {
      this.paths = [];
      this.nodes = [];
      this.edges = [];
    },
  };
}
