import type { UUID } from "domain-lib";
import {
  CandidateNodeEnergyLevel,
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
import { In, type Repository } from "typeorm";

export class TypeOrmCandidateNodesAdapter implements CandidateNodesPort {
  constructor(
    private readonly pathRepository: Repository<LearningPathEntity>,
    private readonly nodeRepository: Repository<LearningPathNodeEntity>,
    private readonly edgeRepository: Repository<LearningPathEdgeEntity>,
    private readonly resourceRepository: Repository<LearningResourceEntity>,
  ) {}

  async findCandidateNodes(userId: UUID): Promise<CandidateNode[]> {
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
    const energyByResourceId = new Map(
      resources.map((resource) => [resource.id, resource.energyLevel]),
    );

    const pathById = new Map(paths.map((path) => [path.id, path]));
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const nodesByPathId = groupBy(nodes, (node) => node.pathId);
    const edgesByPathId = groupBy(edges, (edge) => edge.pathId);

    return nodes.map((node) => {
      const path = pathById.get(node.pathId)!;
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
        resourceEnergyLevel: node.learningResourceId
          ? (energyByResourceId.get(node.learningResourceId) as
              | CandidateNodeEnergyLevel
              | undefined)
          : undefined,
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

function arePrerequisitesDone(
  node: LearningPathNodeEntity,
  mode: string,
  pathNodes: LearningPathNodeEntity[],
  pathEdges: LearningPathEdgeEntity[],
  nodeById: Map<string, LearningPathNodeEntity>,
): boolean {
  if (mode === "sequential") {
    const sorted = [...pathNodes].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    const index = sorted.findIndex((n) => n.id === node.id);
    return sorted.slice(0, index).every((n) => n.progress === "done");
  }

  const prerequisiteIds = pathEdges
    .filter((edge) => edge.targetNodeId === node.id)
    .map((edge) => edge.sourceNodeId);
  return prerequisiteIds.every((id) => nodeById.get(id)?.progress === "done");
}
