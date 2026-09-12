import type { Segment, SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';

export function segmentToTarget(segment: Segment): SegmentTarget {
  if (segment.targetKind === 'node') {
    return {
      kind: 'node',
      learningPathId: segment.learningPathId,
      learningPathNodeId: segment.learningPathNodeId,
      resourceId: segment.resourceId,
    };
  }
  if (segment.targetKind === 'resource') {
    return { kind: 'resource', resourceId: segment.resourceId };
  }
  return { kind: 'free' };
}

export function currentSegmentTarget(segments: Segment[]): SegmentTarget | null {
  const last = segments[segments.length - 1];
  return last ? segmentToTarget(last) : null;
}

export function segmentDurationSec(segment: Segment, elapsedSec: number): number {
  const end = segment.endSec ?? elapsedSec;
  return Math.max(0, end - segment.startSec);
}

export interface SegmentTotal {
  key: string;
  target: SegmentTarget;
  secs: number;
  parts: number;
}

export function targetKey(target: SegmentTarget): string {
  if (target.kind === 'node') return `node:${target.learningPathId}:${target.learningPathNodeId}`;
  if (target.kind === 'resource') return `resource:${target.resourceId}`;
  return 'free';
}

export function segmentTotals(segments: Segment[], elapsedSec: number): SegmentTotal[] {
  const map = new Map<string, SegmentTotal>();
  for (const segment of segments) {
    const target = segmentToTarget(segment);
    const key = targetKey(target);
    const current = map.get(key) ?? { key, target, secs: 0, parts: 0 };
    current.secs += segmentDurationSec(segment, elapsedSec);
    current.parts += 1;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => b.secs - a.secs);
}

export function formatMinutes(totalSec: number): string {
  const minutes = Math.round(totalSec / 60);
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
