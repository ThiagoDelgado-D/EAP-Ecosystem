import { describe, expect, test } from 'vitest';
import { holdNearestCorner, type Box } from './widget-placement';

const laptopViewport = { width: 1440, height: 900 };
const expandedCardSize = { width: 280, height: 330 };
const collapsedPillSize = { width: 90, height: 40 };

function boxAt(left: number, top: number, size: { width: number; height: number }): Box {
  return { left, top, right: left + size.width, bottom: top + size.height };
}

function anchoredBottomRight(box: Box, size: { width: number; height: number }): Box {
  return boxAt(box.right - size.width, box.bottom - size.height, size);
}

describe('holdNearestCorner', () => {
  test('should keep the pill in the bottom-left corner the card occupied when collapsed there', () => {
    const cardBottomLeft = boxAt(200, laptopViewport.height - expandedCardSize.height - 16, expandedCardSize);
    const pillAnchoredBottomRight = anchoredBottomRight(cardBottomLeft, collapsedPillSize);

    const shift = holdNearestCorner(cardBottomLeft, pillAnchoredBottomRight, laptopViewport);

    expect(pillAnchoredBottomRight.left + shift.x).toBe(cardBottomLeft.left);
    expect(pillAnchoredBottomRight.bottom + shift.y).toBe(cardBottomLeft.bottom);
  });

  test('should not move the widget in its default bottom-right spot', () => {
    const cardBottomRight = boxAt(
      laptopViewport.width - expandedCardSize.width - 16,
      laptopViewport.height - expandedCardSize.height - 16,
      expandedCardSize,
    );
    const pillAnchoredBottomRight = anchoredBottomRight(cardBottomRight, collapsedPillSize);

    expect(holdNearestCorner(cardBottomRight, pillAnchoredBottomRight, laptopViewport)).toEqual({ x: 0, y: 0 });
  });

  test('should grow the card downwards when expanding a pill parked near the top edge', () => {
    const pillTopLeft = boxAt(16, 16, collapsedPillSize);
    const cardAnchoredBottomRight = anchoredBottomRight(pillTopLeft, expandedCardSize);

    const shift = holdNearestCorner(pillTopLeft, cardAnchoredBottomRight, laptopViewport);

    expect(cardAnchoredBottomRight.left + shift.x).toBe(pillTopLeft.left);
    expect(cardAnchoredBottomRight.top + shift.y).toBe(pillTopLeft.top);
  });

  test('should pull the widget back inside when holding the corner would leave it off-screen', () => {
    const pillHuggingLeftEdge = boxAt(0, laptopViewport.height / 2 - collapsedPillSize.height, collapsedPillSize);
    const tallerThanRoomBelow = { width: expandedCardSize.width, height: laptopViewport.height * 0.6 };
    const cardAnchoredBottomRight = anchoredBottomRight(pillHuggingLeftEdge, tallerThanRoomBelow);

    const shift = holdNearestCorner(pillHuggingLeftEdge, cardAnchoredBottomRight, laptopViewport);

    expect(cardAnchoredBottomRight.left + shift.x).toBe(0);
    expect(cardAnchoredBottomRight.top + shift.y).toBeGreaterThanOrEqual(0);
    expect(cardAnchoredBottomRight.bottom + shift.y).toBeLessThanOrEqual(laptopViewport.height);
  });
});
