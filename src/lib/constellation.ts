// Star-position + recency logic for the Constellation homepage (spec §3).
// Pure functions — no filesystem, no globals. Coordinates are viewport
// percentages (0–100) so the canvas and DOM layers share one space.

export interface Cluster { x: number; y: number; rx: number; ry: number }

// Hand-placed cluster centers; misc catches every type not listed.
const CLUSTERS: Record<string, Cluster> = {
  project:      { x: 22, y: 24, rx: 16, ry: 14 },
  concept:      { x: 74, y: 22, rx: 18, ry: 14 },
  person:       { x: 78, y: 62, rx: 14, ry: 12 },
  journal:      { x: 20, y: 72, rx: 16, ry: 13 },
  reference:    { x: 50, y: 82, rx: 16, ry: 10 },
  idea:         { x: 46, y: 14, rx: 12, ry: 8 },
  'voice-memo': { x: 8,  y: 48, rx: 7,  ry: 10 },
  misc:         { x: 55, y: 50, rx: 10, ry: 8 },
};

export function clusterCenter(type: string): Cluster {
  return CLUSTERS[type] ?? CLUSTERS.misc;
}

// Walk the string back-to-front: the varying tail of near-duplicate slugs
// (e.g. daily YYYY-MM-DD notes) then passes through more multiply rounds
// instead of just the last one, which starves forward iteration.
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = s.length - 1; i >= 0; i--) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function starPosition(slug: string, type: string): { x: number; y: number } {
  const c = clusterCenter(type);
  const h = fnv1a(slug);
  // Two independent lanes from one hash; polar spread inside the ellipse.
  const angle = ((h & 0xffff) / 0xffff) * Math.PI * 2;
  const radius = Math.sqrt(((h >>> 16) & 0xffff) / 0xffff); // sqrt → uniform disc
  return {
    x: Math.min(100, Math.max(0, c.x + Math.cos(angle) * radius * c.rx)),
    y: Math.min(100, Math.max(0, c.y + Math.sin(angle) * radius * c.ry)),
  };
}

/**
 * Undirected wikilink edges for the Explorable Sky, as a flat
 * [i0,j0, i1,j1, …] array of index pairs into the caller's array (the same
 * order the homepage uses for its fieldStars payload). A→B and B→A collapse
 * to one pair (emitted with the smaller index first), self-links are dropped,
 * and outbound targets that aren't in the array are ignored. Pure list logic —
 * the link data itself comes from vault.ts's public Article.outbound.
 */
export function buildEdges(items: Array<{ slug: string; outbound: string[] }>): number[] {
  const indexOf = new Map<string, number>();
  items.forEach((it, i) => { if (!indexOf.has(it.slug)) indexOf.set(it.slug, i); });
  const n = items.length;
  const seen = new Set<number>();
  const flat: number[] = [];
  for (let i = 0; i < n; i++) {
    for (const target of items[i].outbound) {
      const j = indexOf.get(target);
      if (j === undefined || j === i) continue;
      const a = Math.min(i, j), b = Math.max(i, j);
      const key = a * n + b;
      if (seen.has(key)) continue;
      seen.add(key);
      flat.push(a, b);
    }
  }
  return flat;
}

const DAY_MS = 86_400_000;

export function isRecent(updated: string | null | undefined, now: Date = new Date()): boolean {
  if (!updated || !/^\d{4}-\d{2}-\d{2}/.test(updated)) return false;
  // Fixed EDT offset is an intentional simplification: the ±1-day buffers make the winter DST hour unobservable. See date.ts for true NY-local conversions.
  const t = new Date(`${updated.slice(0, 10)}T12:00:00-04:00`).getTime();
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  return age >= -DAY_MS && age < 7 * DAY_MS;
}
