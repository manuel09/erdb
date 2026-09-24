export type OverlayRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const rectsOverlap = (a: OverlayRect, b: OverlayRect, padding = 0) => {
  const aLeft = a.left - padding;
  const aTop = a.top - padding;
  const aRight = a.left + a.width + padding;
  const aBottom = a.top + a.height + padding;
  const bLeft = b.left - padding;
  const bTop = b.top - padding;
  const bRight = b.left + b.width + padding;
  const bBottom = b.top + b.height + padding;

  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
};

export const findFirstNonOverlappingRect = (
  candidates: OverlayRect[],
  blockedRects: OverlayRect[],
  padding = 0
): OverlayRect | null => {
  return candidates.find(
    (candidate) => !blockedRects.some((blockedRect) => rectsOverlap(candidate, blockedRect, padding))
  ) ?? null;
};
