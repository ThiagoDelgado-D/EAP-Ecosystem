import type { UUID } from "domain-lib";
import type {
  ILearningPathRepository,
  LearningPath,
  LearningPathEdge,
  LearningPathNode,
  LearningPathWithNodes,
} from "@learning-resource/domain";
import type {
  LearningPathNodePatch,
  LearningPathPatch,
} from "@learning-resource/domain";

export interface MockedLearningPathRepository extends ILearningPathRepository {
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

    async findAllByUserId(userId: UUID): Promise<LearningPath[]> {
      return this.paths.filter((p) => p.userId === userId);
    },

    async findById(id: UUID): Promise<LearningPath | null> {
      return this.paths.find((p) => p.id === id) ?? null;
    },

    async findByIdWithNodes(id: UUID): Promise<LearningPathWithNodes | null> {
      const path = this.paths.find((p) => p.id === id);
      if (!path) return null;
      return {
        path,
        nodes: this.nodes.filter((n) => n.pathId === id),
        edges: this.edges.filter((e) => e.pathId === id),
      };
    },

    async save(path: LearningPath): Promise<LearningPath> {
      this.paths.push(path);
      return path;
    },

    async update(id: UUID, patch: LearningPathPatch): Promise<LearningPath> {
      const index = this.paths.findIndex((p) => p.id === id);
      const existing = this.paths[index]!;
      const updated = { ...existing, ...patch, updatedAt: new Date() };
      this.paths[index] = updated;
      return updated;
    },

    async delete(id: UUID): Promise<void> {
      this.paths = this.paths.filter((p) => p.id !== id);
      this.nodes = this.nodes.filter((n) => n.pathId !== id);
      this.edges = this.edges.filter((e) => e.pathId !== id);
    },

    async saveNode(node: LearningPathNode): Promise<LearningPathNode> {
      this.nodes.push(node);
      return node;
    },

    async updateNode(id: UUID, patch: LearningPathNodePatch): Promise<LearningPathNode> {
      const index = this.nodes.findIndex((n) => n.id === id);
      const existing = this.nodes[index]!;
      const updated = { ...existing, ...patch, updatedAt: new Date() } as LearningPathNode;
      this.nodes[index] = updated;
      return updated;
    },

    async deleteNode(id: UUID): Promise<void> {
      this.nodes = this.nodes.filter((n) => n.id !== id);
      this.edges = this.edges.filter(
        (e) => e.sourceNodeId !== id && e.targetNodeId !== id,
      );
    },

    async findNodeById(id: UUID): Promise<LearningPathNode | null> {
      return this.nodes.find((n) => n.id === id) ?? null;
    },

    async saveEdge(edge: LearningPathEdge): Promise<LearningPathEdge> {
      this.edges.push(edge);
      return edge;
    },

    async deleteEdge(id: UUID): Promise<void> {
      this.edges = this.edges.filter((e) => e.id !== id);
    },

    async findEdgesByPathId(pathId: UUID): Promise<LearningPathEdge[]> {
      return this.edges.filter((e) => e.pathId === pathId);
    },

    reset(): void {
      this.paths = [];
      this.nodes = [];
      this.edges = [];
    },
  };
}
