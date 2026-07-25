import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutLocalSky, labelAnchor, labelBox } from './localsky.ts';

const neighbors = [
  { slug: 'a', title: 'A', journal: false },
  { slug: 'b', title: 'B', journal: true },
  { slug: 'c', title: 'C', journal: false },
];

test('center node sits at the middle', () => {
  const l = layoutLocalSky(neighbors, 700, 120);
  assert.equal(l.center.x, 350); assert.equal(l.center.y, 60);
});

test('every neighbor lands inside the box with a margin', () => {
  const l = layoutLocalSky(neighbors, 700, 120);
  for (const n of l.nodes) {
    assert.ok(n.x >= 40 && n.x <= 660, `x in range: ${n.x}`);
    assert.ok(n.y >= 14 && n.y <= 106, `y in range: ${n.y}`);
  }
});

test('caps at 12 neighbors', () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ slug: `s${i}`, title: `S${i}`, journal: false }));
  assert.equal(layoutLocalSky(many, 700, 120).nodes.length, 12);
});

// --- labelAnchor: the pure anchor-flip decision, tested in isolation ---

test('labelAnchor: left half prints rightward (start, +6)', () => {
  const a = labelAnchor(100, 700);
  assert.equal(a.anchor, 'start');
  assert.equal(a.dx, 6);
});

test('labelAnchor: right half prints leftward (end, -6)', () => {
  const a = labelAnchor(600, 700);
  assert.equal(a.anchor, 'end');
  assert.equal(a.dx, -6);
});

// --- N=0/1/2 edges ---

test('N=0 returns no nodes', () => {
  const l = layoutLocalSky([], 700, 120);
  assert.equal(l.nodes.length, 0);
});

test('N=1 and N=2 place nodes in-box', () => {
  for (const n of [1, 2]) {
    const many = Array.from({ length: n }, (_, i) => ({ slug: `s${i}`, title: `S${i}`, journal: false }));
    const l = layoutLocalSky(many, 700, 120);
    assert.equal(l.nodes.length, n);
    for (const node of l.nodes) {
      assert.ok(node.x >= 40 && node.x <= 660, `N=${n} x in range: ${node.x}`);
      assert.ok(node.y >= 14 && node.y <= 106, `N=${n} y in range: ${node.y}`);
    }
  }
});

// --- No-overlap under worst-case label length ---
// Regression coverage for the fan-layout defect the review caught: the old
// ellipse fan produced 9+ overlapping label pairs at N=12 because angular
// placement has no relation to label width. This sweeps N=1..12 with every
// title pinned at the 28-char display cap (the actual worst case — real
// vault titles are usually shorter) and asserts every pairwise label
// bounding box (as estimated by the shared `labelBox` helper — the same
// estimate the layout algorithm itself uses to place nodes) is disjoint.
const WORST_CASE_TITLE = 'This Is A Very Long Title!!'; // 27 chars, hits the cap after ellipsis too

function boxesIntersect(a: ReturnType<typeof labelBox>, b: ReturnType<typeof labelBox>): boolean {
  const xOverlap = a.x0 < b.x1 && b.x0 < a.x1;
  const yOverlap = a.y0 < b.y1 && b.y0 < a.y1;
  return xOverlap && yOverlap;
}

for (let n = 1; n <= 12; n++) {
  test(`no overlapping label boxes at N=${n} (worst-case title length)`, () => {
    const many = Array.from({ length: n }, (_, i) => ({ slug: `s${i}`, title: WORST_CASE_TITLE, journal: i % 2 === 0 }));
    const l = layoutLocalSky(many, 700, 120);
    const boxes = l.nodes.map((node) => labelBox(node, 700));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        assert.ok(!boxesIntersect(boxes[i], boxes[j]), `N=${n}: labels ${i} and ${j} overlap`);
      }
    }
  });

  test(`no label box crosses the viewBox edge at N=${n} (worst-case title length)`, () => {
    const many = Array.from({ length: n }, (_, i) => ({ slug: `s${i}`, title: WORST_CASE_TITLE, journal: false }));
    const l = layoutLocalSky(many, 700, 120);
    for (const node of l.nodes) {
      const b = labelBox(node, 700);
      assert.ok(b.x0 >= 0, `N=${n}: label x0 (${b.x0}) crosses left edge`);
      assert.ok(b.x1 <= 700, `N=${n}: label x1 (${b.x1}) crosses right edge`);
    }
  });
}
