import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starPosition, isRecent, clusterCenter } from './constellation.ts';

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
});

test('isRecent: 7-day window on YYYY-MM-DD frontmatter dates', () => {
  const now = new Date('2026-07-24T12:00:00-04:00');
  assert.equal(isRecent('2026-07-24', now), true);
  assert.equal(isRecent('2026-07-18', now), true);
  assert.equal(isRecent('2026-07-16', now), false);
  assert.equal(isRecent(undefined, now), false);
  assert.equal(isRecent('garbage', now), false);
});
