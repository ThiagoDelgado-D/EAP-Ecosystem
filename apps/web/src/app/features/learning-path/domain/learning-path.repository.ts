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
} from './learning-path.model';

export abstract class LearningPathRepository {
  abstract getAll(): Promise<LearningPath[]>;
  abstract getById(id: string): Promise<LearningPathWithNodes>;
  abstract create(payload: CreateLearningPathPayload): Promise<LearningPath>;
  abstract update(id: string, payload: UpdateLearningPathPayload): Promise<LearningPath>;
  abstract delete(id: string): Promise<void>;

  abstract addNode(pathId: string, payload: AddLearningPathNodePayload): Promise<LearningPathNode>;
  abstract updateNode(
    pathId: string,
    nodeId: string,
    payload: UpdateLearningPathNodePayload,
  ): Promise<LearningPathNode>;
  abstract deleteNode(pathId: string, nodeId: string): Promise<void>;
  abstract updateNodeProgress(
    pathId: string,
    nodeId: string,
    progress: NodeProgress,
  ): Promise<LearningPathNode>;
  abstract updateNodePosition(
    pathId: string,
    nodeId: string,
    x: number,
    y: number,
  ): Promise<LearningPathNode>;

  abstract addEdge(pathId: string, payload: AddLearningPathEdgePayload): Promise<LearningPathEdge>;
  abstract deleteEdge(pathId: string, edgeId: string): Promise<void>;
}
