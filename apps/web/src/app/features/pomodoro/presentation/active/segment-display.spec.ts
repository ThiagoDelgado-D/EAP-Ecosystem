import type { Segment } from '@features/pomodoro/domain/pomodoro.model';
import { formatMinutes, segmentDurationSec, segmentToTarget, segmentTotals } from './segment-display';

describe('segmentToTarget', () => {
  test('should map a node segment to a node SegmentTarget', () => {
    const segment: Segment = {
      id: 's1',
      sessionId: 'sess1',
      startSec: 0,
      targetKind: 'node',
      learningPathId: 'path1',
      learningPathNodeId: 'node1',
      resourceId: 'resource1',
    };

    expect(segmentToTarget(segment)).toEqual({
      kind: 'node',
      learningPathId: 'path1',
      learningPathNodeId: 'node1',
      resourceId: 'resource1',
    });
  });

  test('should map a free segment to a free SegmentTarget', () => {
    const segment: Segment = { id: 's1', sessionId: 'sess1', startSec: 0, targetKind: 'free' };
    expect(segmentToTarget(segment)).toEqual({ kind: 'free' });
  });
});

describe('segmentDurationSec', () => {
  test('should use endSec when the segment is closed', () => {
    const segment: Segment = { id: 's1', sessionId: 'sess1', startSec: 60, endSec: 300, targetKind: 'free' };
    expect(segmentDurationSec(segment, 900)).toBe(240);
  });

  test('should use the current elapsed time when the segment is still open', () => {
    const segment: Segment = { id: 's1', sessionId: 'sess1', startSec: 60, targetKind: 'free' };
    expect(segmentDurationSec(segment, 300)).toBe(240);
  });
});

describe('segmentTotals', () => {
  test('should roll up real time per target, not split it evenly', () => {
    const segments: Segment[] = [
      { id: 's1', sessionId: 'sess1', startSec: 0, endSec: 600, targetKind: 'node', learningPathId: 'p1', learningPathNodeId: 'n1' },
      { id: 's2', sessionId: 'sess1', startSec: 600, endSec: 900, targetKind: 'resource', resourceId: 'r1' },
      { id: 's3', sessionId: 'sess1', startSec: 900, targetKind: 'node', learningPathId: 'p1', learningPathNodeId: 'n1' },
    ];

    const totals = segmentTotals(segments, 1200);

    expect(totals).toEqual([
      { key: 'node:p1:n1', target: { kind: 'node', learningPathId: 'p1', learningPathNodeId: 'n1', resourceId: undefined }, secs: 900, parts: 2 },
      { key: 'resource:r1', target: { kind: 'resource', resourceId: 'r1' }, secs: 300, parts: 1 },
    ]);
  });
});

describe('formatMinutes', () => {
  test('should format sub-minute durations as "<1m"', () => {
    expect(formatMinutes(10)).toBe('<1m');
  });

  test('should format minutes under an hour plainly', () => {
    expect(formatMinutes(25 * 60)).toBe('25m');
  });

  test('should format durations over an hour as "Xh Ym"', () => {
    expect(formatMinutes(90 * 60)).toBe('1h 30m');
  });
});
