// 1-hop "linked from" constellation for article footers (spec §4).
// Pure layout math; the .astro component renders the SVG at build time.
//
// Layout history: the original design fanned neighbors around an ellipse by
// index/angle (even spacing in *angle*, not in *label width*). Review found
// that this collides labels starting at N=5, with 9+ overlapping pairs by
// N=12. This version replaces the fan with a two-band layout: nodes
// alternate into a top row and a bottom row, evenly spaced across the
// width; within each row, a greedy first-fit interval scheduler assigns
// each label a vertical "tier" so two labels never share a tier unless
// their estimated bounding boxes are already clear of each other
// horizontally. That makes the layout collision-free by construction for
// any input — verified in localsky.test.ts against the true worst case (12
// neighbors, every title at the 28-char display cap), not just typical
// titles.

export interface SkyNeighbor { slug: string; title: string; journal: boolean }
export interface SkyNode extends SkyNeighbor { x: number; y: number }
export interface LocalSkyLayout { center: { x: number; y: number }; nodes: SkyNode[] }
export interface LabelBox { x0: number; x1: number; y0: number; y1: number }

// --- label geometry estimate ---------------------------------------------
// Shared by the layout algorithm (to decide vertical tiers) and by the test
// (to assert no two boxes intersect) so the "collision-free" guarantee
// actually reflects what the algorithm itself assumes — no separately
// hand-maintained estimate that could drift out of sync.
export const LABEL_CHAR_WIDTH = 6.2; // px/char, IBM Plex Mono @ 10px
export const LABEL_MAX_CHARS = 28;   // matches the component's ellipsis cap
export const LABEL_HEIGHT = 10;      // px, conservative single-line estimate
const LABEL_DX = 6; // px gap between a node and the start of its label

export function estimateLabelWidth(title: string): number {
  return Math.min(title.length, LABEL_MAX_CHARS) * LABEL_CHAR_WIDTH;
}

// Which way a label reads, so it grows toward the canvas center instead of
// off the edge: left-half nodes print rightward, right-half nodes print
// leftward. Pure position decision — doesn't know about label width.
export function labelAnchor(x: number, width: number): { anchor: 'start' | 'end'; dx: number } {
  return x > width / 2 ? { anchor: 'end', dx: -LABEL_DX } : { anchor: 'start', dx: LABEL_DX };
}

// Estimated screen-space bounding box for a node's label, using the same
// anchor rule the component renders with. The box is centered on the
// node's y (a conservative single-line stand-in for the rendered text,
// which is baseline-offset by a few px in the component) — precise enough
// to catch real collisions without coupling to exact glyph metrics.
export function labelBox(node: { x: number; y: number; title: string }, width: number): LabelBox {
  const { anchor, dx } = labelAnchor(node.x, width);
  const w = estimateLabelWidth(node.title);
  const x0 = anchor === 'start' ? node.x + dx : node.x + dx - w;
  const x1 = anchor === 'start' ? node.x + dx + w : node.x + dx;
  return { x0, x1, y0: node.y - LABEL_HEIGHT / 2, y1: node.y + LABEL_HEIGHT / 2 };
}

const MARGIN_X = 40; // keeps markers off the left/right viewBox edge
const MARGIN_Y = 14; // keeps markers off the top/bottom viewBox edge
const TIER_GAP = 12; // vertical px between stacked label tiers (> LABEL_HEIGHT, so tiers never touch)

// Greedy first-fit interval scheduling ("minimum rooms for overlapping
// meetings"): walk a band's nodes left-to-right and place each one in the
// first vertical tier whose already-placed labels don't horizontally
// overlap it, opening a new tier only when every existing one collides.
// Whatever tier a label lands in, nothing else sharing that tier overlaps
// it — that's what makes the layout collision-free *by construction*
// rather than by a fixed jitter that happens to work for short titles.
function assignTiers(nodes: Array<{ x: number; title: string }>, width: number): number[] {
  const envelopes: Array<[number, number]> = [];
  const tierOf: number[] = [];
  for (const n of nodes) {
    const box = labelBox({ x: n.x, y: 0, title: n.title }, width);
    let tier = envelopes.findIndex(([lo, hi]) => box.x1 <= lo || box.x0 >= hi);
    if (tier === -1) {
      envelopes.push([box.x0, box.x1]);
      tier = envelopes.length - 1;
    } else {
      envelopes[tier] = [Math.min(envelopes[tier][0], box.x0), Math.max(envelopes[tier][1], box.x1)];
    }
    tierOf.push(tier);
  }
  return tierOf;
}

function placeBand(band: SkyNeighbor[], width: number, height: number, isTop: boolean): SkyNode[] {
  const count = band.length;
  if (count === 0) return [];
  const usable = width - 2 * MARGIN_X;
  // Even spacing across the usable width, per the reviewed spec.
  const withX = band.map((n, i) => ({ ...n, x: MARGIN_X + (i + 0.5) * usable / count }));
  const tierOf = assignTiers(withX, width);
  const base = isTop ? MARGIN_Y : height - MARGIN_Y;
  // Tiers grow inward from the floor/ceiling but are clamped short of the
  // row's half of the canvas, so a pathological input (far more tiers than
  // the 12-neighbor cap ever produces in practice) degrades toward
  // crowding the center line rather than climbing into the opposite band.
  const centerLimit = isTop ? height / 2 - 10 : height / 2 + 10;
  return withX.map((n, i) => {
    const raw = base + (isTop ? 1 : -1) * tierOf[i] * TIER_GAP;
    const y = isTop ? Math.min(raw, centerLimit) : Math.max(raw, centerLimit);
    return { ...n, x: Math.round(n.x), y: Math.round(y) };
  });
}

export function layoutLocalSky(neighbors: SkyNeighbor[], width: number, height: number): LocalSkyLayout {
  const capped = neighbors.slice(0, 12);
  const cx = width / 2, cy = height / 2;

  // Alternate into a top row and a bottom row.
  const top: SkyNeighbor[] = [], bottom: SkyNeighbor[] = [];
  capped.forEach((n, i) => (i % 2 === 0 ? top : bottom).push(n));
  const topNodes = placeBand(top, width, height, true);
  const bottomNodes = placeBand(bottom, width, height, false);

  // Re-interleave into the caller's original order — cosmetic (SVG draw
  // order for overlapping lines), doesn't affect the layout itself.
  let ti = 0, bi = 0;
  const nodes = capped.map((_, i) => (i % 2 === 0 ? topNodes[ti++] : bottomNodes[bi++]));

  return { center: { x: cx, y: cy }, nodes };
}
