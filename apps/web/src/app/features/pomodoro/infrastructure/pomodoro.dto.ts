interface BaseSegmentDto {
  id: string;
  sessionId: string;
  startSec: number;
  endSec?: number;
}

export interface FreeSegmentDto extends BaseSegmentDto {
  targetKind: 'free';
}

export interface ResourceSegmentDto extends BaseSegmentDto {
  targetKind: 'resource';
  resourceId: string;
}

export interface NodeSegmentDto extends BaseSegmentDto {
  targetKind: 'node';
  learningPathId: string;
  learningPathNodeId: string;
  resourceId?: string;
}

export type SegmentDto = FreeSegmentDto | ResourceSegmentDto | NodeSegmentDto;

export interface SessionDto {
  id: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  intent?: string;
  plannedMin: number;
}

export interface SwitchTargetResponseDto {
  closedSegment: SegmentDto;
  openedSegment: SegmentDto;
}

export type EndSessionResponseDto =
  | { discarded: true }
  | { discarded: false; session: SessionDto; segments: SegmentDto[] };

export interface SuggestedCandidateDto {
  pathId: string;
  pathTitle: string;
  nodeId: string;
  nodeTitle: string;
  resourceId?: string;
  score: number;
  why: string[];
}
