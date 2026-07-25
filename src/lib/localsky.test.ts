import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutLocalSky } from './localsky.ts';

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
