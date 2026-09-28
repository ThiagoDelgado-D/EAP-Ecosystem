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
import { In, type Repository } from "typeorm";
import { arePrerequisitesDone } from "../learning-path/learning-path-prerequisites.js";

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
    const paths = await this.pathRepository.find({ where: { userId } });
    if (paths.length === 0) return [];
    const pathIds = paths.map((path) => path.id);

    const [nodes, edges] = await Promise.all([
      this.nodeRepository.find({ where: { pathId: In(pathIds) } }),
      this.edgeRepository.find({ where: { pathId: In(pathIds) } }),
    ]);

    const resourceIds = nodes
      .map((node) => node.learningResourceId)
      .filter((id): id is string => !!id);
    const resources = resourceIds.length
      ? await this.resourceRepository.find({ where: { id: In(resourceIds) } })
      : [];
    const resourceById = new Map(
      resources.map((resource) => [resource.id, resource]),
    );

    const pathById = new Map(paths.map((path) => [path.id, path]));
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const nodesByPathId = groupBy(nodes, (node) => node.pathId);
    const edgesByPathId = groupBy(edges, (edge) => edge.pathId);

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

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k) ?? [];
    list.push(item);
    map.set(k, list);
  }
  return map;
}
