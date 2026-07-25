import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starPosition, isRecent, clusterCenter, buildEdges } from './constellation.ts';

test('starPosition is deterministic for a slug', () => {
  const a = starPosition('stoic-philosophy', 'concept');
  const b = starPosition('stoic-philosophy', 'concept');
  assert.deepEqual(a, b);
});

test('starPosition stays inside its cluster box', () => {
  const { x, y } = starPosition('anything-at-all', 'project');
  const c = clusterCenter('project');
  assert.ok(Math.abs(x - c.x) <= c.rx, 'x within cluster radius');
  assert.ok(Math.abs(y - c.y) <= c.ry, 'y within cluster radius');
});

test('unknown types fall into the misc cluster, never crash', () => {
  const p = starPosition('weird', 'no-such-type');
  assert.ok(p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100);
  assert.deepEqual(clusterCenter('no-such-type'), clusterCenter('misc'));
});

test('buildEdges: dedupes A→B/B→A, drops self-links and unresolved targets', () => {
  const items = [
    { slug: 'a', outbound: ['b', 'a', 'ghost'] },   // self-link + unresolved dropped
    { slug: 'b', outbound: ['a', 'c'] },            // b→a collapses into a→b
    { slug: 'c', outbound: [] },
  ];
  assert.deepEqual(buildEdges(items), [0, 1, 1, 2]);
});

test('buildEdges: flat pairs, smaller index first, valid indices', () => {
  const items = [
    { slug: 'x', outbound: [] },
    { slug: 'y', outbound: ['z', 'x'] },
    { slug: 'z', outbound: ['y', 'y', 'x'] },       // repeat y→z direction + dup drop
  ];
  const flat = buildEdges(items);
  assert.equal(flat.length % 2, 0);
  for (let k = 0; k < flat.length; k += 2) {
    assert.ok(flat[k] < flat[k + 1], 'smaller index first');
    assert.ok(flat[k] >= 0 && flat[k + 1] < items.length, 'indices in range');
  }
  assert.deepEqual(flat, [1, 2, 0, 1, 0, 2]);
});

test('buildEdges: empty and link-free inputs produce no edges', () => {
  assert.deepEqual(buildEdges([]), []);
  assert.deepEqual(buildEdges([{ slug: 'solo', outbound: ['solo'] }]), []);
});

test('isRecent: 7-day window on YYYY-MM-DD frontmatter dates', () => {
  const now = new Date('2026-07-24T12:00:00-04:00');
  assert.equal(isRecent('2026-07-24', now), true);
  assert.equal(isRecent('2026-07-18', now), true);
  assert.equal(isRecent('2026-07-16', now), false);
  assert.equal(isRecent(undefined, now), false);
  assert.equal(isRecent('garbage', now), false);
  assert.equal(isRecent('2026-07-17', now), false);
  assert.equal(isRecent('2026-07-25', now), true);
});
