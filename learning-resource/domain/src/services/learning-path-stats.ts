import type { LearningPathStats } from "../entities/learning-path.js";
import { NodeProgress, type LearningPathNode } from "../entities/learning-path-node.js";

export const computeLearningPathStats = (nodes: LearningPathNode[]): LearningPathStats => ({
  total: nodes.length,
  done: nodes.filter((n) => n.progress === NodeProgress.DONE).length,
  linked: nodes.filter((n) => n.learningResourceId != null).length,
});
