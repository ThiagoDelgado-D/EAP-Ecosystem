import type { UUID } from "domain-lib";
import {
  CandidateNodeEnergyLevel,
  CandidateNodeMentalState,
  CandidateNodeProgress,
  type CandidateNode,
  type CandidateNodesPort,
} from "@pomodoro/domain";
import {
  LearningPathEdgeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningResourceEntity,
} from "@learning-resource/infrastructure";
import { type Repository } from "typeorm";
import { arePrerequisitesDone } from "../learning-path/learning-path-prerequisites.js";
import { loadActivePathGraph } from "../learning-path/learning-path-graph-loader.js";

const findLinkedResource = (
  node: LearningPathNodeEntity,
  resourceById: Map<string, LearningResourceEntity>,
): LearningResourceEntity | undefined => {
  if (!node.learningResourceId) return undefined;
  return resourceById.get(node.learningResourceId);
};

export class TypeOrmCandidateNodesAdapter implements CandidateNodesPort {
  constructor(
    private readonly pathRepository: Repository<LearningPathEntity>,
    private readonly nodeRepository: Repository<LearningPathNodeEntity>,
    private readonly edgeRepository: Repository<LearningPathEdgeEntity>,
    private readonly resourceRepository: Repository<LearningResourceEntity>,
  ) {}

  async findCandidateNodes(userId: UUID): Promise<CandidateNode[]> {
    const graph = await loadActivePathGraph(
      userId,
      this.pathRepository,
      this.nodeRepository,
      this.edgeRepository,
      this.resourceRepository,
    );
    if (!graph) return [];
    const { nodes, pathById, nodeById, nodesByPathId, edgesByPathId, resourceById } =
      graph;

    return nodes.map((node) => {
      const path = pathById.get(node.pathId)!;
      const resource = findLinkedResource(node, resourceById);
      return {
        pathId: path.id as UUID,
        pathTitle: path.title,
        nodeId: node.id as UUID,
        nodeTitle: node.title,
        progress: node.progress as CandidateNodeProgress,
        prerequisitesDone: arePrerequisitesDone(
          node,
          path.mode,
          nodesByPathId.get(node.pathId) ?? [],
          edgesByPathId.get(node.pathId) ?? [],
          nodeById,
        ),
        resourceId: (node.learningResourceId as UUID) ?? undefined,
        resourceEnergyLevel: resource?.energyLevel as CandidateNodeEnergyLevel | undefined,
        resourceMentalState: (resource?.mentalState as CandidateNodeMentalState | null) ?? undefined,
      };
    });
  }
}
