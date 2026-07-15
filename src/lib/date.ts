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
