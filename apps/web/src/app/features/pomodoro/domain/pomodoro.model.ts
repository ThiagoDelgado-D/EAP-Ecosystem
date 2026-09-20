export const DEFAULT_BREAK_DURATION_SEC = 300;
export const MAX_PLANNED_DURATION_MIN = 480;

export const SEGMENT_TARGET_KIND = {
  FREE: 'free',
  RESOURCE: 'resource',
  NODE: 'node',
} as const;

export type SegmentTargetKind = (typeof SEGMENT_TARGET_KIND)[keyof typeof SEGMENT_TARGET_KIND];

export interface Session {
  id: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  intent?: string;
  plannedMin: number;
  autoCompleted?: boolean;
}

export interface Break {
  id: string;
  userId: string;
  startedAt: Date;
  durationSec: number;
  endedAt?: Date;
}

interface BaseSegment {
  id: string;
  sessionId: string;
  startSec: number;
  endSec?: number;
}

export interface FreeSegment extends BaseSegment {
  targetKind: typeof SEGMENT_TARGET_KIND.FREE;
}

export interface ResourceSegment extends BaseSegment {
  targetKind: typeof SEGMENT_TARGET_KIND.RESOURCE;
  resourceId: string;
}

export interface NodeSegment extends BaseSegment {
  targetKind: typeof SEGMENT_TARGET_KIND.NODE;
  learningPathId: string;
  learningPathNodeId: string;
  resourceId?: string;
}

export type Segment = FreeSegment | ResourceSegment | NodeSegment;

export type SegmentTarget =
  | { kind: typeof SEGMENT_TARGET_KIND.FREE }
  | { kind: typeof SEGMENT_TARGET_KIND.RESOURCE; resourceId: string; learningPathId?: string }
  | {
      kind: typeof SEGMENT_TARGET_KIND.NODE;
      learningPathId: string;
      learningPathNodeId: string;
      resourceId?: string;
    };

export interface StartSessionPayload {
  plannedMin: number;
  intent?: string;
  target: SegmentTarget;
}

export interface SwitchTargetResult {
  closedSegment: Segment;
  openedSegment: Segment;
}

export interface ActiveSessionSnapshot {
  session: Session;
  segments: Segment[];
}

export interface AutoClosedSessionResult {
  autoClosed: true;
  session: Session;
  segments: Segment[];
}

export type GetActiveSessionResult = ActiveSessionSnapshot | AutoClosedSessionResult;

export interface ContinueSessionResult {
  closedSession: Session;
  session: Session;
  segments: Segment[];
}

export interface HistorySnapshot {
  sessions: Session[];
  segments: Segment[];
  breaks: Break[];
}

export type EndSessionResult =
  | { discarded: true }
  | { discarded: false; session: Session; segments: Segment[] };

export interface PathMembershipCandidate {
  pathId: string;
  pathTitle: string;
  nodeId: string;
}

export const CANDIDATE_ENERGY_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type CandidateEnergyLevel =
  (typeof CANDIDATE_ENERGY_LEVEL)[keyof typeof CANDIDATE_ENERGY_LEVEL];

export interface SuggestedCandidate {
  pathId: string;
  pathTitle: string;
  nodeId: string;
  nodeTitle: string;
  resourceId?: string;
  score: number;
  why: string[];
}
