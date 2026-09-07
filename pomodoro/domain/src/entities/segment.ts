import type { Entity, UUID } from "domain-lib";

export const SegmentTargetKind = {
  FREE: "free",
  RESOURCE: "resource",
  NODE: "node",
} as const;

export type SegmentTargetKind =
  (typeof SegmentTargetKind)[keyof typeof SegmentTargetKind];

interface BaseSegment extends Entity {
  sessionId: UUID;
  startSec: number;
  endSec?: number;
}

export interface FreeSegment extends BaseSegment {
  targetKind: typeof SegmentTargetKind.FREE;
  resourceId?: never;
  learningPathId?: never;
  learningPathNodeId?: never;
}

export interface ResourceSegment extends BaseSegment {
  targetKind: typeof SegmentTargetKind.RESOURCE;
  resourceId: UUID;
  learningPathId?: never;
  learningPathNodeId?: never;
}

export interface NodeSegment extends BaseSegment {
  targetKind: typeof SegmentTargetKind.NODE;
  learningPathId: UUID;
  learningPathNodeId: UUID;
  /** Unset = stub segment (node not yet promoted to a real resource). */
  resourceId?: UUID;
}

export type Segment = FreeSegment | ResourceSegment | NodeSegment;
