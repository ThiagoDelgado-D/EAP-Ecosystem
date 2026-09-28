import type { UUID } from "domain-lib";
import type {
  LearningPathCandidatesPort,
  LearningPathNodeCandidate,
} from "@recommendation/domain";
import {
  LearningPathEdgeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningResourceEntity,
} from "@learning-resource/infrastructure";
import { type Repository } from "typeorm";
import { arePrerequisitesDone } from "../learning-path/learning-path-prerequisites.js";
import { loadActivePathGraph } from "../learning-path/learning-path-graph-loader.js";

export class TypeOrmLearningPathCandidatesAdapter implements LearningPathCandidatesPort {
  constructor(
    private readonly pathRepository: Repository<LearningPathEntity>,
    private readonly nodeRepository: Repository<LearningPathNodeEntity>,
    private readonly edgeRepository: Repository<LearningPathEdgeEntity>,
    private readonly resourceRepository: Repository<LearningResourceEntity>,
  ) {}

  async findActivePathCandidates(
    userId: UUID,
  ): Promise<LearningPathNodeCandidate[]> {
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

    const actionableNodes = nodes.filter((node) => {
      if (node.progress === "done") return false;
      const path = pathById.get(node.pathId)!;
      return arePrerequisitesDone(
        node,
        path.mode,
        nodesByPathId.get(node.pathId) ?? [],
        edgesByPathId.get(node.pathId) ?? [],
        nodeById,
      );
    });

    return actionableNodes.map((node) => {
      const path = pathById.get(node.pathId)!;
      const resource = node.learningResourceId
        ? resourceById.get(node.learningResourceId)
        : undefined;

      return {
        pathId: path.id as UUID,
        pathTitle: path.title,
        nodeId: node.id as UUID,
        nodeTitle: node.title,
        resourceId: (node.learningResourceId as UUID) ?? undefined,
        energyLevel:
          resource?.energyLevel as LearningPathNodeCandidate["energyLevel"],
        mentalState:
          (resource?.mentalState as LearningPathNodeCandidate["mentalState"]) ??
          undefined,
        estimatedMinutes: resource?.estimatedDurationMinutes ?? undefined,
        lastViewed: resource?.lastViewedAt ?? undefined,
      };
    });
  }
}
