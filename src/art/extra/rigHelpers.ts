// Small geometry helpers copied from Dog.tsx so new clothing fits every dog build
// without touching the large drawing file.
import type { Rig } from '../Dog';
import { INK } from '../color';

type Pt = [number, number];

/** half-width of the body at height y */
export function hw(r: Rig, y: number): number {
  const t = Math.min(1, Math.max(0, (y - r.bodyTop) / (r.bottom - 26 - r.bodyTop)));
  return r.tw + (r.bw - r.tw) * Math.sin((t * Math.PI) / 2);
}

/** Closed smooth path through points (Catmull-Rom → cubic Bézier). */
export function smooth(points: Pt[]): string {
  const n = points.length;
  const p = (i: number) => points[(i + n) % n];
  let d = `M${p(0)[0].toFixed(1)},${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

/** Garment covering the torso between y0 and y1. */
export function torso(r: Rig, y0: number, y1: number, pad = 4, neckDip = 10): string {
  const steps = 4;
  const left: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = y0 + ((y1 - y0) * i) / steps;
    left.push([r.cx - hw(r, y) - pad, y]);
  }
  const right = left.map(([x, y]) => [2 * r.cx - x, y] as Pt).reverse();
  return smooth([[r.cx, y0 + neckDip], ...left, [r.cx, y1 + 5], ...right]);
}

export function star4(x: number, y: number, s: number): string {
  return `M${x},${y - s} Q${x + s * 0.2},${y - s * 0.2} ${x + s},${y} Q${x + s * 0.2},${y + s * 0.2} ${x},${y + s} Q${x - s * 0.2},${y + s * 0.2} ${x - s},${y} Q${x - s * 0.2},${y - s * 0.2} ${x},${y - s}Z`;
}

export function heart(x: number, y: number, s: number): string {
  return `M${x},${y + s * 0.9} C${x - s * 1.4},${y - s * 0.1} ${x - s * 0.7},${y - s * 1.2} ${x},${y - s * 0.4} C${x + s * 0.7},${y - s * 1.2} ${x + s * 1.4},${y - s * 0.1} ${x},${y + s * 0.9}Z`;
}

/** Outline used by dog clothing. */
export const OUT = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
/** Outline used by furniture. */
export const FO = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Where props are held (viewer's left of the dog), same as Dog.tsx. */
export function hand(r: Rig): { hx: number; hy: number } {
  return { hx: r.cx - r.bw - 14, hy: r.bottom - 34 };
}
