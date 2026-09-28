import type { UUID } from "domain-lib";
import {
  LearningPathEdgeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningResourceEntity,
} from "@learning-resource/infrastructure";
import { In, type Repository } from "typeorm";

export interface LearningPathGraph {
  nodes: LearningPathNodeEntity[];
  pathById: Map<string, LearningPathEntity>;
  nodeById: Map<string, LearningPathNodeEntity>;
  nodesByPathId: Map<string, LearningPathNodeEntity[]>;
  edgesByPathId: Map<string, LearningPathEdgeEntity[]>;
  resourceById: Map<string, LearningResourceEntity>;
}

export async function loadActivePathGraph(
  userId: UUID,
  pathRepository: Repository<LearningPathEntity>,
  nodeRepository: Repository<LearningPathNodeEntity>,
  edgeRepository: Repository<LearningPathEdgeEntity>,
  resourceRepository: Repository<LearningResourceEntity>,
): Promise<LearningPathGraph | null> {
  const paths = await pathRepository.find({ where: { userId } });
  if (paths.length === 0) return null;
  const pathIds = paths.map((path) => path.id);

  const [nodes, edges] = await Promise.all([
    nodeRepository.find({ where: { pathId: In(pathIds) } }),
    edgeRepository.find({ where: { pathId: In(pathIds) } }),
  ]);

  const resourceIds = nodes
    .map((node) => node.learningResourceId)
    .filter((id): id is string => !!id);
  const resources = resourceIds.length
    ? await resourceRepository.find({ where: { id: In(resourceIds) } })
    : [];

  return {
    nodes,
    pathById: new Map(paths.map((path) => [path.id, path])),
    nodeById: new Map(nodes.map((node) => [node.id, node])),
    nodesByPathId: groupBy(nodes, (node) => node.pathId),
    edgesByPathId: groupBy(edges, (edge) => edge.pathId),
    resourceById: new Map(resources.map((resource) => [resource.id, resource])),
  };
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
