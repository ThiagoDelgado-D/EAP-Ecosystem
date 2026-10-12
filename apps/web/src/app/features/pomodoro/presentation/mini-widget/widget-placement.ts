import type { MiniWidgetOffset } from '@features/pomodoro/application/pomodoro-view-preferences';

export type Box = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left'>;

export interface Size {
  width: number;
  height: number;
}

export type Viewport = Size;

function cornerShift(beforeStart: number, beforeEnd: number, afterStart: number, afterEnd: number, limit: number) {
  const nearStartEdge = (beforeStart + beforeEnd) / 2 < limit / 2;
  if (nearStartEdge) return beforeStart - afterStart;
  return beforeEnd - afterEnd;
}

function overflowShift(start: number, end: number, limit: number): number {
  if (start < 0) return -start;
  if (end > limit) return limit - end;
  return 0;
}

export function holdNearestCorner(before: Box, after: Box, viewport: Viewport): MiniWidgetOffset {
  const x = cornerShift(before.left, before.right, after.left, after.right, viewport.width);
  const y = cornerShift(before.top, before.bottom, after.top, after.bottom, viewport.height);
  const shifted = { left: after.left + x, right: after.right + x, top: after.top + y, bottom: after.bottom + y };
  return {
    x: x + overflowShift(shifted.left, shifted.right, viewport.width),
    y: y + overflowShift(shifted.top, shifted.bottom, viewport.height),
  };
}
