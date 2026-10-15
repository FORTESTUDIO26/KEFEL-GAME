// Original SVG people (front-facing, cute big-head proportions) with recolourable clothing layers.
// Room units, drawn around (0,0) growing upwards like furniture:
//   stand / wave: (0,0) is between the feet on the floor;
//   sit: (0,0) is the bottom of the hips (seat contact); lower legs hang down to HUMAN_SEAT_DROP.
// Internally everything is drawn in a "body frame" whose origin is the seat point; standing just
// lifts that frame by the leg length, so every clothing layer stays attached in every pose.

import { useId, type ReactNode } from 'react';
import { humanWearableById, type HumanDef, type HumanOutfit, type HumanSlot } from '../content/humans';
import { INK, shade } from './color';
import './Humans.css';

export type HumanPose = 'stand' | 'sit' | 'wave';

/** How far below the seat contact point the feet reach when sitting (≈ sofa seat height). */
export const HUMAN_SEAT_DROP = 68;

type Pt = [number, number];

interface HRig {
  /** head radius */
  R: number;
  /** head centre y */
  hc: number;
  /** top of the hair (most negative y) */
  top: number;
  /** shoulder line y */
  sy: number;
  /** half shoulder width */
  sw: number;
  /** half hip width */
  hw: number;
  /** x of each leg */
  lg: number;
  legW: number;
  armW: number;
  armLen: number;
  legLen: number;
  /** top of the waistband */
  waist: number;
}

function rigFor(h: HumanDef): HRig {
  if (h.age === 'child') {
    return { R: 40, hc: -110, top: -154, sy: -66, sw: h.female ? 24 : 25, hw: 21, lg: 10, legW: 15, armW: 12, armLen: 64, legLen: 86, waist: -18 };
  }
  return { R: 42, hc: -135, top: -181, sy: -90, sw: h.female ? 29 : 33, hw: h.female ? 26 : 25, lg: 12, legW: 17, armW: 13, armLen: 88, legLen: 124, waist: -22 };
}

/** Standing bounding box in room units (width includes hair and arms). */
export function humanSize(human: HumanDef): { w: number; h: number } {
  const r = rigFor(human);
  return { w: Math.round(2 * (r.R + 22)), h: r.legLen - r.top };
}

const OUT = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const BASE_TOP = '#f7f2ea';
const BASE_BOTTOM = '#cfc6e0';

const f = (n: number) => n.toFixed(1);

/** Closed smooth path through points (Catmull-Rom → cubic Bézier). */
function smooth(points: Pt[]): string {
  const n = points.length;
  const p = (i: number) => points[(i + n) % n];
  let d = `M${f(p(0)[0])},${f(p(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + 'Z';
}

function line(pts: Pt[]): string {
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)},${f(y)}`).join(' ');
}

/** The first `t` (0..1) of a polyline, by length. */
function partial(pts: Pt[], t: number): Pt[] {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let left = seg.reduce((a, b) => a + b, 0) * t;
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) {
      out.push(pts[i + 1]);
      left -= seg[i];
    } else {
      const k = left / seg[i];
      out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]);
      break;
    }
  }
  return out;
}

