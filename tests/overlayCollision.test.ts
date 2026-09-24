import assert from 'node:assert/strict';
import { findFirstNonOverlappingRect, rectsOverlap, type OverlayRect } from '../lib/overlayCollision';

const rect = (left: number, top: number, width: number, height: number): OverlayRect => ({
  left,
  top,
  width,
  height,
});

const run = () => {
  const qualityOnRight = rect(370, 420, 110, 42);
  const logoCandidates = [rect(250, 420, 96, 42), rect(202, 420, 96, 42)];
  const logo = findFirstNonOverlappingRect(logoCandidates, [qualityOnRight], 8);
  assert.deepEqual(logo, logoCandidates[0], 'logo must stay left of right quality badges');

  const averageOnRight = rect(310, 16, 150, 44);
  const rankingCandidates = [rect(145, 16, 145, 44), rect(16, 16, 145, 44)];
  const ranking = findFirstNonOverlappingRect(rankingCandidates, [averageOnRight], 8);
  assert.deepEqual(ranking, rankingCandidates[0], 'ranking must share the top row left of average');

  assert.equal(rectsOverlap(rect(100, 100, 50, 30), rect(150, 100, 50, 30)), false);
  assert.equal(rectsOverlap(rect(100, 100, 50, 30), rect(150, 100, 50, 30), 1), true);

  const blocked = [rect(100, 100, 80, 40), rect(100, 160, 80, 40)];
  const fallback = findFirstNonOverlappingRect(
    [rect(100, 110, 80, 40), rect(100, 210, 80, 40)],
    blocked,
    4
  );
  assert.deepEqual(fallback, rect(100, 210, 80, 40), 'solver must use the next free candidate');

  const preset5Blocked = [
    rect(260, 470, 220, 40), // quality badges above the logo
    rect(220, 540, 260, 96), // logo clean overlay
    rect(16, 24, 150, 44), // ranking at top-left
    rect(185, 24, 270, 44), // top ratings at top-right
    rect(180, 650, 300, 44), // bottom ratings
  ];
  const preset5Genre = findFirstNonOverlappingRect(
    [rect(16, 470, 190, 44), rect(16, 410, 190, 44), rect(16, 360, 190, 44)],
    preset5Blocked
  );
  assert.deepEqual(preset5Genre, rect(16, 470, 190, 44), 'preset 5 genre must use the free left slot');

  console.log('overlay collision tests: ok');
};

run();
