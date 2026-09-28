import type {
  LearningPathEdgeEntity,
  LearningPathNodeEntity,
} from "@learning-resource/infrastructure";

export function arePrerequisitesDone(
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
