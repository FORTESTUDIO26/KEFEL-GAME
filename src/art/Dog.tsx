// Original SVG dogs (front-facing, sitting) with clothing layers fitted to each body type.
// Every clothing piece is drawn from the dog's "rig" so it fits small, medium, large and long dogs.

import { useId, type ReactNode } from 'react';
import type { DogDef } from '../content/dogs';
import { wearableById, type Slot } from '../content/catalog';
import type { Outfit } from '../state/types';
import { VariantDecal } from './VariantDecal';
import { INK, shade } from './color';

export interface Rig {
  cx: number;
  headCy: number;
  headR: number;
  bodyTop: number;
  bottom: number;
  tw: number;
  bw: number;
  legTop: number;
  legW: number;
  legGap: number;
  neckY: number;
}

export function rigFor(dog: DogDef): Rig {
  const base = { cx: 120, bottom: 236 };
  const parts = {
    small: { headR: 48, headCy: 96, bodyTop: 132, tw: 22, bw: 40, legTop: 176, legW: 15, legGap: 14 },
    medium: { headR: 50, headCy: 84, bodyTop: 122, tw: 26, bw: 48, legTop: 166, legW: 17, legGap: 17 },
    large: { headR: 54, headCy: 76, bodyTop: 116, tw: 30, bw: 56, legTop: 160, legW: 19, legGap: 20 },
    long: { headR: 50, headCy: 100, bodyTop: 138, tw: 34, bw: 66, legTop: 200, legW: 18, legGap: 24 },
  }[dog.build];
  return { ...base, ...parts, neckY: parts.headCy + parts.headR * 0.84 };
}

/** half-width of the body at height y */
function hw(r: Rig, y: number): number {
  const t = Math.min(1, Math.max(0, (y - r.bodyTop) / (r.bottom - 26 - r.bodyTop)));
  return r.tw + (r.bw - r.tw) * Math.sin((t * Math.PI) / 2);
}

type Pt = [number, number];

/** Closed smooth path through points (Catmull-Rom → cubic Bézier). */
function smooth(points: Pt[]): string {
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

function bodyPath(r: Rig): string {
  const left: Pt[] = [];
  for (let y = r.bodyTop; y <= r.bottom - 14; y += 14) left.push([r.cx - hw(r, y), y]);
  const right = left.map(([x, y]) => [2 * r.cx - x, y] as Pt).reverse();
  return smooth([
    [r.cx, r.bodyTop - 6],
    ...left,
    [r.cx - r.bw + 6, r.bottom],
    [r.cx, r.bottom + 2],
    [r.cx + r.bw - 6, r.bottom],
    ...right,
  ]);
}

/** Garment covering the torso between y0 and y1. */
function torso(r: Rig, y0: number, y1: number, pad = 4, neckDip = 10): string {
  const steps = 4;
  const left: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = y0 + ((y1 - y0) * i) / steps;
    left.push([r.cx - hw(r, y) - pad, y]);
  }
  const right = left.map(([x, y]) => [2 * r.cx - x, y] as Pt).reverse();
  return smooth([[r.cx, y0 + neckDip], ...left, [r.cx, y1 + 5], ...right]);
}

function star4(x: number, y: number, s: number): string {
  return `M${x},${y - s} Q${x + s * 0.2},${y - s * 0.2} ${x + s},${y} Q${x + s * 0.2},${y + s * 0.2} ${x},${y + s} Q${x - s * 0.2},${y + s * 0.2} ${x - s},${y} Q${x - s * 0.2},${y - s * 0.2} ${x},${y - s}Z`;
}

function heart(x: number, y: number, s: number): string {
  return `M${x},${y + s * 0.9} C${x - s * 1.4},${y - s * 0.1} ${x - s * 0.7},${y - s * 1.2} ${x},${y - s * 0.4} C${x + s * 0.7},${y - s * 1.2} ${x + s * 1.4},${y - s * 0.1} ${x},${y + s * 0.9}Z`;
}

const OUT = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

// ---------------- dog parts ----------------