/** A thick outlined tube (arms, legs, sleeves, trouser legs). */
function Tube({ pts, w, fill, outline = 2.2 }: { pts: Pt[]; w: number; fill: string; outline?: number }) {
  const d = line(pts);
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + outline * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function star4(x: number, y: number, s: number): string {
  return `M${x},${y - s} Q${x + s * 0.2},${y - s * 0.2} ${x + s},${y} Q${x + s * 0.2},${y + s * 0.2} ${x},${y + s} Q${x - s * 0.2},${y + s * 0.2} ${x - s},${y} Q${x - s * 0.2},${y - s * 0.2} ${x},${y - s}Z`;
}

/** Torso garment from the shoulders down to y1. */
function torsoPath(r: HRig, y1: number, pad = 2, flare = 0, neckDip = 9): string {
  const mid = (r.sy + y1) / 2;
  const left: Pt[] = [
    [-r.sw + 9, r.sy - 1],
    [-r.sw - pad, r.sy + 10],
    [-(r.sw * 0.4 + r.hw * 0.6) - pad - flare * 0.3, mid],
    [-r.hw - pad - flare, y1 - 3],
    [-(r.hw + pad + flare) * 0.5, y1 + 1],
  ];
  const right = left.map(([x, y]) => [-x, y] as Pt).reverse();
  return smooth([[0, r.sy + neckDip], ...left, [0, y1 + 2], ...right]);
}

// ---------------- geometry per pose ----------------

interface Limbs {
  sit: boolean;
  /** foot sole y (body frame) */
  foot: number;
  legs: Pt[][];
  arms: Pt[][];
  /** index of the waving arm, or -1 */
  wave: number;
}

function limbsFor(r: HRig, pose: HumanPose): Limbs {
  const sit = pose === 'sit';
  const foot = sit ? HUMAN_SEAT_DROP : r.legLen;
  const legs = [-1, 1].map((s): Pt[] => (sit ? [[s * (r.lg + 1), 8], [s * (r.lg + 1), foot - 9]] : [[s * r.lg, -4], [s * r.lg, foot - 9]]));
  const arms = [-1, 1].map((s): Pt[] => {
    const S: Pt = [s * (r.sw - 5), r.sy + 9];
    if (pose === 'wave' && s === 1) return [S, [r.sw + 18, r.sy + 4], [r.sw + 26, r.sy - r.armLen * 0.5]];
    if (sit) return [S, [s * (r.sw + 5), r.sy + r.armLen * 0.5], [s * (r.hw - 4), r.sy + r.armLen * 0.92]];
    return [S, [s * (r.sw + 4), r.sy + r.armLen * 0.5], [s * (r.sw + 5), r.sy + r.armLen]];
  });
  return { sit, foot, legs, arms, wave: pose === 'wave' ? 1 : -1 };
}

// ---------------- body parts ----------------

function Legs({ h, r, L }: { h: HumanDef; r: HRig; L: Limbs }) {
  return (
    <g className="human-legs">
      {L.legs.map((pts, i) => (
        <Tube key={i} pts={pts} w={r.legW} fill={h.skin} />
      ))}
      {L.sit && <rect x={-r.hw - 3} y={-12} width={2 * r.hw + 6} height={24} rx={12} fill={h.skin} {...OUT} />}
      {L.legs.map((pts, i) => {
        const s = i ? 1 : -1;
        return <ellipse key={i} cx={pts[0][0] + s * 3} cy={L.foot - 5} rx={r.legW * 0.68} ry={6} fill={h.skin} {...OUT} />;
      })}
    </g>
  );
}

function Shoes({ id, c, r, L }: { id: string; c: string; r: HRig; L: Limbs }) {
  const dark = shade(c, -0.25);
  return (
    <g data-slot="shoes" data-item={id}>
      {L.legs.map((pts, i) => {
        const s = i ? 1 : -1;
        const x = pts[0][0] + s * 3;
        const y = L.foot;
        const rx = r.legW * 0.78;
        switch (id) {
          case 'shoes_boots':
            return (
              <g key={i}>
                <rect x={pts[0][0] - r.legW / 2 - 3} y={y - 26} width={r.legW + 6} height={20} rx={5} fill={c} {...OUT} />
                <ellipse cx={x} cy={y - 6} rx={rx + 1} ry={7} fill={c} {...OUT} />
                <path d={`M${x - rx},${y - 2} h${2 * rx}`} stroke={dark} strokeWidth={3} strokeLinecap="round" />
                <path d={`M${pts[0][0] - r.legW / 2 - 2},${y - 22} h${r.legW + 4}`} stroke={shade(c, 0.35)} strokeWidth={3} strokeLinecap="round" />
              </g>
            );
          case 'shoes_flats':
            return (
              <g key={i}>
                <path d={`M${x - rx},${y - 6} Q${x - rx},${y - 12} ${x - rx * 0.3},${y - 11} L${x + rx * 0.3},${y - 11} Q${x + rx},${y - 12} ${x + rx},${y - 6} Q${x + rx},${y} ${x},${y} Q${x - rx},${y} ${x - rx},${y - 6}Z`} fill={c} {...OUT} />
                <circle cx={x} cy={y - 10} r={2.6} fill={shade(c, 0.5)} stroke={INK} strokeWidth={1.2} />
              </g>
            );
          case 'shoes_clogs':
            return (
              <g key={i}>
                <ellipse cx={x} cy={y - 7} rx={rx + 2} ry={8.5} fill={c} {...OUT} />
                <path d={`M${x - rx - 1},${y - 2} h${2 * rx + 2}`} stroke={dark} strokeWidth={3} strokeLinecap="round" />
                {[-0.4, 0, 0.4].map((k) => (
                  <circle key={k} cx={x + k * rx} cy={y - 9} r={1.6} fill={dark} />
                ))}
              </g>
            );
          default: // sneakers
            return (
              <g key={i}>
                <path d={`M${x - rx},${y - 5} Q${x - rx},${y - 14} ${x},${y - 14} Q${x + rx},${y - 14} ${x + rx},${y - 5}Z`} fill={c} {...OUT} />
                <rect x={x - rx - 1} y={y - 6} width={2 * rx + 2} height={6} rx={3} fill="#fff" {...OUT} strokeWidth={1.8} />
                <path d={`M${x - 3},${y - 12} l6,0 M${x - 3},${y - 9} l6,0`} stroke={shade(c, 0.6)} strokeWidth={1.6} strokeLinecap="round" />
              </g>
            );
        }
      })}
    </g>
  );
}

function Bottom({ id, c, r, L, base }: { id: string; c: string; r: HRig; L: Limbs; base?: boolean }) {
  const dark = shade(c, -0.18);
  const light = shade(c, 0.35);
  const hip = <rect x={-r.hw - 2} y={r.waist} width={2 * r.hw + 4} height={-r.waist + 9} rx={9} fill={c} {...OUT} />;
  const lap = L.sit ? <rect x={-r.hw - 4} y={-13} width={2 * r.hw + 8} height={26} rx={13} fill={c} {...OUT} /> : null;
  const legsTo = (end: number, w: number) => L.legs.map((pts, i) => <Tube key={i} pts={[pts[0], [pts[1][0], end]]} w={w} fill={c} />);
  const tag = { 'data-slot': base ? undefined : 'bottom', 'data-item': base ? undefined : id };
  switch (id) {
    case 'bottom_jeans':
    case 'bottom_leggings': {
      const jeans = id === 'bottom_jeans';
      const end = L.foot - (jeans ? 13 : 11);
      return (
        <g {...tag}>
          {legsTo(end, r.legW + (jeans ? 6 : 3))}
          {hip}
          {lap}
          {jeans && (
            <g stroke={dark} strokeWidth={1.6} strokeLinecap="round" fill="none">
              {L.legs.map((pts, i) => (
                <path key={i} d={`M${pts[0][0] - r.legW / 2 - 1},${end - 3} h${r.legW + 2}`} />
              ))}
              <path d={`M0,${r.waist + 2} v${-r.waist + 4}`} />
              <path d={`M${-r.hw + 2},${r.waist + 6} q6,6 12,0 M${r.hw - 2},${r.waist + 6} q-6,6 -12,0`} />
            </g>
          )}
          <path d={`M${-r.hw - 1},${r.waist + 4} h${2 * r.hw + 2}`} stroke={light} strokeWidth={2.4} strokeLinecap="round" />
        </g>
      );
    }
    case 'bottom_skirt':
    case 'bottom_tutu': {
      const tutu = id === 'bottom_tutu';
      const hem = L.sit ? (tutu ? 17 : 21) : r.legLen * (tutu ? 0.33 : 0.42);
      const wide = r.hw + (tutu ? 24 : 13) - (L.sit ? 4 : 0);
      const top = r.waist + 1;
      if (tutu) {
        const n = 7;
        const scallops = (w: number, y: number) =>
          `M${-r.hw - 1},${top} L${-w},${y - 4} ` +
          Array.from({ length: n }, (_, i) => `Q${f(-w + (2 * w * (i + 0.5)) / n)},${f(y + 7)} ${f(-w + (2 * w * (i + 1)) / n)},${f(y - 4)}`).join(' ') +
          ` L${r.hw + 1},${top} Z`;
        return (
          <g {...tag}>
            <path d={scallops(wide, hem)} fill={light} {...OUT} />
            <path d={scallops(wide - 7, hem - 8)} fill={c} {...OUT} />
            <rect x={-r.hw - 2} y={top - 2} width={2 * r.hw + 4} height={8} rx={4} fill={dark} {...OUT} />
            {[-0.5, 0.1, 0.6].map((k) => (
              <path key={k} d={star4(k * wide, hem - 16, 3)} fill="#fff" />
            ))}
          </g>
        );
      }
      return (
        <g {...tag}>
          <path d={`M${-r.hw - 1},${top} L${-wide},${hem - 6} Q${-wide},${hem + 2} ${-wide + 8},${hem + 2} L${wide - 8},${hem + 2} Q${wide},${hem + 2} ${wide},${hem - 6} L${r.hw + 1},${top} Z`} fill={c} {...OUT} />
          <path d={`M${-r.hw * 0.4},${top + 8} L${-wide * 0.5},${hem - 2} M${r.hw * 0.4},${top + 8} L${wide * 0.5},${hem - 2}`} stroke={dark} strokeWidth={1.6} strokeLinecap="round" />
          <path d={`M${-wide + 6},${hem - 4} H${wide - 6}`} stroke={light} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1 6" />
        </g>
      );
    }
    default: {
      // shorts (also the plain base layer)
      return (
        <g {...tag}>
          {!L.sit && legsTo(r.legLen * 0.3, r.legW + 6)}
          {hip}
          {lap}
          {!base && <path d={`M${-r.hw - 1},${r.waist + 4} h${2 * r.hw + 2}`} stroke={light} strokeWidth={2.4} strokeLinecap="round" />}
          {!base && !L.sit && <path d={`M0,${r.waist + 3} v${-r.waist + 3}`} stroke={dark} strokeWidth={1.6} strokeLinecap="round" />}
        </g>
      );
    }
  }
}

/** sleeve coverage of the arm (0..1) per top */
const SLEEVE: Record<string, number> = {
  top_tshirt: 0.38,
  top_polo: 0.38,
  top_blouse: 0.44,
  top_dress: 0.26,
  top_leotard: 0.9,
  top_hoodie: 0.9,
  top_cardigan: 0.9,
};

function topEnd(id: string, r: HRig, L: Limbs): number {
  if (id === 'top_dress') return L.sit ? 18 : r.legLen * 0.36;
  if (id === 'top_leotard') return 3;
  if (id === 'top_hoodie' || id === 'top_cardigan') return L.sit ? 0 : 4;
  return r.legLen > 100 ? -6 : -4;
}

function Top({ id, c, r, L, base }: { id: string; c: string; r: HRig; L: Limbs; base?: boolean }) {
  const dark = shade(c, -0.2);
  const light = shade(c, 0.4);
  const y1 = topEnd(id, r, L);
  const tag = { 'data-slot': base ? undefined : 'top', 'data-item': base ? undefined : id };
  const flare = id === 'top_dress' ? (L.sit ? 10 : 16) : id === 'top_hoodie' || id === 'top_cardigan' ? 2 : 0;
  const pad = id === 'top_leotard' ? 1 : 2.5;
  const body = <path d={torsoPath(r, y1, pad, flare, id === 'top_cardigan' ? 14 : 9)} fill={c} {...OUT} />;
  const neck = <path d={`M${-r.R * 0.26},${r.sy} Q0,${r.sy + 11} ${r.R * 0.26},${r.sy}`} fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" />;
  let extra: ReactNode = null;
  switch (id) {
    case 'top_hoodie':
      extra = (
        <>
          <rect x={-r.hw + 4} y={y1 - 26} width={2 * r.hw - 8} height={16} rx={7} fill={dark} {...OUT} strokeWidth={1.8} />
          <path d={`M-5,${r.sy + 6} l-1,16 M5,${r.sy + 6} l1,16`} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          <circle cx={-6} cy={r.sy + 23} r={2} fill="#fff" />
          <circle cx={6} cy={r.sy + 23} r={2} fill="#fff" />
        </>
      );
      break;
    case 'top_blouse':
      extra = (
        <g fill={light} {...OUT} strokeWidth={1.8}>
          {[-2, -1, 0, 1, 2].map((k) => (
            <circle key={k} cx={k * r.R * 0.15} cy={r.sy + 3 + Math.abs(k) * -1.5 + (k === 0 ? 4 : 0)} r={5} />
          ))}
          <path d={`M0,${r.sy + 14} v${(y1 - r.sy) * 0.6}`} fill="none" stroke={dark} strokeWidth={1.4} strokeDasharray="1 7" />
        </g>
      );
      break;
    case 'top_dress':
      extra = (
        <>
          <path d={`M${-r.hw - 1},${r.waist + 2} Q0,${r.waist + 7} ${r.hw + 1},${r.waist + 2}`} fill="none" stroke={light} strokeWidth={5} strokeLinecap="round" />
          <circle cx={r.hw - 4} cy={r.waist + 3} r={4} fill={light} {...OUT} strokeWidth={1.6} />
          {neck}
          {[[-0.5, 0.45], [0.3, 0.7], [-0.15, 0.85]].map(([kx, ky], i) => (
            <circle key={i} cx={kx * (r.hw + flare)} cy={r.waist + (y1 - r.waist) * ky} r={2.6} fill="#fff" opacity={0.85} />
          ))}
        </>
      );
      break;
    case 'top_leotard':
      extra = (
        <>
          {neck}
          <path d={`M${-r.hw},${y1 - 2} Q0,${y1 - 12} ${r.hw},${y1 - 2}`} fill="none" stroke={dark} strokeWidth={1.8} strokeLinecap="round" />
          {[[-0.45, 0.3, 4], [0.4, 0.45, 3.2], [-0.1, 0.62, 2.8], [0.3, 0.15, 2.4]].map(([kx, ky, s], i) => (
            <path key={i} d={star4(kx * r.sw, r.sy + (y1 - r.sy) * ky, s)} fill="#fff" opacity={0.9} />
          ))}
        </>
      );
      break;
    case 'top_polo':
      extra = (
        <>
          <path d={`M-1,${r.sy + 1} L${-r.R * 0.32},${r.sy - 1} L${-r.R * 0.2},${r.sy + 10} Z M1,${r.sy + 1} L${r.R * 0.32},${r.sy - 1} L${r.R * 0.2},${r.sy + 10} Z`} fill={light} {...OUT} strokeWidth={1.8} />
          <circle cx={0} cy={r.sy + 12} r={1.8} fill={dark} />
          <circle cx={0} cy={r.sy + 19} r={1.8} fill={dark} />
        </>
      );
      break;
    case 'top_cardigan':
      extra = (
        <>
          <path d={`M${-r.R * 0.24},${r.sy} L0,${r.sy + 20} L${r.R * 0.24},${r.sy} Z`} fill="#fff8ef" />
          <path d={`M0,${r.sy + 20} V${y1 + 1}`} stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          {[0.3, 0.55, 0.8].map((k) => (
            <circle key={k} cx={4} cy={r.sy + 20 + (y1 - r.sy - 20) * k} r={2.2} fill={light} stroke={INK} strokeWidth={1.2} />
          ))}
          <rect x={-r.hw + 2} y={y1 - 22} width={12} height={11} rx={3} fill={dark} {...OUT} strokeWidth={1.6} />
          <rect x={r.hw - 14} y={y1 - 22} width={12} height={11} rx={3} fill={dark} {...OUT} strokeWidth={1.6} />
        </>
      );
      break;
    default: // t-shirt (and plain base)
      extra = (
        <>
          {neck}
          {!base && <path d={star4(r.sw * 0.3, r.sy + (y1 - r.sy) * 0.42, 5)} fill={light} stroke={INK} strokeWidth={1.2} />}
        </>
      );
  }
  return (
    <g {...tag}>
      {id === 'top_hoodie' && <ellipse cx={0} cy={r.sy + 1} rx={r.R * 0.62} ry={9} fill={dark} {...OUT} />}
      {body}
      {extra}
    </g>
  );
}

function Sleeves({ id, c, r, L }: { id: string; c: string; r: HRig; L: Limbs }) {
  const t = SLEEVE[id] ?? 0.38;
  const puff = id === 'top_blouse';
  return (
    <g>
      {L.arms.map((pts, i) => {
        const part = partial(pts, t);
        const end = part[part.length - 1];
        return (
          <g key={i}>
            <Tube pts={part} w={r.armW + (puff ? 6 : 2.5)} fill={c} />
            {t > 0.8 && <circle cx={end[0]} cy={end[1]} r={(r.armW + 2.5) / 2} fill={shade(c, -0.15)} {...OUT} strokeWidth={1.6} />}
          </g>
        );
      })}
    </g>
  );
}

function ArmSkin({ pts, h, r }: { pts: Pt[]; h: HumanDef; r: HRig }) {
  const hand = pts[pts.length - 1];
  return (
    <g>
      <Tube pts={pts} w={r.armW} fill={h.skin} />
      <circle cx={hand[0]} cy={hand[1]} r={r.armW * 0.62} fill={h.skin} {...OUT} />
    </g>
  );
}

// ---------------- head, face & hair ----------------

function HairBack({ h, r }: { h: HumanDef; r: HRig }) {
  const { R, hc } = r;
  const c = h.hairColor;
  switch (h.hairStyle) {
    case 'ponytail':
      return (
        <path
          d={`M${R * 0.3},${hc - R * 0.92} C${R * 1.55},${hc - R * 1.15} ${R * 1.7},${hc + R * 0.3} ${R * 1.12},${hc + R * 1.05} C${R * 1.28},${hc + R * 0.3} ${R * 1.02},${hc - R * 0.3} ${R * 0.5},${hc - R * 0.5} Z`}
          fill={c}
          {...OUT}
        />
      );
    case 'puffs':
      return (
        <g>
          {[-1, 1].map((s) => {
            const cx = s * R * 0.9;
            const cy = hc - R * 0.78;
            const pr = R * 0.44;
            return (
              <g key={s}>
                {Array.from({ length: 9 }, (_, i) => {
                  const a = (i / 9) * Math.PI * 2;
                  return <circle key={i} cx={cx + Math.cos(a) * pr * 0.62} cy={cy + Math.sin(a) * pr * 0.62} r={pr * 0.46} fill={c} {...OUT} strokeWidth={1.8} />;
                })}
                <circle cx={cx} cy={cy} r={pr * 0.74} fill={c} />
              </g>
            );
          })}
        </g>
      );
    case 'bun':
      return (
        <g>
          <circle cx={0} cy={hc - R * 1.06} r={R * 0.38} fill={c} {...OUT} />
          <path d={`M${-R * 0.16},${hc - R * 1.1} q${R * 0.16},${-R * 0.18} ${R * 0.3},0`} fill="none" stroke={shade(c, 0.3)} strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

/** Long braids drawn over the shoulders (in front of the body, behind the head). */
function HairMid({ h, r }: { h: HumanDef; r: HRig }) {
  if (h.hairStyle !== 'braids') return null;
  const { R, hc } = r;
  const c = h.hairColor;
  return (
    <g>
      {[-1, 1].map((s) => (
        <g key={s}>
          {[0, 1, 2, 3, 4].map((k) => (
            <ellipse key={k} cx={s * R * 0.9} cy={hc + R * 0.2 + k * R * 0.32} rx={R * 0.19} ry={R * 0.21} fill={c} {...OUT} strokeWidth={1.9} />
          ))}
          <path d={`M${s * R * 0.9},${hc + R * 1.62} l${-R * 0.1},${R * 0.24} M${s * R * 0.9},${hc + R * 1.62} l${R * 0.1},${R * 0.24}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d={`M${s * R * 0.9},${hc + R * 1.62} l${-R * 0.1},${R * 0.24} M${s * R * 0.9},${hc + R * 1.62} l${R * 0.1},${R * 0.24}`} stroke={c} strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={s * R * 0.9} cy={hc + R * 1.55} r={R * 0.09} fill={shade(c, -0.3)} stroke={INK} strokeWidth={1.4} />
        </g>
      ))}
    </g>
  );
}

function HairFront({ h, r }: { h: HumanDef; r: HRig }) {
  const { R, hc } = r;
  const c = h.hairColor;
  const sides = `M${-R - 3},${hc + R * 0.15} C${-R - 5},${hc - R * 1.42} ${R + 5},${hc - R * 1.42} ${R + 3},${hc + R * 0.15}`;
  let fringe: string;
  switch (h.hairStyle) {
    case 'grandpa':
      return (
        <g>
          {[-1, 1].map((s) => (
            <ellipse key={s} cx={s * R * 0.93} cy={hc - R * 0.12} rx={R * 0.2} ry={R * 0.34} fill={c} {...OUT} />
          ))}
          <path d={`M${-R * 0.5},${hc - R * 0.72} q${R * 0.2},${-R * 0.12} ${R * 0.4},${-R * 0.05}`} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
          <path d={`M${-R * 0.26},${hc + R * 0.43} Q${-R * 0.12},${hc + R * 0.3} 0,${hc + R * 0.4} Q${R * 0.12},${hc + R * 0.3} ${R * 0.26},${hc + R * 0.43} Q${R * 0.1},${hc + R * 0.5} 0,${hc + R * 0.44} Q${-R * 0.1},${hc + R * 0.5} ${-R * 0.26},${hc + R * 0.43}Z`} fill={c} {...OUT} strokeWidth={1.6} />
        </g>
      );
    case 'short':
      fringe = ` L${R * 0.72},${hc - R * 0.42} L${R * 0.42},${hc - R * 0.6} L${R * 0.14},${hc - R * 0.42} L${-R * 0.16},${hc - R * 0.62} L${-R * 0.46},${hc - R * 0.44} L${-R * 0.76},${hc - R * 0.56} Z`;
      break;
    case 'braids':
      fringe = ` C${R * 0.8},${hc - R * 0.3} ${R * 0.3},${hc - R * 0.72} 0,${hc - R * 0.74} C${-R * 0.3},${hc - R * 0.72} ${-R * 0.8},${hc - R * 0.3} ${-R - 3},${hc + R * 0.15}Z`;
      break;
    case 'bun':
    case 'puffs':
      fringe = ` C${R * 0.85},${hc - R * 0.45} ${R * 0.4},${hc - R * 0.66} 0,${hc - R * 0.66} C${-R * 0.4},${hc - R * 0.66} ${-R * 0.85},${hc - R * 0.45} ${-R - 3},${hc + R * 0.15}Z`;
      break;
    default: // ponytail: soft side-swept fringe
      fringe = ` C${R * 0.85},${hc - R * 0.35} ${R * 0.45},${hc - R * 0.52} ${R * 0.05},${hc - R * 0.5} C${-R * 0.4},${hc - R * 0.62} ${-R * 0.8},${hc - R * 0.3} ${-R - 3},${hc + R * 0.15}Z`;
  }
  return (
    <g>
      <path d={sides + fringe} fill={c} {...OUT} />
      <path d={`M${-R * 0.55},${hc - R * 0.78} q${R * 0.25},${-R * 0.18} ${R * 0.5},${-R * 0.16}`} fill="none" stroke={shade(c, 0.35)} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
      {h.hairStyle === 'puffs' &&
        [[-0.5, -0.82], [0.1, -0.86], [0.55, -0.76]].map(([kx, ky], i) => (
          <path key={i} d={`M${kx * R - 3},${hc + ky * R} a2.4,2.4 0 1,1 4,1`} fill="none" stroke={shade(c, 0.3)} strokeWidth={1.5} strokeLinecap="round" />
        ))}
    </g>
  );
}

function Head({ h, r, uid, happy }: { h: HumanDef; r: HRig; uid: string; happy: boolean }) {
  const { R, hc } = r;
  const eyeY = hc + R * 0.12;
  const eyeDx = R * 0.38;
  const brow = h.hairStyle === 'grandpa' ? '#b9b2ab' : shade(h.hairColor, -0.1);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-blush`}>
          <stop offset="0" stopColor="#ff8fb3" stopOpacity={0.7} />
          <stop offset="1" stopColor="#ff8fb3" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* ears */}
      {[-1, 1].map((s) => (
        <ellipse key={s} cx={s * R * 0.97} cy={hc + R * 0.18} rx={R * 0.14} ry={R * 0.19} fill={h.skin} {...OUT} />
      ))}
      <ellipse cx={0} cy={hc} rx={R} ry={R * 0.95} fill={h.skin} {...OUT} />
      {/* cheeks */}
      {[-1, 1].map((s) => (
        <ellipse key={s} cx={s * R * 0.6} cy={hc + R * 0.42} rx={R * 0.2} ry={R * 0.13} fill={`url(#${uid}-blush)`} />
      ))}
      {/* eyebrows */}
      {[-1, 1].map((s) => (
        <path key={s} d={`M${s * (eyeDx - R * 0.14)},${eyeY - R * 0.26} Q${s * eyeDx},${eyeY - R * 0.34} ${s * (eyeDx + R * 0.14)},${eyeY - R * 0.26}`} fill="none" stroke={brow} strokeWidth={h.hairStyle === 'grandpa' ? 4 : 2.6} strokeLinecap="round" />
      ))}
      {/* eyes */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={s * eyeDx} cy={eyeY} rx={R * 0.11} ry={R * 0.14} fill={INK} />
          <ellipse cx={s * eyeDx} cy={eyeY + R * 0.02} rx={R * 0.08} ry={R * 0.1} fill={h.eyeColor} />
          <circle cx={s * eyeDx + R * 0.035} cy={eyeY - R * 0.05} r={R * 0.042} fill="#fff" />
          <circle cx={s * eyeDx - R * 0.03} cy={eyeY + R * 0.05} r={R * 0.02} fill="#fff" />
          {h.female && <path d={`M${s * (eyeDx + R * 0.09)},${eyeY - R * 0.09} l${s * R * 0.08},${-R * 0.05}`} stroke={INK} strokeWidth={2} strokeLinecap="round" />}
        </g>
      ))}
      {/* nose */}
      <ellipse cx={0} cy={hc + R * 0.32} rx={R * 0.06} ry={R * 0.04} fill={shade(h.skin, -0.22)} />
      {/* mouth */}
      {happy ? (
        <path d={`M${-R * 0.15},${hc + R * 0.5} Q0,${hc + R * 0.74} ${R * 0.15},${hc + R * 0.5} Z`} fill="#ff7d9c" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      ) : (
        <path d={`M${-R * 0.13},${hc + R * 0.5} Q0,${hc + R * 0.64} ${R * 0.13},${hc + R * 0.5}`} fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      )}
    </g>
  );
}

// ---------------- accessories ----------------

function HairItem({ id, c, r }: { id: string; c: string; r: HRig }) {
  const { R, hc } = r;
  const arc = `M${-R * 0.95},${hc - R * 0.1} C${-R * 0.9},${hc - R * 1.25} ${R * 0.9},${hc - R * 1.25} ${R * 0.95},${hc - R * 0.1}`;
  const tag = { 'data-slot': 'hair', 'data-item': id };
  switch (id) {
    case 'hair_headband':
      return (
        <g {...tag}>
          <path d={arc} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <path d={arc} fill="none" stroke={c} strokeWidth={5.6} strokeLinecap="round" />
          <path d={`M${-R * 0.4},${hc - R * 0.88} q${R * 0.3},${-R * 0.1} ${R * 0.6},${-R * 0.04}`} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" opacity={0.7} />
        </g>
      );
    case 'hair_flower':
      return (
        <g {...tag}>
          <path d={arc} fill="none" stroke="#7cc58b" strokeWidth={3} strokeLinecap="round" />
          {[-0.85, -0.45, 0, 0.45, 0.85].map((k, i) => {
            const t = (k + 1) / 2;
            const x = -R * 0.95 + 1.9 * R * t;
            const y = hc - R * 0.1 - R * 0.86 * Math.sin(Math.PI * t) * 1.05;
            const pc = i % 2 ? shade(c, 0.35) : c;
            return (
              <g key={i}>
                {[0, 1, 2, 3, 4].map((p) => {
                  const a = (p / 5) * Math.PI * 2;
                  return <circle key={p} cx={x + Math.cos(a) * 4.6} cy={y + Math.sin(a) * 4.6} r={3.8} fill={pc} stroke={INK} strokeWidth={1.3} />;
                })}
                <circle cx={x} cy={y} r={2.8} fill="#ffe066" stroke={INK} strokeWidth={1.2} />
              </g>
            );
          })}
        </g>
      );
    case 'hair_cap':
      return (
        <g {...tag}>
          <path d={`M${-R * 1.03},${hc - R * 0.32} C${-R * 1.02},${hc - R * 1.45} ${R * 1.02},${hc - R * 1.45} ${R * 1.03},${hc - R * 0.32} Z`} fill={c} {...OUT} />
          <path d={`M${-R * 0.95},${hc - R * 0.36} Q${R * 0.2},${hc - R * 0.56} ${R * 1.25},${hc - R * 0.3} Q${R * 1.2},${hc - R * 0.12} ${R * 0.3},${hc - R * 0.2} Q${-R * 0.5},${hc - R * 0.2} ${-R * 0.95},${hc - R * 0.36} Z`} fill={shade(c, -0.18)} {...OUT} />
          <circle cx={0} cy={hc - R * 1.08} r={4} fill={shade(c, -0.18)} {...OUT} strokeWidth={1.6} />
          <path d={star4(-R * 0.1, hc - R * 0.72, 6)} fill="#fff" />
        </g>
      );
    case 'hair_clips':
      return (
        <g {...tag}>
          {[[-0.66, -0.6, 7], [-0.38, -0.82, 6], [0.62, -0.66, 6.5]].map(([kx, ky, s], i) => (
            <path key={i} d={star4(kx * R, hc + ky * R, s)} fill={c} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
          ))}
        </g>
      );
    default: {
      // bow
      const x = R * 0.6;
      const y = hc - R * 0.8;
      return (
        <g {...tag}>
          <path d={`M${x},${y} C${x - 18},${y - 16} ${x - 22},${y + 10} ${x},${y} Z`} fill={c} {...OUT} />
          <path d={`M${x},${y} C${x + 18},${y - 16} ${x + 22},${y + 10} ${x},${y} Z`} fill={c} {...OUT} />
          <circle cx={x} cy={y} r={4.4} fill={shade(c, -0.18)} {...OUT} strokeWidth={1.6} />
        </g>
      );
    }
  }
}

/** Accessories in front of the body, behind the arms. */
function AccessoryBody({ id, c, r, L }: { id: string; c: string; r: HRig; L: Limbs }) {
  const dark = shade(c, -0.2);
  const tag = { 'data-slot': 'accessory', 'data-item': id };
  switch (id) {
    case 'acc_apron': {
      const bottom = L.sit ? 18 : r.legLen * 0.4;
      const bibTop = r.sy + 16;
      const bw = r.sw * 0.55;
      return (
        <g {...tag}>
          <path d={`M${-bw + 3},${bibTop} L${-r.R * 0.18},${r.sy - 4} M${bw - 3},${bibTop} L${r.R * 0.18},${r.sy - 4}`} stroke={INK} strokeWidth={5.4} strokeLinecap="round" />
          <path d={`M${-bw + 3},${bibTop} L${-r.R * 0.18},${r.sy - 4} M${bw - 3},${bibTop} L${r.R * 0.18},${r.sy - 4}`} stroke={c} strokeWidth={2.4} strokeLinecap="round" />
          <path d={`M${-bw},${bibTop} H${bw} L${bw + 2},${r.waist + 2} L${r.hw + 5},${bottom - 6} Q${r.hw + 5},${bottom} ${r.hw - 2},${bottom} H${-r.hw + 2} Q${-r.hw - 5},${bottom} ${-r.hw - 5},${bottom - 6} L${-bw - 2},${r.waist + 2} Z`} fill={c} {...OUT} />
          <rect x={-r.hw * 0.55} y={r.waist + 6} width={r.hw * 1.1} height={14} rx={4} fill={dark} {...OUT} strokeWidth={1.6} />
          <g fill="#fff">
            <ellipse cx={0} cy={r.waist + 15} rx={3.4} ry={2.6} />
            <circle cx={-3.6} cy={r.waist + 10.5} r={1.5} />
            <circle cx={0} cy={r.waist + 9.4} r={1.5} />
            <circle cx={3.6} cy={r.waist + 10.5} r={1.5} />
          </g>
          <path d={`M${-bw * 0.6},${bibTop + 8} h${bw * 1.2}`} stroke={shade(c, 0.4)} strokeWidth={2} strokeLinecap="round" strokeDasharray="2 5" />
        </g>
      );
    }
    case 'acc_whistle':
      return (
        <g {...tag}>
          <path d={`M${-r.R * 0.22},${r.sy - 1} L0,${r.sy + 26} L${r.R * 0.22},${r.sy - 1}`} fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          <rect x={-6} y={r.sy + 25} width={13} height={8} rx={4} fill="#d8dde6" {...OUT} strokeWidth={1.6} />
          <circle cx={-1} cy={r.sy + 29} r={1.6} fill={INK} />
          <rect x={5} y={r.sy + 25} width={5} height={4} rx={1} fill={c} stroke={INK} strokeWidth={1.2} />
        </g>
      );
    case 'acc_necklace':
      return (
        <g {...tag}>
          {Array.from({ length: 9 }, (_, i) => {
            const t = i / 8;
            const x = -r.R * 0.38 + r.R * 0.76 * t;
            const y = r.sy + 1 + Math.sin(Math.PI * t) * 12;
            return <circle key={i} cx={x} cy={y} r={i === 4 ? 4 : 2.8} fill={i % 2 ? shade(c, 0.45) : c} stroke={INK} strokeWidth={1.1} />;
          })}
        </g>
      );
    case 'acc_bag':
      return (
        <g {...tag}>
          <path d={`M${-r.sw + 8},${r.sy + 1} L${r.hw + 6},${r.waist - 4}`} stroke={INK} strokeWidth={5.6} strokeLinecap="round" />
          <path d={`M${-r.sw + 8},${r.sy + 1} L${r.hw + 6},${r.waist - 4}`} stroke={dark} strokeWidth={2.4} strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

/** Accessories drawn in front of the arms / around the neck. */
function AccessoryFront({ id, c, r, L }: { id: string; c: string; r: HRig; L: Limbs }) {
  const dark = shade(c, -0.2);
  const tag = { 'data-slot': 'accessory', 'data-item': id };
  switch (id) {
    case 'acc_bag': {
      const x = r.hw + 6;
      const y = L.sit ? r.waist - 6 : r.waist - 4;
      return (
        <g {...tag}>
          <rect x={x - 12} y={y} width={24} height={20} rx={6} fill={c} {...OUT} />
          <path d={`M${x - 12},${y + 6} Q${x},${y + 14} ${x + 12},${y + 6} L${x + 12},${y + 4} Q${x + 12},${y} ${x + 6},${y} L${x - 6},${y} Q${x - 12},${y} ${x - 12},${y + 4} Z`} fill={dark} {...OUT} strokeWidth={1.8} />
          <circle cx={x} cy={y + 10} r={2.2} fill="#fff" stroke={INK} strokeWidth={1.1} />
        </g>
      );
    }
    case 'acc_scarf':
      return (
        <g {...tag}>
          <rect x={4} y={r.sy + 2} width={12} height={r.armLen * 0.45} rx={5} fill={dark} {...OUT} />
          <path d={`M6,${r.sy + 2 + r.armLen * 0.45} v5 M10,${r.sy + 2 + r.armLen * 0.45} v5 M14,${r.sy + 2 + r.armLen * 0.45} v5`} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
          <ellipse cx={0} cy={r.sy + 1} rx={r.R * 0.52} ry={8.5} fill={c} {...OUT} />
          <path d={`M${-r.R * 0.35},${r.sy + 1} h${r.R * 0.7}`} stroke={shade(c, 0.4)} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="3 5" />
        </g>
      );
    default:
      return null;
  }
}

function Glasses({ c, r }: { c: string; r: HRig }) {
  const { R, hc } = r;
  const y = hc + R * 0.12;
  const gr = R * 0.22;
  return (
    <g data-slot="accessory" data-item="acc_glasses">
      {[-1, 1].map((s) => (
        <circle key={s} cx={s * R * 0.38} cy={y} r={gr} fill="#ffffff" fillOpacity={0.25} stroke={c} strokeWidth={2.8} />
      ))}
      <path d={`M${-R * 0.38 + gr},${y - 2} Q0,${y - 7} ${R * 0.38 - gr},${y - 2}`} fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" />
      <path d={`M${-R * 0.38 - gr},${y - 2} L${-R * 0.92},${y - 6} M${R * 0.38 + gr},${y - 2} L${R * 0.92},${y - 6}`} stroke={c} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
}

// ---------------- the figure ----------------

export interface HumanFigureProps {
  human: HumanDef;
  /** defaults to the human's defaultOutfit; pass {} for the plain base clothes */
  outfit?: HumanOutfit;
  pose?: HumanPose;
  /** render only the <g> in room units around the anchor (for embedding in a room SVG) */
  asGroup?: boolean;
  className?: string;
  title?: string;
}

export function HumanFigure({ human, outfit, pose = 'stand', asGroup, className, title }: HumanFigureProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = rigFor(human);
  const L = limbsFor(r, pose);
  const o = outfit ?? human.defaultOutfit;
  const piece = (slot: HumanSlot) => {
    const p = o[slot];
    const item = p && humanWearableById(p.itemId);
    if (!p || !item || item.slot !== slot) return null;
    return { id: item.id, c: p.color || item.color };
  };
  const hair = piece('hair');
  const top = piece('top');
  const bottom = piece('bottom');
  const shoes = piece('shoes');
  const acc = piece('accessory');
  const waveArm = L.wave >= 0 ? L.arms[L.wave] : null;
  const topId = top?.id ?? 'top_tshirt';
  const topC = top?.c ?? BASE_TOP;

  const arm = (i: number) => (
    <g key={i}>
      <ArmSkin pts={L.arms[i]} h={human} r={r} />
      <Sleeves id={topId} c={topC} r={r} L={{ ...L, arms: [L.arms[i]], wave: -1 }} />
    </g>
  );

  const body = (
    <g className="human-body">
      <Legs h={human} r={r} L={L} />
      {shoes && <Shoes id={shoes.id} c={shoes.c} r={r} L={L} />}
      {bottom ? <Bottom id={bottom.id} c={bottom.c} r={r} L={L} /> : <Bottom id="base" c={BASE_BOTTOM} r={r} L={L} base />}
      <g className="human-breathe" style={{ transformOrigin: '0px 0px' }}>
        <HairBack h={human} r={r} />
        <rect x={-r.R * 0.2} y={r.hc + r.R * 0.7} width={r.R * 0.4} height={r.sy - r.hc - r.R * 0.7 + 6} fill={shade(human.skin, -0.08)} {...OUT} />
        <Top id={topId} c={topC} r={r} L={L} base={!top} />
        {acc && <AccessoryBody id={acc.id} c={acc.c} r={r} L={L} />}
        {L.arms.map((_, i) => (i === L.wave ? null : arm(i)))}
        {waveArm && (
          <g className="human-wave-arm" style={{ transformOrigin: `${f(waveArm[0][0])}px ${f(waveArm[0][1])}px` }}>
            {arm(L.wave)}
          </g>
        )}
        {acc && <AccessoryFront id={acc.id} c={acc.c} r={r} L={L} />}
        <HairMid h={human} r={r} />
        <Head h={human} r={r} uid={uid} happy={pose === 'wave'} />
        <HairFront h={human} r={r} />
        {hair && <HairItem id={hair.id} c={hair.c} r={r} />}
        {acc?.id === 'acc_glasses' && <Glasses c={acc.c} r={r} />}
      </g>
    </g>
  );

  const g = (
    <g className={`human human-${pose}`} data-human={human.id} data-pose={pose}>
      {L.sit ? body : <g transform={`translate(0 ${-r.legLen})`}>{body}</g>}
    </g>
  );
  if (asGroup) return g;
  const { w, h } = humanSize(human);
  return (
    <svg className={className} viewBox={`${-w / 2 - 10} ${-h - 10} ${w + 20} ${h + 20}`} role="img" aria-label={title ?? `${human.name} – ${human.description}`}>
      {L.sit ? <g transform={`translate(0 ${-HUMAN_SEAT_DROP})`}>{g}</g> : g}
    </svg>
  );
}
