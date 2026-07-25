export const LEIGH_TIME_ZONE = 'America/New_York';

export function newYorkDateStamp(date: Date): string {
  // en-CA emits YYYY-MM-DD while timeZone prevents UTC build runners from
  // rolling WikiLeighs into tomorrow before Leigh's local midnight.
  return date.toLocaleDateString('en-CA', { timeZone: LEIGH_TIME_ZONE });
}

export function newYorkDateLabel(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LEIGH_TIME_ZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('weekday')} ${value('month')} ${value('day')} ${value('year')}`;
}

export function shiftDateStamp(stamp: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stamp);
  if (!match) throw new Error(`Invalid YYYY-MM-DD date stamp: ${stamp}`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

const WEEKDAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Short weekday name ("Wed") for a YYYY-MM-DD stamp, evaluated in the New
 * York calendar. Anchors at noon with an explicit -04:00 offset — the same
 * pattern today/[date].astro already uses to parse the date route param —
 * so the weekday never rolls to an adjacent day under a UTC build runner.
 */
export function newYorkWeekdayShort(stamp: string): string {
  const parsed = new Date(`${stamp}T12:00:00-04:00`);
  return parsed.toLocaleDateString('en-US', { weekday: 'short', timeZone: LEIGH_TIME_ZONE });
}

/**
 * 0 (Sun) – 6 (Sat) for a YYYY-MM-DD stamp, using the same NY-safe anchoring
 * as newYorkWeekdayShort(). Backs the today/archive calendar's leading-blank
 * cell count so weekday columns line up without raw new Date() UTC parsing.
 */
export function newYorkWeekdayIndex(stamp: string): number {
  return WEEKDAY_SHORT_NAMES.indexOf(newYorkWeekdayShort(stamp));
}

/**
 * Nearest dates before/after a given YYYY-MM-DD stamp within an arbitrary
 * list, skipping gaps (a date that isn't in `dates` — the today-cron has
 * missed a handful of days) rather than assuming ±1 calendar day, which
 * would 404 into an un-generated page. Pure — takes `dates` as a parameter
 * instead of reading listTodayPageDates() itself, so this module stays
 * vault-independent; input order doesn't matter, it just scans for the max
 * date below stamp and the min date above it. Contract: `prev`/`next` are
 * null when stamp is at or beyond the open end of the list (e.g. `next` is
 * always null for the most recent date, since nothing later exists yet).
 * Backs the prev/next nav ribbon on /today and /today/[date].
 */
export function getAdjacentTodayDates(dates: string[], stamp: string): { prev: string | null; next: string | null } {
  let prev: string | null = null;
  let next: string | null = null;
  for (const d of dates) {
    if (d < stamp) {
      if (prev === null || d > prev) prev = d;
    } else if (d > stamp) {
      if (next === null || d < next) next = d;
    }
  }
  return { prev, next };
}