function Tail({ dog, r }: { dog: DogDef; r: Rig }) {
  const bx = r.cx + r.bw - 8;
  const by = r.bottom - 26;
  const fill = dog.fur;
  switch (dog.tail) {
    case 'wag':
      return (
        <g className="dog-tail" style={{ transformOrigin: `${bx}px ${by}px` }}>
          <path d={`M${bx},${by} C${bx + 30},${by - 6} ${bx + 42},${by - 44} ${bx + 30},${by - 66}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <path d={`M${bx},${by} C${bx + 30},${by - 6} ${bx + 42},${by - 44} ${bx + 30},${by - 66}`} fill="none" stroke={fill} strokeWidth={9.5} strokeLinecap="round" />
        </g>
      );
    case 'curl':
      return (
        <g className="dog-tail" style={{ transformOrigin: `${bx}px ${by}px` }}>
          <path d={`M${bx},${by} c32,-4 40,-46 14,-52 c-18,-3 -20,20 -3,18`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
          <path d={`M${bx},${by} c32,-4 40,-46 14,-52 c-18,-3 -20,20 -3,18`} fill="none" stroke={fill} strokeWidth={11} strokeLinecap="round" />
        </g>
      );
    case 'fluffy':
      return (
        <g className="dog-tail" style={{ transformOrigin: `${bx}px ${by}px` }}>
          <ellipse cx={bx + 22} cy={by - 30} rx={15} ry={36} transform={`rotate(32 ${bx + 22} ${by - 30})`} fill={fill} {...OUT} />
          <ellipse cx={bx + 30} cy={by - 50} rx={7} ry={13} transform={`rotate(32 ${bx + 30} ${by - 50})`} fill={dog.light} opacity={0.6} />
        </g>
      );
    case 'pom':
      // short upright tail with a curly pom-pom (toy poodle)
      return (
        <g className="dog-tail" style={{ transformOrigin: `${bx}px ${by}px` }}>
          <path d={`M${bx - 2},${by} Q${bx + 12},${by - 10} ${bx + 14},${by - 26}`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <path d={`M${bx - 2},${by} Q${bx + 12},${by - 10} ${bx + 14},${by - 26}`} fill="none" stroke={fill} strokeWidth={6} strokeLinecap="round" />
          <CurlBall cx={bx + 15} cy={by - 34} r={13} fill={fill} dark={dog.furDark} />
        </g>
      );
    default:
      return <ellipse cx={bx + 8} cy={by - 4} rx={11} ry={9} fill={fill} {...OUT} />;
  }
}

/** A round cluster of curls (pom-poms, curly ears). */
function CurlBall({ cx, cy, r, fill, dark }: { cx: number; cy: number; r: number; fill: string; dark: string }) {
  const n = 8;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = (i / n) * Math.PI * 2;
        return <circle key={i} cx={cx + Math.cos(t) * r * 0.62} cy={cy + Math.sin(t) * r * 0.62} r={r * 0.46} fill={fill} {...OUT} strokeWidth={1.8} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.72} fill={fill} />
      <path d={`M${cx - r * 0.3},${cy} a${r * 0.18},${r * 0.18} 0 1,1 ${r * 0.3},0 M${cx + r * 0.05},${cy + r * 0.32} a${r * 0.16},${r * 0.16} 0 1,1 ${r * 0.28},0`} fill="none" stroke={dark} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

/** Bumpy curly outline around an ellipse: draw before the (stroke-less) shape itself. */
function CurlyRim({ cx, cy, rx, ry, n, bump, fill, from = 0, to = Math.PI * 2 }: { cx: number; cy: number; rx: number; ry: number; n: number; bump: number; fill: string; from?: number; to?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = from + ((to - from) * (i + 0.5)) / n;
        return <circle key={i} cx={cx + Math.cos(t) * rx} cy={cy + Math.sin(t) * ry} r={bump} fill={fill} {...OUT} strokeWidth={2} />;
      })}
    </g>
  );
}

/** Small curl marks drawn on top of curly fur. */
function CurlMarks({ points, s, color }: { points: [number, number][]; s: number; color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" opacity={0.75}>
      {points.map(([x, y], i) => (
        <path key={i} d={`M${x - s},${y} a${s * 0.7},${s * 0.7} 0 1,1 ${s * 1.1},${s * 0.3}`} />
      ))}
    </g>
  );
}

function Ears({ dog, r, front }: { dog: DogDef; r: Rig; front: boolean }) {
  const { cx, headCy: y, headR: R } = r;
  const ear = dog.pattern === 'patch' || dog.pattern === 'mask' ? dog.furDark : dog.ears === 'pointy' ? dog.fur : dog.furDark;
  const pink = '#f7a8c4';
  const sides = [-1, 1];
  if (dog.ears === 'pointy' && !front) {
    // Small dogs (chihuahua) get big ears angled outwards; others stand more upright. Tips are rounded.
    const big = dog.build === 'small';
    const tx = big ? 1.28 : 0.84;
    const ty = big ? -1.12 : -1.36;
    return (
      <g>
        {sides.map((s) => (
          <g key={s}>
            <path
              d={`M${cx + s * R * 0.92},${y - R * 0.05} L${cx + s * R * (tx - 0.04)},${y + R * (ty + 0.12)} Q${cx + s * R * tx},${y + R * ty} ${cx + s * R * (tx - 0.14)},${y + R * (ty + 0.04)} L${cx + s * R * 0.16},${y - R * 0.78} Z`}
              fill={ear}
              {...OUT}
            />
            <path
              d={`M${cx + s * R * 0.76},${y - R * 0.3} L${cx + s * R * (tx - 0.14)},${y + R * (ty + 0.26)} L${cx + s * R * 0.4},${y - R * 0.72} Z`}
              fill={pink}
            />
          </g>
        ))}
      </g>
    );
  }
  if (!front || dog.ears === 'pointy') return null;
  if (dog.ears === 'floppy' || dog.ears === 'long') {
    const drop = dog.ears === 'long' ? 1.15 : 0.62;
    return (
      <g className="dog-ears">
        {sides.map((s) => (
          <path
            key={s}
            d={`M${cx + s * R * 0.62},${y - R * 0.72} C${cx + s * R * 1.25},${y - R * 0.72} ${cx + s * R * 1.32},${y + R * drop} ${cx + s * R * 0.98},${y + R * (drop + 0.08)} C${cx + s * R * 0.72},${y + R * (drop + 0.1)} ${cx + s * R * 0.7},${y - R * 0.1} ${cx + s * R * 0.48},${y - R * 0.55} Z`}
            fill={ear}
            {...OUT}
          />
        ))}
      </g>
    );
  }
  if (dog.ears === 'fold') {
    return (
      <g>
        {sides.map((s) => (
          <path
            key={s}
            d={`M${cx + s * R * 0.42},${y - R * 0.86} C${cx + s * R * 0.9},${y - R * 1.12} ${cx + s * R * 1.16},${y - R * 0.6} ${cx + s * R * 1.02},${y - R * 0.12} C${cx + s * R * 0.9},${y - R * 0.3} ${cx + s * R * 0.78},${y - R * 0.5} ${cx + s * R * 0.6},${y - R * 0.5} Z`}
            fill={ear}
            {...OUT}
          />
        ))}
      </g>
    );
  }
  if (dog.ears === 'curly') {
    // long, hanging ears made of curls (toy poodle)
    return (
      <g className="dog-ears">
        {sides.map((s) => (
          <g key={s}>
            {[0, 1, 2, 3, 4].map((i) => (
              <CurlBall
                key={i}
                cx={cx + s * R * (0.9 + (i % 2) * 0.12 + i * 0.03)}
                cy={y - R * 0.38 + i * R * 0.3}
                r={R * (0.3 - i * 0.012)}
                fill={dog.fur}
                dark={dog.furDark}
              />
            ))}
          </g>
        ))}
      </g>
    );
  }
  // puff (poodle / shih tzu)
  return (
    <g>
      {sides.map((s) => (
        <g key={s}>
          {[0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={cx + s * R * (0.98 + (i % 2) * 0.12)}
              cy={y - R * 0.1 + i * R * 0.24}
              r={R * 0.27}
              fill={dog.pattern === 'patch' ? dog.furDark : dog.furDark}
              {...OUT}
            />
          ))}
        </g>
      ))}
    </g>
  );
}

function Head({ dog, r }: { dog: DogDef; r: Rig }) {
  const { cx, headCy: y, headR: R } = r;
  const eyeY = y - R * 0.04;
  const eyeDx = R * 0.38;
  return (
    <g>
      {dog.curly ? (
        <>
          <CurlyRim cx={cx} cy={y} rx={R * 0.9} ry={R * 0.82} n={16} bump={R * 0.2} fill={dog.fur} />
          <ellipse cx={cx} cy={y} rx={R * 0.95} ry={R * 0.88} fill={dog.fur} />
          <CurlMarks points={[[cx - R * 0.55, y - R * 0.5], [cx + R * 0.5, y - R * 0.55], [cx - R * 0.7, y + R * 0.05], [cx + R * 0.72, y + R * 0.02]]} s={R * 0.09} color={dog.furDark} />
        </>
      ) : (
        <ellipse cx={cx} cy={y} rx={R} ry={R * 0.92} fill={dog.fur} {...OUT} />
      )}
      {dog.pattern === 'mask' && (
        <path
          d={`M${cx - R * 0.86},${y + R * 0.1} Q${cx - R * 0.5},${y - R * 0.28} ${cx},${y - R * 0.3} Q${cx + R * 0.5},${y - R * 0.28} ${cx + R * 0.86},${y + R * 0.1} Q${cx + R * 0.7},${y + R * 0.86} ${cx},${y + R * 0.9} Q${cx - R * 0.7},${y + R * 0.86} ${cx - R * 0.86},${y + R * 0.1}Z`}
          fill={dog.light}
        />
      )}
      {dog.pattern === 'patch' && <ellipse cx={cx + eyeDx} cy={eyeY} rx={R * 0.3} ry={R * 0.28} fill={dog.furDark} opacity={0.85} />}
      {dog.pattern === 'saddle' && (
        <path d={`M${cx - R * 0.14},${y - R * 0.9} Q${cx},${y - R * 0.3} ${cx - R * 0.28},${y + R * 0.4} L${cx + R * 0.28},${y + R * 0.4} Q${cx},${y - R * 0.3} ${cx + R * 0.14},${y - R * 0.9}Z`} fill={dog.light} />
      )}
      {dog.pattern === 'spots' && (
        <g fill={dog.furDark}>
          <circle cx={cx - R * 0.55} cy={y - R * 0.45} r={R * 0.09} />
          <circle cx={cx + R * 0.62} cy={y - R * 0.3} r={R * 0.07} />
          <circle cx={cx + R * 0.2} cy={y - R * 0.7} r={R * 0.06} />
        </g>
      )}
      {dog.topknot && dog.curly && (
        <g>
          {[-0.36, 0, 0.36].map((dx, i) => (
            <CurlBall key={i} cx={cx + dx * R} cy={y - R * (i === 1 ? 1.02 : 0.86)} r={R * 0.3} fill={dog.fur} dark={dog.furDark} />
          ))}
        </g>
      )}
      {dog.topknot &&
        !dog.curly &&
        [-0.4, -0.1, 0.2, 0.45, -0.25, 0.05, 0.3].map((dx, i) => (
          <circle key={i} cx={cx + dx * R} cy={y - R * (i < 4 ? 0.88 : 1.1)} r={R * 0.24} fill={dog.fur} {...OUT} />
        ))}
      {dog.topknot && !dog.curly && <ellipse cx={cx} cy={y - R * 0.86} rx={R * 0.6} ry={R * 0.22} fill={dog.fur} />}
      {/* muzzle */}
      <ellipse cx={cx} cy={y + R * 0.38} rx={R * 0.52} ry={R * 0.36} fill={dog.light} />
      {/* cheeks */}
      <ellipse cx={cx - R * 0.6} cy={y + R * 0.3} rx={R * 0.14} ry={R * 0.09} fill="#ff8fb3" opacity={0.45} />
      <ellipse cx={cx + R * 0.6} cy={y + R * 0.3} rx={R * 0.14} ry={R * 0.09} fill="#ff8fb3" opacity={0.45} />
      {/* eyes */}
      <g className="dog-eyes" style={{ transformOrigin: `${cx}px ${eyeY}px` }}>
        {[-1, 1].map((s) => (
          <g key={s}>
            <ellipse cx={cx + s * eyeDx} cy={eyeY} rx={R * 0.13} ry={R * 0.15} fill={INK} />
            <ellipse cx={cx + s * eyeDx} cy={eyeY} rx={R * 0.1} ry={R * 0.12} fill={dog.eye} />
            <circle cx={cx + s * eyeDx + R * 0.04} cy={eyeY - R * 0.05} r={R * 0.045} fill="#fff" />
            <circle cx={cx + s * eyeDx - R * 0.03} cy={eyeY + R * 0.05} r={R * 0.02} fill="#fff" />
          </g>
        ))}
      </g>
      {/* nose & mouth */}
      <path
        d={`M${cx - R * 0.18},${y + R * 0.19} Q${cx},${y + R * 0.1} ${cx + R * 0.18},${y + R * 0.19} Q${cx + R * 0.15},${y + R * 0.33} ${cx},${y + R * 0.37} Q${cx - R * 0.15},${y + R * 0.33} ${cx - R * 0.18},${y + R * 0.19}Z`}
        fill={INK}
      />
      <ellipse cx={cx - R * 0.04} cy={y + R * 0.2} rx={R * 0.04} ry={R * 0.02} fill="#fff" opacity={0.7} />
      <path
        d={`M${cx},${y + R * 0.36} L${cx},${y + R * 0.44} M${cx - R * 0.17},${y + R * 0.44} Q${cx - R * 0.08},${y + R * 0.54} ${cx},${y + R * 0.44} Q${cx + R * 0.08},${y + R * 0.54} ${cx + R * 0.17},${y + R * 0.44}`}
        fill="none"
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path d={`M${cx - R * 0.07},${y + R * 0.5} Q${cx},${y + R * 0.66} ${cx + R * 0.07},${y + R * 0.5}Z`} fill="#ff7d9c" />
    </g>
  );
}

// ---------------- clothing ----------------

interface PieceProps {
  r: Rig;
  c: string;
  uid: string;
}

function Stripes({ id, d, c, color, gap = 11 }: { id: string; d: string; c: string; color: string; gap?: number }) {
  return (
    <g>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={c} />
      <g clipPath={`url(#${id})`}>
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x={0} y={60 + i * gap * 2} width={240} height={gap} fill={color} />
        ))}
      </g>
      <path d={d} fill="none" {...OUT} />
    </g>
  );
}

