export const PATH_MODE = {
  SEQUENTIAL: 'sequential',
  GRAPH: 'graph',
} as const;

export type PathMode = (typeof PATH_MODE)[keyof typeof PATH_MODE];

export const PATH_SOURCE = {
  MANUAL: 'manual',
  ROADMAP_SH: 'roadmap.sh',
} as const;

export type PathSource = (typeof PATH_SOURCE)[keyof typeof PATH_SOURCE];

export const NODE_PROGRESS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;

export type NodeProgress = (typeof NODE_PROGRESS)[keyof typeof NODE_PROGRESS];

export const STUB_SCOPE = {
  PATH_LOCAL: 'path-local',
  CATALOG: 'catalog',
} as const;

export type StubScope = (typeof STUB_SCOPE)[keyof typeof STUB_SCOPE];

export interface LearningPathStats {
  total: number;
  done: number;
  linked: number;
}

export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description?: string;
  mode: PathMode;
  source: PathSource;
  sourceSlug?: string;
  createdAt: Date;
  updatedAt: Date;
  stats?: LearningPathStats;
}

export interface LearningPathNode {
  id: string;
  pathId: string;
  title: string;
  description?: string;
  externalUrl?: string;
  learningResourceId?: string | null;
  stubScope?: StubScope;
  order?: number;
  progress: NodeProgress;
  x?: number;
  y?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningPathEdge {
  id: string;
  pathId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface LearningPathWithNodes {
  path: LearningPath;
  nodes: LearningPathNode[];
  edges: LearningPathEdge[];
}

export interface CreateLearningPathPayload {
  title: string;
  description?: string;
  mode: PathMode;
  source?: PathSource;
  sourceSlug?: string;
}

export interface UpdateLearningPathPayload {
  title?: string;
  description?: string;
}

export interface AddLearningPathNodePayload {
  title: string;
  description?: string;
  externalUrl?: string;
  learningResourceId?: string;
  stubScope?: StubScope;
  order?: number;
  progress?: NodeProgress;
}

export interface UpdateLearningPathNodePayload {
  title?: string;
  description?: string;
  externalUrl?: string;
  learningResourceId?: string | null;
  order?: number;
  progress?: NodeProgress;
}

export interface AddLearningPathEdgePayload {
  sourceNodeId: string;
  targetNodeId: string;
}
