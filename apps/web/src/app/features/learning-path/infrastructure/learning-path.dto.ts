export interface LearningPathStatsDto {
  total: number;
  done: number;
  linked: number;
}

export interface LearningPathDto {
  id: string;
  userId: string;
  title: string;
  description?: string;
  mode: string;
  source: string;
  sourceSlug?: string;
  createdAt: string;
  updatedAt: string;
  stats?: LearningPathStatsDto;
}

export interface LearningPathNodeDto {
  id: string;
  pathId: string;
  title: string;
  description?: string;
  externalUrl?: string;
  learningResourceId?: string | null;
  stubScope?: string;
  order?: number;
  progress: string;
  x?: number | null;
  y?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPathEdgeDto {
  id: string;
  pathId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface LearningPathWithNodesDto {
  path: LearningPathDto;
  nodes: LearningPathNodeDto[];
  edges: LearningPathEdgeDto[];
}
