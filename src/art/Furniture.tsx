// Original studio furniture. Each piece is drawn around (0,0) = bottom-centre, growing upwards.

import type { ReactNode } from 'react';
import { furnitureById, type Palette } from '../content/catalog';
import { HouseholdFurniture } from './HouseholdFurniture';
import { VariantDecal } from './VariantDecal';
import { EXTRA_FURNITURE_ART } from './extraArt';
import { WaterStream } from './extra/studioArt';
import { shade } from './color';
import { INK, LINE } from './style';
import './interactive.css';

const O = { stroke: INK, strokeWidth: LINE.base, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Running-water overlays for taps drawn elsewhere: spout tip x, spout y, basin water y. */
const TAP_STREAMS: Record<string, [number, number, number]> = {
  bath_sink: [15, -108, -92],
  kitchen_sink: [4, -117, -93],
  kitchen_sink_counter: [-1, -138, -111],
};

function star(x: number, y: number, s: number, fill = '#fff') {
  return <path d={`M${x},${y - s} Q${x + s * 0.2},${y - s * 0.2} ${x + s},${y} Q${x + s * 0.2},${y + s * 0.2} ${x},${y + s} Q${x - s * 0.2},${y + s * 0.2} ${x - s},${y} Q${x - s * 0.2},${y - s * 0.2} ${x},${y - s}Z`} fill={fill} />;
}

/**
 * `color` (optional) replaces the main colour of the piece.
 * `state` (optional) is the interactive state of the piece (see content/interactive.ts), e.g.
 * 'on' for lamps/TV/radio/taps, 'pour' for the watering can, 'dry' | 'watered' | 'bloom' for plants.
 * Leaving it out draws the resting look. Variants pass it on to their original drawing.
 */
export function FurnitureArt({ id, p, color, state }: { id: string; p: Palette; color?: string; state?: string }): ReactNode {
  const item = furnitureById(id);
  if (item?.baseId) return <g data-content-id={id}><FurnitureArt id={item.baseId} p={p} color={color ?? item.color} state={state} /><VariantDecal x={0} y={-item.h * (item.kind === 'rug' ? 0.45 : 0.4)} rare={item.rare} color={color ?? item.color} /></g>;
  const a = color ?? item?.color ?? p.accent;
  const b = color ? shade(color, -0.2) : p.accent2;
  const tap = state === 'on' ? TAP_STREAMS[id] : undefined;
  const stream = tap && <WaterStream x={tap[0]} y1={tap[1]} y2={tap[2]} />;
  const household = HouseholdFurniture({ id, a, b });
  if (household) return stream ? <g data-state={state}>{household}{stream}</g> : household;
  const extra = EXTRA_FURNITURE_ART[id];
  if (extra) return <g data-content-id={id} data-state={state}>{extra({ p, a, b, state })}{stream}</g>;
  switch (id) {
    case 'vanity':
      return (
        <g>
          <ellipse cx={0} cy={-150} rx={46} ry={40} fill="#f2c14e" {...O} />
          <ellipse cx={0} cy={-150} rx={36} ry={30} fill="#d9f3f6" />
          <path d="M-14,-162 l16,-14 M-6,-152 l16,-14" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          {[-150, -100, -50, 0, 50, 100, 150].map((deg) => {
            const t = (deg * Math.PI) / 180 - Math.PI / 2;
            return <circle key={deg} cx={Math.cos(t) * 54} cy={-150 + Math.sin(t) * 48} r={4.5} fill="#fff3c4" stroke={INK} strokeWidth={1.2} />;
          })}
          <rect x={-68} y={-112} width={136} height={16} rx={6} fill={shade(a, 0.45)} {...O} />
          <rect x={-62} y={-96} width={44} height={46} rx={6} fill={shade(a, 0.6)} {...O} />
          <rect x={18} y={-96} width={44} height={46} rx={6} fill={shade(a, 0.6)} {...O} />
          <circle cx={-40} cy={-73} r={3} fill={INK} />
          <circle cx={40} cy={-73} r={3} fill={INK} />
          <path d="M-56,-50 L-56,0 M56,-50 L56,0" {...O} strokeWidth={5} />
          <rect x={-30} y={-126} width={10} height={14} rx={3} fill="#ff9ec4" {...O} strokeWidth={1.4} />
          <circle cx={22} cy={-120} r={7} fill={b} {...O} strokeWidth={1.4} />
        </g>
      );
    case 'chandelier':
      return (
        <g>
          <path d="M0,-120 L0,-80" {...O} />
          <path d="M-56,-40 Q0,-10 56,-40" fill="none" {...O} strokeWidth={4} />
          <ellipse cx={0} cy={-66} rx={30} ry={16} fill={color ?? "#f2c14e"} {...O} />
          {[-56, -28, 0, 28, 56].map((x, i) => (
            <g key={x}>
              <path d={`M${x},${-40 + Math.abs(x) * 0.2} l0,${18 + (i % 2) * 8}`} {...O} strokeWidth={1.6} />
              <path d={`M${x - 6},${-22 + (i % 2) * 8 + Math.abs(x) * 0.2} L${x},${-6 + (i % 2) * 8 + Math.abs(x) * 0.2} L${x + 6},${-22 + (i % 2) * 8 + Math.abs(x) * 0.2} L${x},${-32 + (i % 2) * 8 + Math.abs(x) * 0.2}Z`} fill={color ? shade(color, 0.7) : "#d9f3f6"} {...O} strokeWidth={1.6} />
              <rect x={x - 4} y={-58 + Math.abs(x) * 0.2} width={8} height={16} rx={2} fill="#fff" {...O} strokeWidth={1.4} />
              <ellipse cx={x} cy={-62 + Math.abs(x) * 0.2} rx={3} ry={5} fill="#ffcf5c" />
            </g>
          ))}
        </g>
      );
    case 'string_lights':
      return (
        <g>
          <path d="M-130,-50 Q-65,-10 0,-40 Q65,-10 130,-50" fill="none" stroke={INK} strokeWidth={2} />
          {Array.from({ length: 11 }, (_, i) => {
            const x = -120 + i * 24;
            const t = (x + 130) / 130;
            const y = t <= 1 ? -50 + Math.sin(t * Math.PI) * 26 : -40 + Math.sin((t - 1) * Math.PI) * 26 - 10 * (t - 1);
            const col = [a, b, '#ff9ec4', '#f2c14e'][i % 4];
            return (
              <g key={i}>
                <circle cx={x} cy={y + 12} r={10} fill={col} opacity={0.25} />
                <ellipse cx={x} cy={y + 10} rx={5} ry={8} fill={col} stroke={INK} strokeWidth={1.4} />
              </g>
            );
          })}
        </g>
      );
    case 'clothes_rack':
      return (
        <g>
          <path d="M-80,0 L-80,-170 L80,-170 L80,0" fill="none" stroke={INK} strokeWidth={6} />
          <path d="M-80,0 L-80,-170 L80,-170 L80,0" fill="none" stroke="#e8d9f8" strokeWidth={3} />
          <path d="M-96,0 l32,0 M64,0 l32,0" {...O} strokeWidth={5} />
          {[[-56, a], [-18, '#ff9ec4'], [20, b], [56, '#f2c14e']].map(([x, c], i) => (
            <g key={i}>
              <path d={`M${x},-170 l0,8 l-18,10 l36,0 l-18,-10`} fill="none" stroke={INK} strokeWidth={1.8} />
              <path d={`M${(x as number) - 18},-152 L${(x as number) - 22},${-92 + i * 6} L${(x as number) + 22},${-92 + i * 6} L${(x as number) + 18},-152Z`} fill={c as string} {...O} strokeWidth={1.8} />
            </g>
          ))}
        </g>
      );
    case 'mannequin':
      return (
        <g>
          <path d="M-22,0 l22,-10 l22,10" fill="none" {...O} strokeWidth={4} />
          <rect x={-3} y={-60} width={6} height={52} fill={INK} />
          <path d="M-30,-170 Q-36,-120 -24,-60 L24,-60 Q36,-120 30,-170 Q0,-180 -30,-170Z" fill="#f4e7d8" {...O} />
          <path d="M-31,-150 Q-40,-110 -30,-62 L30,-62 Q40,-110 31,-150 Q0,-136 -31,-150Z" fill="#ff9ec4" {...O} />
          <path d="M-26,-150 Q0,-130 26,-150" fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="4 5" />
          <rect x={-8} y={-188} width={16} height={18} rx={6} fill="#f4e7d8" {...O} />
        </g>
      );
    case 'bowl':
      return (
        <g>
          <path d="M-28,-24 L28,-24 L22,0 L-22,0Z" fill={b} {...O} />
          <ellipse cx={0} cy={-24} rx={28} ry={6} fill={shade(b, -0.2)} {...O} strokeWidth={1.8} />
          <path d="M-10,-10 a4,4 0 1,1 0.1,0 M6,-10 l6,0" stroke="#fff" strokeWidth={2.4} fill="none" />
        </g>
      );
    case 'bathtub':
      return (
        <g>
          <path d="M-70,-62 L70,-62 Q66,-6 40,-8 L-40,-8 Q-66,-6 -70,-62Z" fill="#fbf8ff" {...O} />
          <rect x={-76} y={-72} width={152} height={14} rx={7} fill={shade(b, 0.2)} {...O} />
          <path d="M-46,-8 l-6,8 M46,-8 l6,8" {...O} strokeWidth={5} />
          {[[-40, -84, 14], [-14, -92, 18], [14, -86, 13], [40, -90, 16], [0, -78, 10]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" stroke="#bfe7f0" strokeWidth={2} />
          ))}
          <path d="M56,-72 L56,-104 Q56,-112 48,-112 L40,-112" fill="none" {...O} strokeWidth={4} />
        </g>
      );
    case 'runway':
      return (
        <g>
          <path d="M-150,-4 L150,-4 L130,-56 L-130,-56Z" fill={shade(a, 0.5)} {...O} />
          <path d="M-142,-20 L142,-20" stroke="#fff" strokeWidth={3} strokeDasharray="10 8" />
          {[-120, -60, 0, 60, 120].map((x) => (
            <g key={x}>{star(x, -38, 6, '#fff')}</g>
          ))}
        </g>
      );
    case 'sewing':
      return (
        <g>
          <rect x={-72} y={-74} width={144} height={14} rx={5} fill="#c98f62" {...O} />
          <path d="M-62,-60 L-62,0 M62,-60 L62,0" {...O} strokeWidth={6} />
          <path d="M-36,-74 L-36,-118 Q-36,-128 -26,-128 L36,-128 Q46,-128 46,-118 L46,-100 L30,-100 L30,-88 L22,-88 L22,-74" fill="#fbf8ff" {...O} />
          <rect x={-30} y={-122} width={30} height={10} rx={3} fill={a} />
          <circle cx={-48} cy={-84} r={10} fill="#ff9ec4" {...O} strokeWidth={1.6} />
          <path d="M-56,-90 l16,12" stroke="#fff" strokeWidth={1.4} />
        </g>
      );
    case 'window':
      return (
        <g>
          <path d="M-66,0 L-66,-110 A66,66 0 0,1 66,-110 L66,0Z" fill="#fff" {...O} />
          <path d="M-56,-8 L-56,-110 A56,56 0 0,1 56,-110 L56,-8Z" fill="#bfe8ff" />
          <circle cx={26} cy={-120} r={12} fill="#fff3c4" />
          <path d="M-56,-40 Q-20,-70 10,-44 Q36,-64 56,-46 L56,-8 L-56,-8Z" fill="#9fd9a9" />
          <path d="M0,-8 L0,-166 M-56,-90 L56,-90" stroke="#fff" strokeWidth={6} />
          <rect x={-76} y={-6} width={152} height={10} rx={4} fill="#fff" {...O} />
        </g>
      );
    case 'neon':
      return (
        <g>
          <rect x={-88} y={-66} width={176} height={60} rx={14} fill={shade(a, -0.55)} {...O} />
          <text x={0} y={-26} textAnchor="middle" fontSize={26} fontWeight={700} fill="#ffd6ec" stroke="#ff7eb6" strokeWidth={1} fontFamily="Rubik, Arial, sans-serif">
            סטודיו
          </text>
          <path d={`M-70,-20 l10,0 M60,-20 l10,0`} stroke={b} strokeWidth={3} strokeLinecap="round" />
          {star(-64, -48, 6, '#ffd6ec')}
          {star(64, -48, 6, '#ffd6ec')}
        </g>
      );
    case 'gym_mat':
      return (
        <g>
          <path d="M-126,-6 L126,-6 L116,-54 L-116,-54Z" fill={shade(b, 0.35)} {...O} />
          <path d="M-40,-6 L-38,-54 M40,-6 L38,-54" stroke={shade(b, 0.05)} strokeWidth={2} />
          <path d="M-100,-30 C-70,-56 -50,-6 -20,-30 C10,-56 30,-6 60,-30 C80,-46 96,-30 104,-30" fill="none" stroke="#ff7eb6" strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case 'dressing_table':
      return (
        <g>
          <rect x={-40} y={-168} width={80} height={86} rx={40} fill="#fff" {...O} />
          <rect x={-31} y={-159} width={62} height={68} rx={31} fill="#d9f3f6" />
          <path d="M-10,-140 l14,-12 M-4,-128 l14,-12" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          <rect x={-62} y={-84} width={124} height={14} rx={6} fill={shade(a, 0.5)} {...O} />
          <rect x={-56} y={-70} width={112} height={30} rx={6} fill="#fff" {...O} />
          <circle cx={-28} cy={-55} r={3} fill={a} />
          <circle cx={28} cy={-55} r={3} fill={a} />
          <path d="M-50,-40 L-46,0 M50,-40 L46,0" {...O} strokeWidth={5} />
          <circle cx={36} cy={-92} r={7} fill={shade(a, 0.2)} {...O} strokeWidth={1.4} />
          <rect x={-44} y={-100} width={10} height={16} rx={3} fill="#ff9ec4" {...O} strokeWidth={1.4} />
        </g>
      );
    case 'hat_rack':
      return (
        <g>
          <path d="M-24,0 L0,-12 L24,0" fill="none" {...O} strokeWidth={4} />
          <rect x={-3} y={-160} width={6} height={150} fill="#a87445" />
          <path d="M0,-150 l-24,-8 M0,-150 l24,-8 M0,-120 l-22,-6 M0,-120 l22,-6" {...O} strokeWidth={4} />
          <ellipse cx={-24} cy={-156} rx={20} ry={6} fill={a} {...O} strokeWidth={1.6} />
          <path d="M-36,-156 Q-24,-178 -12,-156" fill={a} {...O} strokeWidth={1.6} />
          <path d="M22,-126 q-8,24 2,40" fill="none" stroke="#ff7eb6" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    case 'star_garland':
      return (
        <g>
          <path d="M-120,-50 Q0,-6 120,-50" fill="none" stroke={INK} strokeWidth={2} />
          {Array.from({ length: 9 }, (_, i) => {
            const x = -104 + i * 26;
            const y = -50 + Math.sin(((x + 120) / 240) * Math.PI) * 22;
            const col = [a, '#f2c14e', '#ff9ec4'][i % 3];
            return (
              <g key={i}>
                <path d={`M${x},${y} L${x},${y + 3}`} stroke={INK} strokeWidth={1.4} />
                {star(x, y + 12, 10, col)}
              </g>
            );
          })}
        </g>
      );
    case 'heart_wall':
      return (
        <g>
          {([[-36, -50, 22, a], [10, -62, 30, '#ff9ec4'], [44, -34, 16, shade(a, 0.4)], [-6, -22, 14, '#f2c14e']] as [number, number, number, string][]).map(([X, Y, sz, col], i) => {
            const S = sz / 2;
            return (
              <path
                key={i}
                d={`M${X},${Y + S * 0.9} C${X - S * 1.4},${Y - S * 0.1} ${X - S * 0.7},${Y - S * 1.2} ${X},${Y - S * 0.4} C${X + S * 0.7},${Y - S * 1.2} ${X + S * 1.4},${Y - S * 0.1} ${X},${Y + S * 0.9}Z`}
                fill={col}
                {...O}
                strokeWidth={1.8}
              />
            );
          })}
        </g>
      );
    case 'paw_poster':
      return (
        <g>
          <rect x={-38} y={-98} width={76} height={96} rx={8} fill={shade(a, 0.6)} {...O} />
          <ellipse cx={0} cy={-38} rx={14} ry={11} fill={a} />
          {[[-16, -58], [-6, -66], [6, -66], [16, -58]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx={5.5} ry={7} fill={a} />
          ))}
          <rect x={-24} y={-20} width={48} height={7} rx={3.5} fill={shade(a, 0.2)} />
        </g>
      );
    case 'ribbon_stand':
      return (
        <g>
          <rect x={-50} y={-8} width={100} height={8} rx={4} fill="#c98f62" {...O} />
          <path d="M-40,-8 L-40,-150 M40,-8 L40,-150 M-46,-150 L46,-150" {...O} strokeWidth={5} />
          <circle cx={-14} cy={-110} r={30} fill="none" stroke={INK} strokeWidth={8} />
          <circle cx={-14} cy={-110} r={30} fill="none" stroke={b} strokeWidth={5} />
          <path d="M20,-150 C40,-120 0,-100 26,-70 C44,-50 10,-40 22,-20" fill="none" stroke="#ff7eb6" strokeWidth={5} strokeLinecap="round" />
          <circle cx={-20} cy={-26} r={14} fill={a} {...O} strokeWidth={1.8} />
        </g>
      );
    default:
      return null;
  }
}

export function FurnitureThumb({ id, p, color }: { id: string; p: Palette; color?: string }) {
  const f = furnitureById(id);
  if (!f) return null;
  // A square cell centred on the item's box, so every piece sits big and centred in the menu.
  const side = Math.max(f.w, f.h) * 1.12 + 8;
  return (
    <svg viewBox={`${-side / 2} ${-f.h / 2 - side / 2} ${side} ${side}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={f.name}>
      <FurnitureArt id={id} p={p} color={color} />
    </svg>
  );
}