function Dots({ id, d, c, color }: { id: string; d: string; c: string; color: string }) {
  const dots: ReactNode[] = [];
  for (let y = 100; y < 250; y += 16)
    for (let x = 40; x < 210; x += 16) dots.push(<circle key={`${x}-${y}`} cx={x + ((y / 16) % 2) * 8} cy={y} r={3.2} fill={color} />);
  return (
    <g>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={c} />
      <g clipPath={`url(#${id})`}>{dots}</g>
      <path d={d} fill="none" {...OUT} />
    </g>
  );
}

function Sleeves({ r, c, len = 20 }: { r: Rig; c: string; len?: number }) {
  return (
    <g>
      {[-1, 1].map((s) => (
        <rect key={s} x={r.cx + s * r.legGap - r.legW / 2 - 3} y={r.legTop - 4} width={r.legW + 6} height={len} rx={6} fill={c} {...OUT} />
      ))}
    </g>
  );
}

/** Body pieces have a torso part (under the front legs) and an over-legs part. */
function BodyUnder({ id, r, c, uid }: PieceProps & { id: string }) {
  const y0 = r.neckY - 6;
  const yMid = r.legTop + 18;
  switch (id) {
    case 'tee_stripes':
      return <Stripes id={`${uid}-st`} d={torso(r, y0, yMid)} c={c} color="#ffffff" />;
    case 'sport_tank': {
      const d = torso(r, y0 + 2, yMid);
      return (
        <g>
          <path d={d} fill={c} {...OUT} />
          <rect x={r.cx - hw(r, yMid - 16) - 4} y={yMid - 22} width={(hw(r, yMid - 16) + 4) * 2} height={8} fill="#fff" opacity={0.85} />
          <text x={r.cx} y={y0 + 34} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff" fontFamily="Rubik, Arial, sans-serif">7</text>
        </g>
      );
    }
    case 'tutu':
    case 'leotard': {
      const d = torso(r, y0, yMid - 4, 3);
      return (
        <g>
          <path d={d} fill={c} {...OUT} />
          {id === 'leotard' &&
            [[-14, 20], [12, 30], [-4, 44], [16, 54], [-18, 58]].map(([dx, dy], i) => (
              <path key={i} d={star4(r.cx + dx, y0 + dy, 4.5)} fill="#fff" opacity={0.9} />
            ))}
          {id === 'tutu' && <path d={`M${r.cx - 10},${y0 + 16} Q${r.cx},${y0 + 26} ${r.cx + 10},${y0 + 16}`} fill="none" stroke="#fff" strokeWidth={2} opacity={0.8} />}
        </g>
      );
    }
    case 'denim': {
      const d = torso(r, y0, yMid);
      return (
        <g>
          <path d={d} fill={c} {...OUT} />
          <path d={`M${r.cx},${y0 + 12} L${r.cx},${yMid + 2}`} stroke={shade(c, -0.35)} strokeWidth={2} strokeDasharray="4 3" />
          {[18, 34, 50].map((dy) => (
            <circle key={dy} cx={r.cx + 6} cy={y0 + dy} r={2.6} fill="#f2c14e" stroke={INK} strokeWidth={1} />
          ))}
          <path d={`M${r.cx - 2},${y0 + 4} L${r.cx - 22},${y0 + 2} L${r.cx - 12},${y0 + 22}Z M${r.cx + 2},${y0 + 4} L${r.cx + 22},${y0 + 2} L${r.cx + 12},${y0 + 22}Z`} fill={shade(c, -0.18)} {...OUT} strokeWidth={1.6} />
        </g>
      );
    }
    case 'sweater': {
      const d = torso(r, y0, yMid);
      return (
        <g>
          <clipPath id={`${uid}-sw`}>
            <path d={d} />
          </clipPath>
          <path d={d} fill={c} />
          <g clipPath={`url(#${uid}-sw)`} fill="none" stroke={shade(c, 0.45)} strokeWidth={2.4}>
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M30,${y0 + 22 + i * 18} ${Array.from({ length: 12 }, (_, k) => `L${36 + k * 14},${y0 + 22 + i * 18 + (k % 2 ? -6 : 0)}`).join(' ')}`} />
            ))}
          </g>
          <path d={d} fill="none" {...OUT} />
          <path d={`M${r.cx - hw(r, y0) - 4},${y0 + 4} Q${r.cx},${y0 + 20} ${r.cx + hw(r, y0) + 4},${y0 + 4}`} fill="none" stroke={shade(c, -0.2)} strokeWidth={7} strokeLinecap="round" />
        </g>
      );
    }
    case 'raincoat': {
      const d = torso(r, y0, r.bottom - 22, 6);
      return (
        <g>
          <path d={d} fill={c} {...OUT} />
          <path d={`M${r.cx},${y0 + 10} L${r.cx},${r.bottom - 18}`} stroke={shade(c, -0.3)} strokeWidth={2} />
          {[22, 40, 58].map((dy) => (
            <rect key={dy} x={r.cx - 8} y={y0 + dy} width={5} height={9} rx={2.5} fill="#fff" stroke={INK} strokeWidth={1.2} />
          ))}
          <path d={`M${r.cx - hw(r, y0) - 6},${y0} Q${r.cx},${y0 + 22} ${r.cx + hw(r, y0) + 6},${y0}`} fill="none" stroke={shade(c, -0.2)} strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    }
    case 'pajama':
      return <Dots id={`${uid}-pj`} d={torso(r, y0, yMid)} c={c} color="#ffffff" />;
    case 'hoodie': {
      const d = torso(r, y0, yMid + 4);
      const pw = hw(r, yMid - 10) * 0.9;
      return (
        <g>
          <path d={d} fill={c} {...OUT} />
          <path d={`M${r.cx - hw(r, y0) - 6},${y0 + 2} Q${r.cx},${y0 + 26} ${r.cx + hw(r, y0) + 6},${y0 + 2}`} fill="none" stroke={shade(c, -0.15)} strokeWidth={9} strokeLinecap="round" />
          <path d={`M${r.cx - 6},${y0 + 12} l-2,18 M${r.cx + 6},${y0 + 12} l2,18`} stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
          <path d={`M${r.cx - pw},${yMid - 22} L${r.cx + pw},${yMid - 22} L${r.cx + pw - 4},${yMid} L${r.cx - pw + 4},${yMid} Z`} fill={shade(c, -0.1)} stroke={INK} strokeWidth={1.4} />
        </g>
      );
    }
    case 'flowy_dress': {
      const d = torso(r, y0, yMid - 6, 3);
      return (
        <g>
          <path d={d} fill={c} {...OUT} />
          {[[-8, 18], [8, 30], [-4, 40]].map(([dx, dy], i) => (
            <circle key={i} cx={r.cx + dx} cy={y0 + dy} r={3} fill="#fff" opacity={0.85} />
          ))}
        </g>
      );
    }
    case 'knit_vest': {
      const d = torso(r, y0 + 4, yMid);
      return (
        <g>
          <clipPath id={`${uid}-kv`}>
            <path d={d} />
          </clipPath>
          <path d={d} fill={c} />
          <g clipPath={`url(#${uid}-kv)`} fill="none" stroke={shade(c, 0.4)} strokeWidth={1.8}>
            {[-24, -8, 8, 24].map((dx) => (
              <path key={dx} d={`M${r.cx + dx},${y0 + 20} l8,10 l-8,10 l-8,-10 Z M${r.cx + dx},${y0 + 44} l8,10 l-8,10 l-8,-10 Z`} />
            ))}
          </g>
          <path d={d} fill="none" {...OUT} />
          <path d={`M${r.cx - 14},${y0 + 4} L${r.cx},${y0 + 30} L${r.cx + 14},${y0 + 4}`} fill={shade(c, -0.25)} stroke={INK} strokeWidth={1.6} />
        </g>
      );
    }
    case 'evening_jacket': {
      const d = torso(r, y0, yMid + 6);
      return (
        <g>
          <path d={d} fill={c} {...OUT} />
          <path d={`M${r.cx - 16},${y0 + 4} L${r.cx},${y0 + 40} L${r.cx + 16},${y0 + 4}Z`} fill="#fbf8ff" stroke={INK} strokeWidth={1.6} />
          <path d={`M${r.cx - 16},${y0 + 4} L${r.cx - 2},${y0 + 40} L${r.cx - 24},${y0 + 22}Z M${r.cx + 16},${y0 + 4} L${r.cx + 2},${y0 + 40} L${r.cx + 24},${y0 + 22}Z`} fill={shade(c, 0.25)} stroke={INK} strokeWidth={1.4} />
          <circle cx={r.cx} cy={y0 + 48} r={2.6} fill="#f2c14e" />
        </g>
      );
    }
    default:
      return null;
  }
}

function BodyOver({ id, r, c }: PieceProps & { id: string }) {
  const yMid = r.legTop + 18;
  switch (id) {
    case 'tee_stripes':
    case 'pajama':
    case 'sweater':
    case 'denim':
    case 'evening_jacket':
      return <Sleeves r={r} c={id === 'tee_stripes' || id === 'pajama' ? c : shade(c, -0.08)} len={id === 'sweater' ? 28 : 18} />;
    case 'raincoat':
      return <Sleeves r={r} c={c} len={30} />;
    case 'hoodie':
      return <Sleeves r={r} c={c} len={32} />;
    case 'flowy_dress': {
      // A-line skirt over the legs, with a wavy hem
      const y = yMid - 8;
      const top = hw(r, y) + 4;
      const hemY = r.bottom - 10;
      const hem = hw(r, hemY) + 20;
      const waves = 6;
      const wave = Array.from({ length: waves }, (_, i) => {
        const x0 = r.cx + hem - (2 * hem * i) / waves;
        const x1 = r.cx + hem - (2 * hem * (i + 1)) / waves;
        return `Q${(x0 + x1) / 2},${hemY + 12} ${x1},${hemY}`;
      }).join(' ');
      return (
        <g>
          <path d={`M${r.cx - top},${y} L${r.cx + top},${y} L${r.cx + hem},${hemY} ${wave} Z`} fill={c} opacity={0.96} {...OUT} />
          <path d={`M${r.cx - top + 6},${y + 18} Q${r.cx},${y + 26} ${r.cx + top - 6},${y + 18}`} fill="none" stroke="#fff" strokeWidth={2} opacity={0.7} />
          <rect x={r.cx - top - 2} y={y - 5} width={(top + 2) * 2} height={8} rx={4} fill={shade(c, -0.2)} {...OUT} strokeWidth={1.4} />
        </g>
      );
    }
    case 'tutu': {
      const y = yMid - 4;
      const w = hw(r, y) + 22;
      return (
        <g>
          {[0, 1].map((layer) => (
            <path
              key={layer}
              d={`M${r.cx - w + layer * 6},${y - 4} ${Array.from({ length: 9 }, (_, i) => {
                const x0 = r.cx - w + layer * 6 + ((w - layer * 6) * 2 * i) / 9;
                const x1 = r.cx - w + layer * 6 + ((w - layer * 6) * 2 * (i + 1)) / 9;
                return `Q${(x0 + x1) / 2},${y + 30 - layer * 8} ${x1},${y - 4}`;
              }).join(' ')} Q${r.cx},${y - 16} ${r.cx - w + layer * 6},${y - 4}Z`}
              fill={layer ? shade(c, 0.35) : c}
              opacity={layer ? 0.95 : 0.9}
              {...OUT}
              strokeWidth={1.6}
            />
          ))}
          <rect x={r.cx - hw(r, y) - 4} y={y - 9} width={(hw(r, y) + 4) * 2} height={8} rx={4} fill={shade(c, -0.2)} {...OUT} strokeWidth={1.4} />
        </g>
      );
    }
    case 'leotard': {
      const y = yMid - 6;
      const w = hw(r, y) + 8;
      return (
        <path
          d={`M${r.cx - w},${y - 4} Q${r.cx - w - 6},${y + 14} ${r.cx - w + 6},${y + 16} Q${r.cx},${y + 8} ${r.cx + w - 6},${y + 16} Q${r.cx + w + 6},${y + 14} ${r.cx + w},${y - 4}Z`}
          fill={shade(c, 0.4)}
          opacity={0.9}
          {...OUT}
          strokeWidth={1.4}
        />
      );
    }
    default:
      return null;
  }
}

function Neck({ id, r, c }: PieceProps & { id: string }) {
  const y = r.neckY;
  const w = hw(r, y) + 8;
  const band = (h: number, fill: string) => (
    <path d={`M${r.cx - w},${y - h / 2} Q${r.cx},${y + 10 - h / 2} ${r.cx + w},${y - h / 2} L${r.cx + w},${y + h / 2} Q${r.cx},${y + 10 + h / 2} ${r.cx - w},${y + h / 2}Z`} fill={fill} {...OUT} />
  );
  switch (id) {
    case 'collar_classic':
      return (
        <g>
          {band(9, c)}
          <circle cx={r.cx} cy={y + 15} r={6.5} fill="#f2c14e" {...OUT} strokeWidth={1.6} />
          <path d={star4(r.cx, y + 15, 3)} fill="#fff" opacity={0.8} />
        </g>
      );
    case 'heart_collar':
      return (
        <g>
          {band(8, c)}
          <path d={heart(r.cx, y + 16, 7)} fill={shade(c, -0.15)} {...OUT} strokeWidth={1.6} />
        </g>
      );
    case 'bandana':
      return (
        <g>
          <path d={`M${r.cx - w - 2},${y - 3} Q${r.cx},${y + 8} ${r.cx + w + 2},${y - 3} L${r.cx},${y + 38}Z`} fill={c} {...OUT} />
          {[[-12, 6], [10, 8], [0, 18], [-4, 28], [8, 22]].map(([dx, dy], i) => (
            <circle key={i} cx={r.cx + dx} cy={y + dy} r={2.2} fill="#fff" />
          ))}
        </g>
      );
    case 'bell_ribbon':
      return (
        <g>
          {band(8, c)}
          <circle cx={r.cx} cy={y + 15} r={7} fill="#f2c14e" {...OUT} strokeWidth={1.6} />
          <path d={`M${r.cx - 5},${y + 17} L${r.cx + 5},${y + 17}`} stroke={INK} strokeWidth={1.4} />
          <circle cx={r.cx} cy={y + 20} r={1.6} fill={INK} />
          <path d={`M${r.cx - 2},${y + 4} l-10,-6 l1,10 Z M${r.cx + 2},${y + 4} l10,-6 l-1,10 Z`} fill={shade(c, -0.15)} {...OUT} strokeWidth={1.4} />
        </g>
      );
    case 'polka_bandana':
      return (
        <g>
          <path d={`M${r.cx - w - 2},${y - 3} Q${r.cx},${y + 8} ${r.cx + w + 2},${y - 3} L${r.cx},${y + 36}Z`} fill={c} {...OUT} />
          {[[-10, 5], [10, 6], [0, 16], [-2, 27]].map(([dx, dy], i) => (
            <circle key={i} cx={r.cx + dx} cy={y + dy} r={3.6} fill={shade(c, 0.55)} />
          ))}
          <path d={`M${r.cx + w - 2},${y - 2} l9,-4 l-2,9 Z`} fill={shade(c, -0.15)} {...OUT} strokeWidth={1.4} />
        </g>
      );
    case 'pearls':
      return (
        <g>
          {Array.from({ length: 11 }, (_, i) => {
            const t = i / 10;
            const x = r.cx - w + 2 * w * t;
            const yy = y + 2 + Math.sin(t * Math.PI) * 10;
            return <circle key={i} cx={x} cy={yy} r={4.4} fill={c} stroke={INK} strokeWidth={1.3} />;
          })}
        </g>
      );
    case 'bowtie':
      return (
        <g>
          <path d={`M${r.cx},${y + 8} L${r.cx - 20},${y - 2} L${r.cx - 20},${y + 18}Z M${r.cx},${y + 8} L${r.cx + 20},${y - 2} L${r.cx + 20},${y + 18}Z`} fill={c} {...OUT} />
          <rect x={r.cx - 5} y={y + 2} width={10} height={12} rx={3} fill={shade(c, -0.2)} {...OUT} strokeWidth={1.6} />
        </g>
      );
    case 'scarf':
      return (
        <g>
          {band(14, c)}
          <path d={`M${r.cx + 8},${y + 6} L${r.cx + 22},${y + 6} L${r.cx + 26},${y + 46} L${r.cx + 10},${y + 46}Z`} fill={shade(c, -0.08)} {...OUT} />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${r.cx + 12 + i * 4},${y + 46} l0,7`} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
          ))}
          <path d={`M${r.cx - w + 6},${y + 1} L${r.cx + w - 6},${y + 1}`} stroke={shade(c, 0.4)} strokeWidth={2} strokeDasharray="5 6" />
        </g>
      );
    default:
      return null;
  }
}

function HeadItem({ id, r, c, uid }: PieceProps & { id: string }) {
  const { cx, headCy: y, headR: R } = r;
  const top = y - R * 0.9;
  switch (id) {
    case 'party_hat':
      return (
        <g transform={`rotate(-12 ${cx + R * 0.25} ${top})`}>
          <clipPath id={`${uid}-ph`}>
            <path d={`M${cx + R * 0.25 - 24},${top + 8} L${cx + R * 0.25},${top - 58} L${cx + R * 0.25 + 24},${top + 8}Z`} />
          </clipPath>
          <path d={`M${cx + R * 0.25 - 24},${top + 8} L${cx + R * 0.25},${top - 58} L${cx + R * 0.25 + 24},${top + 8}Z`} fill={c} />
          <g clipPath={`url(#${uid}-ph)`}>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={cx - 40} y={top - 50 + i * 16} width={120} height={6} fill="#fff" opacity={0.8} transform={`rotate(-14 ${cx} ${top})`} />
            ))}
          </g>
          <path d={`M${cx + R * 0.25 - 24},${top + 8} L${cx + R * 0.25},${top - 58} L${cx + R * 0.25 + 24},${top + 8}Z`} fill="none" {...OUT} />
          <circle cx={cx + R * 0.25} cy={top - 60} r={8} fill="#f2c14e" {...OUT} />
        </g>
      );
    case 'bow':
      return (
        <g transform={`translate(${cx + R * 0.5} ${top + 10}) rotate(18)`}>
          <path d="M0,0 C-10,-22 -34,-20 -30,0 C-34,20 -10,22 0,0Z M0,0 C10,-22 34,-20 30,0 C34,20 10,22 0,0Z" fill={c} {...OUT} />
          <path d="M-20,-6 Q-14,0 -20,6 M20,-6 Q14,0 20,6" fill="none" stroke={shade(c, -0.25)} strokeWidth={2} />
          <circle r={7} fill={shade(c, -0.15)} {...OUT} />
        </g>
      );
    case 'flower_clip':
      return (
        <g transform={`translate(${cx + R * 0.55} ${top + R * 0.2})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={0} cy={-8} rx={6} ry={9} fill={c} stroke={INK} strokeWidth={1.4} transform={`rotate(${a})`} />
          ))}
          <circle r={5} fill="#f2c14e" stroke={INK} strokeWidth={1.4} />
          <path d="M-14,10 q-6,6 -14,4 M-8,14 q-2,8 -10,10" fill="none" stroke="#5fbf7a" strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case 'sun_hat':
      return (
        <g transform={`rotate(-6 ${cx} ${top})`}>
          <ellipse cx={cx} cy={top + 6} rx={R * 1.35} ry={R * 0.3} fill={c} {...OUT} />
          <path d={`M${cx - R * 0.58},${top + 6} Q${cx - R * 0.6},${top - R * 0.62} ${cx},${top - R * 0.64} Q${cx + R * 0.6},${top - R * 0.62} ${cx + R * 0.58},${top + 6}Z`} fill={shade(c, 0.12)} {...OUT} />
          <path d={`M${cx - R * 0.58},${top - 4} Q${cx},${top + 4} ${cx + R * 0.58},${top - 4}`} fill="none" stroke="#ff7eb6" strokeWidth={6} />
          <path d={`M${cx - R},${top + 10} Q${cx},${top + 18} ${cx + R},${top + 10}`} fill="none" stroke={shade(c, -0.2)} strokeWidth={1.4} strokeDasharray="3 4" />
        </g>
      );
    case 'headband':
      return (
        <g>
          <path d={`M${cx - R * 0.95},${y - R * 0.05} Q${cx - R * 0.9},${top - R * 0.2} ${cx},${top - R * 0.22} Q${cx + R * 0.9},${top - R * 0.2} ${cx + R * 0.95},${y - R * 0.05}`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <path d={`M${cx - R * 0.95},${y - R * 0.05} Q${cx - R * 0.9},${top - R * 0.2} ${cx},${top - R * 0.22} Q${cx + R * 0.9},${top - R * 0.2} ${cx + R * 0.95},${y - R * 0.05}`} fill="none" stroke={c} strokeWidth={6.5} strokeLinecap="round" />
          <g transform={`translate(${cx + R * 0.45} ${top - R * 0.08}) scale(0.6) rotate(20)`}>
            <path d="M0,0 C-10,-22 -34,-20 -30,0 C-34,20 -10,22 0,0Z M0,0 C10,-22 34,-20 30,0 C34,20 10,22 0,0Z" fill={shade(c, 0.3)} {...OUT} />
            <circle r={7} fill={shade(c, -0.15)} {...OUT} />
          </g>
        </g>
      );
    case 'beret':
      return (
        <g transform={`rotate(-14 ${cx} ${top})`}>
          <ellipse cx={cx + 6} cy={top + 2} rx={R * 0.82} ry={R * 0.3} fill={c} {...OUT} />
          <ellipse cx={cx + 2} cy={top + 10} rx={R * 0.6} ry={6} fill={shade(c, -0.2)} {...OUT} strokeWidth={1.6} />
          <path d={`M${cx + 6},${top - R * 0.3} l2,-10`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path
            d={`M${cx - 30},${top + 10} L${cx - 34},${top - 22} L${cx - 17},${top - 6} L${cx},${top - 30} L${cx + 17},${top - 6} L${cx + 34},${top - 22} L${cx + 30},${top + 10}Z`}
            fill={c}
            {...OUT}
          />
          <circle cx={cx} cy={top - 2} r={5} fill="#ff7eb6" stroke={INK} strokeWidth={1.4} />
          <circle cx={cx - 20} cy={top + 2} r={3.6} fill="#2ec4c0" stroke={INK} strokeWidth={1.2} />
          <circle cx={cx + 20} cy={top + 2} r={3.6} fill="#b48ef0" stroke={INK} strokeWidth={1.2} />
          <path d={star4(cx + 26, top - 30, 5)} fill="#fff" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d={`M${cx - R * 0.78},${top + R * 0.32} Q${cx - R * 0.8},${top - R * 0.42} ${cx},${top - R * 0.44} Q${cx + R * 0.8},${top - R * 0.42} ${cx + R * 0.78},${top + R * 0.32}Z`} fill={c} {...OUT} />
          <path d={`M${cx - R * 0.2},${top + R * 0.3} Q${cx - R * 1.3},${top + R * 0.24} ${cx - R * 1.32},${top + R * 0.44} Q${cx - R * 0.6},${top + R * 0.56} ${cx},${top + R * 0.36}Z`} fill={shade(c, -0.18)} {...OUT} />
          <circle cx={cx} cy={top - R * 0.44} r={5} fill={shade(c, -0.2)} {...OUT} strokeWidth={1.4} />
          <path d={`M${cx + R * 0.1},${top - R * 0.1} l14,-4`} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case 'flower_crown':
      return (
        <g>
          <path d={`M${cx - R * 0.9},${top + R * 0.42} Q${cx},${top - R * 0.2} ${cx + R * 0.9},${top + R * 0.42}`} fill="none" stroke="#5fbf7a" strokeWidth={4} />
          {Array.from({ length: 7 }, (_, i) => {
            const t = i / 6;
            const x = cx - R * 0.86 + R * 1.72 * t;
            const yy = top + R * 0.42 - Math.sin(t * Math.PI) * R * 0.54;
            const col = [c, '#f2c14e', '#b48ef0', '#ffffff'][i % 4];
            return (
              <g key={i}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <ellipse key={a} cx={x} cy={yy - 5} rx={3.6} ry={5.5} fill={col} stroke={INK} strokeWidth={1} transform={`rotate(${a} ${x} ${yy})`} />
                ))}
                <circle cx={x} cy={yy} r={2.8} fill="#f2c14e" />
              </g>
            );
          })}
        </g>
      );
    case 'beanie':
      return (
        <g>
          <path d={`M${cx - R * 0.86},${top + R * 0.42} Q${cx - R * 0.9},${top - R * 0.5} ${cx},${top - R * 0.52} Q${cx + R * 0.9},${top - R * 0.5} ${cx + R * 0.86},${top + R * 0.42}Z`} fill={c} {...OUT} />
          <rect x={cx - R * 0.92} y={top + R * 0.26} width={R * 1.84} height={14} rx={7} fill={shade(c, -0.15)} {...OUT} />
          {[-0.5, -0.2, 0.1, 0.4, 0.7].map((t) => (
            <path key={t} d={`M${cx + t * R - 6},${top + R * 0.3} l0,10`} stroke={shade(c, -0.35)} strokeWidth={2} />
          ))}
          <circle cx={cx} cy={top - R * 0.56} r={11} fill="#fbf8ff" {...OUT} />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d={`M${cx - R * 0.96},${y - R * 0.05} Q${cx - R},${top - R * 0.4} ${cx},${top - R * 0.4} Q${cx + R},${top - R * 0.4} ${cx + R * 0.96},${y - R * 0.05}`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <path d={`M${cx - R * 0.96},${y - R * 0.05} Q${cx - R},${top - R * 0.4} ${cx},${top - R * 0.4} Q${cx + R},${top - R * 0.4} ${cx + R * 0.96},${y - R * 0.05}`} fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" />
          {[-1, 1].map((s) => (
            <g key={s}>
              <rect x={cx + s * R * 0.98 - 11} y={y - R * 0.22} width={22} height={34} rx={10} fill={c} {...OUT} />
              <rect x={cx + s * R * 0.98 - 6} y={y - R * 0.14} width={12} height={20} rx={6} fill={shade(c, 0.45)} />
            </g>
          ))}
        </g>
      );
    case 'stage_bun':
      return (
        <g transform={`translate(${cx - R * 0.45} ${top + 8}) rotate(-16)`}>
          <path d="M0,0 C-8,-20 -30,-18 -26,0 C-30,18 -8,20 0,0Z M0,0 C8,-20 30,-18 26,0 C30,18 8,20 0,0Z" fill={c} {...OUT} />
          <path d="M-2,4 Q-10,30 -4,44 M2,4 Q12,28 8,42" fill="none" stroke={shade(c, -0.15)} strokeWidth={4} strokeLinecap="round" />
          <circle r={6} fill="#f2c14e" {...OUT} strokeWidth={1.4} />
          <path d={star4(-16, -14, 4)} fill="#fff" />
          <path d={star4(18, 10, 3.5)} fill="#fff" />
        </g>
      );
    default:
      return null;
  }
}

function EyesItem({ id, r, c }: PieceProps & { id: string }) {
  const { cx, headCy: y, headR: R } = r;
  const ey = y - R * 0.04;
  const dx = R * 0.38;
  switch (id) {
    case 'heart_glasses':
      return (
        <g>
          {[-1, 1].map((s) => (
            <path key={s} d={heart(cx + s * dx, ey + 1, R * 0.26)} fill={c} fillOpacity={0.75} {...OUT} />
          ))}
          <path d={`M${cx - dx * 0.45},${ey - 3} Q${cx},${ey - 9} ${cx + dx * 0.45},${ey - 3}`} fill="none" stroke={INK} strokeWidth={2.4} />
        </g>
      );
    case 'sunglasses':
      return (
        <g>
          {[-1, 1].map((s) => (
            <rect key={s} x={cx + s * dx - R * 0.27} y={ey - R * 0.17} width={R * 0.54} height={R * 0.36} rx={R * 0.14} fill={c} {...OUT} />
          ))}
          {[-1, 1].map((s) => (
            <path key={s} d={`M${cx + s * dx - R * 0.14},${ey - R * 0.08} l${R * 0.12},0`} stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
          ))}
          <path d={`M${cx - dx + R * 0.27},${ey - 2} Q${cx},${ey - 8} ${cx + dx - R * 0.27},${ey - 2}`} fill="none" stroke={INK} strokeWidth={2.6} />
        </g>
      );
    case 'round_glasses':
      return (
        <g>
          {[-1, 1].map((s) => (
            <circle key={s} cx={cx + s * dx} cy={ey} r={R * 0.24} fill="#ffffff" fillOpacity={0.25} stroke={c} strokeWidth={3.4} />
          ))}
          <path d={`M${cx - dx + R * 0.24},${ey - 2} Q${cx},${ey - 8} ${cx + dx - R * 0.24},${ey - 2}`} fill="none" stroke={c} strokeWidth={3} />
        </g>
      );
    case 'star_glasses':
      return (
        <g>
          {[-1, 1].map((s) => {
            const x = cx + s * dx;
            const pts = Array.from({ length: 10 }, (_, i) => {
              const a = (Math.PI / 5) * i - Math.PI / 2;
              const rr = i % 2 ? R * 0.14 : R * 0.32;
              return `${(x + Math.cos(a) * rr).toFixed(1)},${(ey + Math.sin(a) * rr).toFixed(1)}`;
            });
            return <polygon key={s} points={pts.join(' ')} fill={c} fillOpacity={0.7} {...OUT} />;
          })}
          <path d={`M${cx - dx * 0.4},${ey - 3} Q${cx},${ey - 8} ${cx + dx * 0.4},${ey - 3}`} fill="none" stroke={INK} strokeWidth={2.4} />
        </g>
      );
    default:
      return null;
  }
}

function Feet({ id, r, c }: PieceProps & { id: string }) {
  const legs = [-1, 1].map((s) => r.cx + s * r.legGap);
  const w = r.legW + 8;
  const legLen = r.bottom - r.legTop;
  switch (id) {
    case 'socks':
      return (
        <g>
          {legs.map((x) => (
            <g key={x}>
              <rect x={x - w / 2} y={r.bottom - legLen * 0.45} width={w} height={legLen * 0.45 + 6} rx={8} fill={c} {...OUT} />
              <path d={heart(x, r.bottom - legLen * 0.22, 4)} fill="#fff" />
              <rect x={x - w / 2} y={r.bottom - legLen * 0.45} width={w} height={6} rx={3} fill={shade(c, -0.2)} />
            </g>
          ))}
        </g>
      );
    case 'sneakers':
      return (
        <g>
          {legs.map((x) => (
            <g key={x}>
              <path d={`M${x - w / 2 - 2},${r.bottom + 6} L${x - w / 2},${r.bottom - 16} Q${x},${r.bottom - 22} ${x + w / 2},${r.bottom - 16} L${x + w / 2 + 2},${r.bottom + 6}Z`} fill={c} {...OUT} />
              <rect x={x - w / 2 - 3} y={r.bottom + 1} width={w + 6} height={7} rx={3.5} fill="#ff7eb6" {...OUT} strokeWidth={1.6} />
              <path d={`M${x - 5},${r.bottom - 12} l10,4 M${x - 5},${r.bottom - 6} l10,4`} stroke={INK} strokeWidth={1.6} />
            </g>
          ))}
        </g>
      );
    case 'boots':
      return (
        <g>
          {legs.map((x) => (
            <g key={x}>
              <rect x={x - w / 2} y={r.bottom - legLen * 0.62} width={w} height={legLen * 0.62 + 8} rx={7} fill={c} {...OUT} />
              <rect x={x - w / 2 - 2} y={r.bottom - legLen * 0.62} width={w + 4} height={8} rx={4} fill={shade(c, -0.2)} {...OUT} strokeWidth={1.6} />
              <rect x={x - w / 2 - 1} y={r.bottom + 2} width={w + 2} height={6} rx={3} fill={shade(c, -0.35)} />
            </g>
          ))}
        </g>
      );
    case 'ballet_shoes':
      return (
        <g>
          {legs.map((x) => (
            <g key={x}>
              <path d={`M${x - w / 2 + 2},${r.bottom - legLen * 0.5} L${x + w / 2 - 2},${r.bottom - legLen * 0.3} M${x + w / 2 - 2},${r.bottom - legLen * 0.5} L${x - w / 2 + 2},${r.bottom - legLen * 0.3}`} stroke={c} strokeWidth={3} strokeLinecap="round" />
              <path d={`M${x - w / 2 - 1},${r.bottom + 6} Q${x - w / 2 - 2},${r.bottom - 12} ${x},${r.bottom - 12} Q${x + w / 2 + 2},${r.bottom - 12} ${x + w / 2 + 1},${r.bottom + 6}Z`} fill={c} {...OUT} />
              <path d={`M${x - 4},${r.bottom - 8} q4,4 8,0`} fill="none" stroke="#fff" strokeWidth={1.8} />
            </g>
          ))}
        </g>
      );
    case 'legwarmers':
      return (
        <g>
          {legs.map((x) => (
            <g key={x}>
              <rect x={x - w / 2} y={r.bottom - legLen * 0.75} width={w} height={legLen * 0.55} rx={6} fill={c} {...OUT} />
              {[0.2, 0.4, 0.6, 0.8].map((t) => (
                <path key={t} d={`M${x - w / 2 + 2},${r.bottom - legLen * 0.75 + legLen * 0.55 * t} l${w - 4},0`} stroke={shade(c, -0.2)} strokeWidth={2} />
              ))}
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}

function BackItem({ id, r, c }: PieceProps & { id: string }) {
  const y = r.bodyTop + 10;
  switch (id) {
    case 'wings':
      return (
        <g opacity={0.92}>
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${r.cx + s * 10},${y + 6} C${r.cx + s * 70},${y - 70} ${r.cx + s * 112},${y - 22} ${r.cx + s * 86},${y + 26} C${r.cx + s * 70},${y + 46} ${r.cx + s * 30},${y + 30} ${r.cx + s * 10},${y + 6}Z`} fill={c} {...OUT} />
              <path d={`M${r.cx + s * 12},${y + 14} C${r.cx + s * 56},${y + 30} ${r.cx + s * 80},${y + 70} ${r.cx + s * 52},${y + 82} C${r.cx + s * 30},${y + 86} ${r.cx + s * 16},${y + 50} ${r.cx + s * 12},${y + 14}Z`} fill={shade(c, 0.35)} {...OUT} />
              <circle cx={r.cx + s * 70} cy={y - 8} r={7} fill="#fff" opacity={0.7} />
              <circle cx={r.cx + s * 46} cy={y + 56} r={5} fill="#fff" opacity={0.7} />
            </g>
          ))}
        </g>
      );
    case 'cape':
      return (
        <path
          d={`M${r.cx - hw(r, y) - 2},${r.neckY - 2} Q${r.cx - r.bw - 30},${r.bottom - 30} ${r.cx - r.bw - 26},${r.bottom + 8} Q${r.cx},${r.bottom + 22} ${r.cx + r.bw + 26},${r.bottom + 8} Q${r.cx + r.bw + 30},${r.bottom - 30} ${r.cx + hw(r, y) + 2},${r.neckY - 2}Z`}
          fill={c}
          {...OUT}
        />
      );
    case 'backpack':
      return <rect x={r.cx + hw(r, y + 30) - 6} y={y + 4} width={34} height={44} rx={10} fill={c} {...OUT} />;
    case 'big_bow': {
      // a big bow tied at the back; its loops and tails show on both sides of the body
      const by = r.legTop - 4;
      const bx = hw(r, by);
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${r.cx + s * (bx - 10)},${by} C${r.cx + s * (bx + 30)},${by - 40} ${r.cx + s * (bx + 54)},${by - 4} ${r.cx + s * (bx + 30)},${by + 18} C${r.cx + s * (bx + 14)},${by + 28} ${r.cx + s * bx},${by + 12} ${r.cx + s * (bx - 10)},${by}Z`} fill={c} {...OUT} />
              <path d={`M${r.cx + s * (bx + 4)},${by + 10} L${r.cx + s * (bx + 18)},${by + 56} L${r.cx + s * (bx + 30)},${by + 48} Z`} fill={shade(c, -0.12)} {...OUT} strokeWidth={1.6} />
            </g>
          ))}
        </g>
      );
    }
    default:
      return null;
  }
}

function BackFront({ id, r, c }: PieceProps & { id: string }) {
  if (id === 'backpack') {
    const y = r.neckY;
    return (
      <g fill="none" stroke={shade(c, -0.25)} strokeWidth={6} strokeLinecap="round">
        <path d={`M${r.cx - hw(r, y) + 4},${y} Q${r.cx - hw(r, y + 30) + 6},${y + 30} ${r.cx - hw(r, y + 50) + 2},${y + 52}`} />
        <path d={`M${r.cx + hw(r, y) - 4},${y} Q${r.cx + hw(r, y + 30) - 6},${y + 30} ${r.cx + hw(r, y + 50) - 2},${y + 52}`} />
      </g>
    );
  }
  if (id === 'cape') {
    const y = r.neckY;
    const w = hw(r, y) + 6;
    return <path d={`M${r.cx - w},${y - 4} Q${r.cx},${y + 12} ${r.cx + w},${y - 4} L${r.cx + w - 2},${y + 4} Q${r.cx},${y + 20} ${r.cx - w + 2},${y + 4}Z`} fill={shade(c, -0.2)} {...OUT} strokeWidth={1.6} />;
  }
  return null;
}

function Prop({ id, r, c }: PieceProps & { id: string }) {
  const hx = r.cx - r.bw - 14; // held at the dog's side (viewer's left)
  const hy = r.bottom - 34;
  switch (id) {
    case 'ribbon':
      return (
        <g>
          <path d={`M${hx + 10},${hy + 10} L${hx - 14},${hy - 46}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <path d={`M${hx + 10},${hy + 10} L${hx - 14},${hy - 46}`} stroke="#fbf8ff" strokeWidth={2.4} strokeLinecap="round" />
          <path
            className="prop-ribbon"
            d={`M${hx - 14},${hy - 46} C${hx - 50},${hy - 90} ${hx + 30},${hy - 120} ${hx - 10},${hy - 150} C${hx - 40},${hy - 170} ${hx + 50},${hy - 190} ${hx + 40},${hy - 200}`}
            fill="none"
            stroke={c}
            strokeWidth={7}
            strokeLinecap="round"
          />
        </g>
      );
    case 'handbag':
      return (
        <g>
          <path d={`M${hx - 18},${hy - 14} Q${hx - 2},${hy - 44} ${hx + 14},${hy - 14}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d={`M${hx - 18},${hy - 14} Q${hx - 2},${hy - 44} ${hx + 14},${hy - 14}`} fill="none" stroke={shade(c, -0.25)} strokeWidth={3} strokeLinecap="round" />
          <path d={`M${hx - 26},${hy - 14} L${hx + 22},${hy - 14} L${hx + 18},${hy + 20} Q${hx - 2},${hy + 26} ${hx - 22},${hy + 20}Z`} fill={c} {...OUT} />
          <path d={`M${hx - 24},${hy - 2} L${hx + 20},${hy - 2}`} stroke={shade(c, -0.2)} strokeWidth={2} />
          <circle cx={hx - 2} cy={hy - 2} r={3.6} fill="#f2c14e" stroke={INK} strokeWidth={1.2} />
        </g>
      );
    case 'bouquet':
      return (
        <g>
          {[-10, -2, 6].map((dx, i) => (
            <path key={i} d={`M${hx + dx * 0.4},${hy + 18} L${hx + dx},${hy - 22}`} stroke="#4f9e63" strokeWidth={3} strokeLinecap="round" />
          ))}
          {[[-14, -28, c], [0, -36, '#fbf8ff'], [12, -26, '#f2c14e'], [-4, -20, shade(c, 0.35)], [8, -40, c]].map(([dx, dy, col], i) => (
            <g key={i}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx={hx + (dx as number)} cy={hy + (dy as number) - 5} rx={3.6} ry={5.2} fill={col as string} stroke={INK} strokeWidth={1} transform={`rotate(${a} ${hx + (dx as number)} ${hy + (dy as number)})`} />
              ))}
              <circle cx={hx + (dx as number)} cy={hy + (dy as number)} r={2.4} fill="#f2c14e" />
            </g>
          ))}
          <path d={`M${hx - 12},${hy + 2} L${hx + 10},${hy + 2} L${hx + 4},${hy + 16} L${hx - 6},${hy + 16}Z`} fill="#ffe3ef" {...OUT} strokeWidth={1.6} />
        </g>
      );
    case 'hoop':
      return (
        <g>
          <circle cx={hx - 4} cy={hy - 30} r={40} fill="none" stroke={INK} strokeWidth={11} />
          <circle cx={hx - 4} cy={hy - 30} r={40} fill="none" stroke={c} strokeWidth={7} />
          <circle cx={hx - 4} cy={hy - 30} r={40} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="6 14" />
        </g>
      );
    case 'gym_ball':
      return (
        <g>
          <circle cx={hx - 4} cy={hy + 4} r={26} fill={c} {...OUT} />
          <path d={`M${hx - 22},${hy - 6} Q${hx - 4},${hy - 18} ${hx + 14},${hy - 8}`} fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.75} />
          <path d={star4(hx + 6, hy + 10, 4)} fill="#fff" />
        </g>
      );
    case 'clubs':
      return (
        <g>
          {[-10, 12].map((dx, i) => (
            <g key={i} transform={`rotate(${i ? 14 : -14} ${hx + dx} ${hy})`}>
              <path d={`M${hx + dx - 4},${hy + 20} L${hx + dx - 3},${hy - 18} Q${hx + dx - 13},${hy - 40} ${hx + dx},${hy - 60} Q${hx + dx + 13},${hy - 40} ${hx + dx + 3},${hy - 18} L${hx + dx + 4},${hy + 20}Z`} fill={c} {...OUT} />
              <circle cx={hx + dx} cy={hy + 22} r={5} fill={shade(c, -0.2)} {...OUT} strokeWidth={1.4} />
            </g>
          ))}
        </g>
      );
    case 'rope':
      return (
        <g>
          <path d={`M${hx + 4},${hy - 40} C${hx - 30},${hy + 70} ${2 * r.cx - hx + 30},${hy + 70} ${2 * r.cx - hx - 4},${hy - 40}`} fill="none" stroke={c} strokeWidth={4.5} strokeLinecap="round" />
          {[hx + 4, 2 * r.cx - hx - 4].map((x, i) => (
            <rect key={i} x={x - 5} y={hy - 58} width={10} height={20} rx={4} fill={shade(c, -0.25)} {...OUT} strokeWidth={1.6} />
          ))}
        </g>
      );
    case 'umbrella': {
      const ux = r.cx - 34;
      const uy = r.headCy - r.headR - 34;
      return (
        <g>
          <path d={`M${ux},${uy} L${hx + 6},${hy + 4}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d={`M${ux - 70},${uy + 14} Q${ux},${uy - 66} ${ux + 70},${uy + 14} Q${ux + 52},${uy + 2} ${ux + 35},${uy + 14} Q${ux + 17},${uy + 2} ${ux},${uy + 14} Q${ux - 17},${uy + 2} ${ux - 35},${uy + 14} Q${ux - 52},${uy + 2} ${ux - 70},${uy + 14}Z`} fill={c} {...OUT} />
          <path d={`M${ux},${uy - 26} L${ux},${uy + 12}`} stroke={shade(c, -0.25)} strokeWidth={2} />
        </g>
      );
    }
    default:
      return null;
  }
}

