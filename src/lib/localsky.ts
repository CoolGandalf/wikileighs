// 1-hop "linked from" constellation for article footers (spec §4).
// Pure layout math; the .astro component renders the SVG at build time.
export interface SkyNeighbor { slug: string; title: string; journal: boolean }
export interface SkyNode extends SkyNeighbor { x: number; y: number }
export interface LocalSkyLayout { center: { x: number; y: number }; nodes: SkyNode[] }

export function layoutLocalSky(neighbors: SkyNeighbor[], width: number, height: number): LocalSkyLayout {
  const capped = neighbors.slice(0, 12);
  const cx = width / 2, cy = height / 2;
  const rx = width / 2 - 60, ry = height / 2 - 16; // margin keeps labels inside
  const nodes = capped.map((n, i) => {
    // Even fan around the ellipse, slight alternation so labels don't collide.
    const angle = (i / Math.max(capped.length, 1)) * Math.PI * 2 + (i % 2 ? 0.35 : 0);
    return { ...n, x: Math.round(cx + Math.cos(angle) * rx * (i % 2 ? 0.95 : 0.7)),
             y: Math.round(cy + Math.sin(angle) * ry * (i % 2 ? 0.9 : 0.65)) };
  });
  return { center: { x: cx, y: cy }, nodes };
}
