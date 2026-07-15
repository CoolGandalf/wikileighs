import test from 'node:test';
import assert from 'node:assert/strict';
import { newYorkDateLabel, newYorkDateStamp, shiftDateStamp } from './date.ts';

test('New York day does not roll over at UTC midnight', () => {
  const utcWednesday = new Date('2026-07-15T01:04:47Z');
  assert.equal(newYorkDateStamp(utcWednesday), '2026-07-14');
  assert.equal(newYorkDateLabel(utcWednesday), 'Tuesday July 14 2026');
});

test('date-stamp arithmetic crosses month and year boundaries safely', () => {
  assert.equal(shiftDateStamp('2026-07-14', -1), '2026-07-13');
  assert.equal(shiftDateStamp('2026-01-01', -1), '2025-12-31');
  assert.equal(shiftDateStamp('2024-02-28', 1), '2024-02-29');
});
