import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newYorkDateLabel,
  newYorkDateStamp,
  shiftDateStamp,
  newYorkWeekdayIndex,
  newYorkWeekdayShort,
  getAdjacentTodayDates,
} from './date.ts';

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

test('newYorkWeekdayIndex matches the real calendar', () => {
  // 2026-07-01 is a Wednesday — index 3 (0 = Sun) — the calendar-archive
  // spot-check called for in the Task 9 review.
  assert.equal(newYorkWeekdayIndex('2026-07-01'), 3);
  // Month boundary: 2026-01-31 (Sat) -> 2026-02-01 (Sun) crosses both a
  // month and the array wrap from index 6 back to 0.
  assert.equal(newYorkWeekdayIndex('2026-01-31'), 6);
  assert.equal(newYorkWeekdayIndex('2026-02-01'), 0);
});

test('newYorkWeekdayShort returns the three-letter name', () => {
  assert.equal(newYorkWeekdayShort('2026-07-01'), 'Wed');
});

test('getAdjacentTodayDates finds the nearest neighbors in an unsorted list', () => {
  // Genuinely shuffled (not ascending or descending) so the result can only
  // be right if the function does not assume pre-sorted input.
  const dates = ['2026-07-22', '2026-07-20', '2026-07-24', '2026-07-21', '2026-07-23'];
  assert.deepEqual(getAdjacentTodayDates(dates, '2026-07-22'), { prev: '2026-07-21', next: '2026-07-23' });
});

test('getAdjacentTodayDates skips a gap day that has no page', () => {
  // 2026-06-13 is missing (mirrors a real today-cron gap) — prev from the
  // 14th must land on the 12th, not 404 into the nonexistent 13th.
  const dates = ['2026-06-16', '2026-06-14', '2026-06-12'];
  assert.deepEqual(getAdjacentTodayDates(dates, '2026-06-14'), { prev: '2026-06-12', next: '2026-06-16' });
});

test('getAdjacentTodayDates returns null on the open end of the list', () => {
  const dates = ['2026-07-24', '2026-07-23', '2026-07-22'];
  // Newest date in the list: nothing after it yet (mirrors /today, where
  // "next" is always unwritten).
  assert.deepEqual(getAdjacentTodayDates(dates, '2026-07-24'), { prev: '2026-07-23', next: null });
  // Oldest date in the list: nothing before it.
  assert.deepEqual(getAdjacentTodayDates(dates, '2026-07-22'), { prev: null, next: '2026-07-23' });
  // A stamp newer than everything in the list (e.g. /today before the
  // cron has generated today's page): prev is the most recent page, next
  // stays null.
  assert.deepEqual(getAdjacentTodayDates(dates, '2026-07-25'), { prev: '2026-07-24', next: null });
});