// ---------------- the dog ----------------

export interface DogFigureProps {
  dog: DogDef;
  outfit?: Outfit;
  className?: string;
  title?: string;
  /** render only the <g> (for embedding in a larger SVG) */
  asGroup?: boolean;
}

export const DOG_VIEWBOX = '-40 -60 320 330';

export function DogFigure({ dog, outfit = {}, className, title, asGroup }: DogFigureProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = rigFor(dog);
  const piece = (slot: Slot) => {
    const p = outfit[slot];
    if (!p || !wearableById(p.itemId)) return null;
    const item = wearableById(p.itemId)!;
    return { id: item.baseId ?? p.itemId, c: p.color ?? item.color };
  };
  const body = piece('body');
  const neck = piece('neck');
  const head = piece('head');
  const eyes = piece('eyes');
  const feet = piece('feet');
  const back = piece('back');
  const prop = piece('prop');
  const legs = [-1, 1].map((s) => r.cx + s * r.legGap);
  const pawColor = dog.pattern === 'chest' || dog.pattern === 'saddle' || dog.pattern === 'mask' ? dog.light : dog.fur;

  const g = (
    <g className="dog">
      {back && <BackItem id={back.id} r={r} c={back.c} uid={uid} />}
      <Tail dog={dog} r={r} />
      {dog.curly ? (
        <>
          {/* curly coat: a bumpy outline first, then the shapes without their smooth outline */}
          {[-1, 1].map((s) => (
            <CurlyRim key={s} cx={r.cx + s * (r.bw - 10)} cy={r.bottom - 20} rx={r.bw * 0.38} ry={20} n={9} bump={7} fill={dog.fur} />
          ))}
          {Array.from({ length: 6 }, (_, i) => {
            const y = r.bodyTop + 6 + i * ((r.bottom - 30 - r.bodyTop) / 5);
            return [-1, 1].map((s) => <circle key={`${i}${s}`} cx={r.cx + s * (hw(r, y) - 2)} cy={y} r={7.5} fill={dog.fur} {...OUT} strokeWidth={2} />);
          })}
          {[-1, 1].map((s) => (
            <ellipse key={s} cx={r.cx + s * (r.bw - 10)} cy={r.bottom - 20} rx={r.bw * 0.42} ry={24} fill={dog.fur} />
          ))}
          <path d={bodyPath(r)} fill={dog.fur} />
          <CurlMarks
            points={[[r.cx - r.bw * 0.6, r.bottom - 30], [r.cx + r.bw * 0.55, r.bottom - 24], [r.cx - 6, r.bodyTop + 26], [r.cx + 10, r.bodyTop + 44]]}
            s={4}
            color={dog.furDark}
          />
        </>
      ) : (
        <>
          {/* haunches */}
          {[-1, 1].map((s) => (
            <ellipse key={s} cx={r.cx + s * (r.bw - 10)} cy={r.bottom - 20} rx={r.bw * 0.42} ry={24} fill={dog.fur} {...OUT} />
          ))}
          <path d={bodyPath(r)} fill={dog.fur} {...OUT} />
        </>
      )}
      {(dog.pattern === 'chest' || dog.pattern === 'saddle' || dog.pattern === 'mask') && (
        <ellipse cx={r.cx} cy={r.bodyTop + (r.legTop - r.bodyTop) * 0.7} rx={r.tw * 0.85} ry={(r.legTop - r.bodyTop) * 0.55} fill={dog.light} />
      )}
      {dog.pattern === 'spots' && (
        <g fill={dog.furDark}>
          <circle cx={r.cx - r.bw * 0.5} cy={r.bottom - 50} r={5} />
          <circle cx={r.cx + r.bw * 0.45} cy={r.bottom - 40} r={6} />
          <circle cx={r.cx - r.bw * 0.8} cy={r.bottom - 18} r={4.5} />
          <circle cx={r.cx + r.bw * 0.82} cy={r.bottom - 14} r={5} />
          <circle cx={r.cx + 10} cy={r.bodyTop + 20} r={4} />
        </g>
      )}
      {dog.pattern === 'patch' && <ellipse cx={r.cx + r.bw * 0.5} cy={r.bottom - 34} rx={14} ry={10} fill={dog.furDark} opacity={0.8} />}
      {body && <BodyUnder id={body.id} r={r} c={body.c} uid={uid} />}
      {/* front legs */}
      {legs.map((x) => (
        <g key={x}>
          {dog.curly &&
            Array.from({ length: 4 }, (_, i) => {
              const y = r.legTop + 6 + i * ((r.bottom - r.legTop - 16) / 3);
              return [-1, 1].map((s) => <circle key={`${i}${s}`} cx={x + s * (r.legW / 2)} cy={y} r={5.5} fill={dog.fur} {...OUT} strokeWidth={1.8} />);
            })}
          <rect
            x={x - r.legW / 2}
            y={r.legTop}
            width={r.legW}
            height={r.bottom - r.legTop}
            rx={r.legW / 2}
            fill={dog.fur}
            {...(dog.curly ? {} : OUT)}
          />
          <ellipse cx={x} cy={r.bottom - 2} rx={r.legW * 0.66} ry={7.5} fill={pawColor} {...OUT} />
          <path d={`M${x - 3},${r.bottom - 6} l0,5 M${x + 3},${r.bottom - 6} l0,5`} stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
          {dog.pattern === 'spots' && <circle cx={x + 2} cy={r.legTop + 20} r={3.4} fill={dog.furDark} />}
        </g>
      ))}
      {feet && <Feet id={feet.id} r={r} c={feet.c} uid={uid} />}
      {body && <BodyOver id={body.id} r={r} c={body.c} uid={uid} />}
      {back && <BackFront id={back.id} r={r} c={back.c} uid={uid} />}
      {neck && <Neck id={neck.id} r={r} c={neck.c} uid={uid} />}
      <Ears dog={dog} r={r} front={false} />
      <Head dog={dog} r={r} />
      <Ears dog={dog} r={r} front />
      {head && <HeadItem id={head.id} r={r} c={head.c} uid={uid} />}
      {eyes && <EyesItem id={eyes.id} r={r} c={eyes.c} uid={uid} />}
      {prop && <Prop id={prop.id} r={r} c={prop.c} uid={uid} />}
      {outfit.head && wearableById(outfit.head!.itemId)?.rare && <VariantDecal x={[r.cx + 15, r.headCy - r.headR - 8][0]} y={[r.cx + 15, r.headCy - r.headR - 8][1]} rare />}
      {outfit.eyes && wearableById(outfit.eyes!.itemId)?.rare && <VariantDecal x={[r.cx + 24, r.headCy - 4][0]} y={[r.cx + 24, r.headCy - 4][1]} rare />}
      {outfit.neck && wearableById(outfit.neck!.itemId)?.rare && <VariantDecal x={[r.cx, r.neckY + 10][0]} y={[r.cx, r.neckY + 10][1]} rare />}
      {outfit.body && wearableById(outfit.body!.itemId)?.rare && <VariantDecal x={[r.cx, r.bodyTop + 38][0]} y={[r.cx, r.bodyTop + 38][1]} rare />}
      {outfit.feet && wearableById(outfit.feet!.itemId)?.rare && <VariantDecal x={[r.cx + r.legGap, r.bottom - 12][0]} y={[r.cx + r.legGap, r.bottom - 12][1]} rare />}
      {outfit.back && wearableById(outfit.back!.itemId)?.rare && <VariantDecal x={[r.cx + r.bw + 8, r.bodyTop + 25][0]} y={[r.cx + r.bw + 8, r.bodyTop + 25][1]} rare />}
      {outfit.prop && wearableById(outfit.prop!.itemId)?.rare && <VariantDecal x={[r.cx + r.bw + 30, r.bodyTop + 55][0]} y={[r.cx + r.bw + 30, r.bodyTop + 55][1]} rare />}
    </g>
  );
  if (asGroup) return g;
  return (
    <svg className={className} viewBox={DOG_VIEWBOX} role="img" aria-label={title ?? `${dog.name}, ${dog.breed}`}>
      {g}
    </svg>
  );
}
