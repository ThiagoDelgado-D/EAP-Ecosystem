import type { UUID } from "domain-lib";
import type { LearningPath } from "../entities/learning-path.js";
import type {
  LearningPathNode,
  LearningPathWithNodes,
} from "../entities/learning-path-node.js";
import type { LearningPathEdge } from "../entities/learning-path-edge.js";

export interface ILearningPathRepository {
  findAllByUserId(userId: UUID): Promise<LearningPath[]>;
  findById(id: UUID): Promise<LearningPath | null>;
  findByIdWithNodes(id: UUID): Promise<LearningPathWithNodes | null>;
  save(path: LearningPath): Promise<LearningPath>;
  update(id: UUID, patch: Partial<LearningPath>): Promise<LearningPath>;
  delete(id: UUID): Promise<void>;

  saveNode(node: LearningPathNode): Promise<LearningPathNode>;
  updateNode(
    id: UUID,
    patch: Partial<LearningPathNode>,
  ): Promise<LearningPathNode>;
  deleteNode(id: UUID): Promise<void>;
  findNodeById(id: UUID): Promise<LearningPathNode | null>;

  saveEdge(edge: LearningPathEdge): Promise<LearningPathEdge>;
  deleteEdge(id: UUID): Promise<void>;
  findEdgesByPathId(pathId: UUID): Promise<LearningPathEdge[]>;
}
