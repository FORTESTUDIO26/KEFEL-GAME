// Original studio furniture. Each piece is drawn around (0,0) = bottom-centre, growing upwards.

import type { ReactNode } from 'react';
import { furnitureById, type Palette } from '../content/catalog';
import { VariantDecal } from './VariantDecal';
import { INK, shade } from './color';

const O = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function star(x: number, y: number, s: number, fill = '#fff') {
  return <path d={`M${x},${y - s} Q${x + s * 0.2},${y - s * 0.2} ${x + s},${y} Q${x + s * 0.2},${y + s * 0.2} ${x},${y + s} Q${x - s * 0.2},${y + s * 0.2} ${x - s},${y} Q${x - s * 0.2},${y - s * 0.2} ${x},${y - s}Z`} fill={fill} />;
}

function Mirror({ w, h }: { w: number; h: number }) {
  return (
    <g>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={w / 2} fill="#f2c14e" {...O} />
      <rect x={-w / 2 + 8} y={-h + 8} width={w - 16} height={h - 16} rx={(w - 16) / 2} fill="#d9f3f6" />
      <path d={`M${-w / 4},${-h * 0.75} l${w / 3},-${w / 3} M${-w / 4 + 6},${-h * 0.62} l${w / 3},-${w / 3}`} stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
    </g>
  );
}

/** `color` (optional) replaces the main colour of the piece. */
export function FurnitureArt({ id, p, color }: { id: string; p: Palette; color?: string }): ReactNode {
  const item = furnitureById(id);
  if (item?.baseId) return <g data-content-id={id}><FurnitureArt id={item.baseId} p={p} color={color ?? item.color} /><VariantDecal x={0} y={-item.h * (item.kind === 'rug' ? 0.45 : 0.4)} rare={item.rare} color={color ?? item.color} /></g>;
  const a = color ?? item?.color ?? p.accent;
  const b = color ? shade(color, -0.2) : p.accent2;
  switch (id) {
    case 'sofa':
      return (
        <g>
          <rect x={-100} y={-10} width={10} height={12} rx={3} fill={INK} />
          <rect x={90} y={-10} width={10} height={12} rx={3} fill={INK} />
          <rect x={-95} y={-110} width={190} height={70} rx={30} fill={shade(a, 0.35)} {...O} />
          <rect x={-105} y={-70} width={210} height={62} rx={22} fill={shade(a, 0.2)} {...O} />
          <rect x={-112} y={-82} width={36} height={76} rx={18} fill={shade(a, 0.3)} {...O} />
          <rect x={76} y={-82} width={36} height={76} rx={18} fill={shade(a, 0.3)} {...O} />
          <rect x={-60} y={-104} width={48} height={40} rx={14} fill={b} {...O} transform="rotate(-8 -36 -84)" />
          <rect x={14} y={-102} width={44} height={38} rx={14} fill="#ff9ec4" {...O} transform="rotate(7 36 -83)" />
        </g>
      );
    case 'armchair':
      return (
        <g>
          <rect x={-50} y={-125} width={100} height={80} rx={34} fill={shade(b, 0.3)} {...O} />
          <rect x={-58} y={-66} width={116} height={56} rx={20} fill={shade(b, 0.15)} {...O} />
          <rect x={-60} y={-78} width={22} height={66} rx={11} fill={shade(b, 0.25)} {...O} />
          <rect x={38} y={-78} width={22} height={66} rx={11} fill={shade(b, 0.25)} {...O} />
          <path d="M-46,-10 l-4,10 M46,-10 l4,10" {...O} strokeWidth={5} />
          <circle cx={0} cy={-92} r={4} fill={shade(b, -0.2)} />
        </g>
      );
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
    case 'mirror_tall':
      return (
        <g>
          <Mirror w={84} h={196} />
          <path d="M-30,0 l-10,6 M30,0 l10,6" {...O} strokeWidth={5} />
        </g>
      );
    case 'mirror_round':
      return (
        <g>
          <circle cx={0} cy={-50} r={48} fill="#f2c14e" {...O} />
          {Array.from({ length: 12 }, (_, i) => {
            const t = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={Math.cos(t) * 48} cy={-50 + Math.sin(t) * 48} r={6} fill="#f2c14e" {...O} strokeWidth={1.6} />;
          })}
          <circle cx={0} cy={-50} r={38} fill="#d9f3f6" {...O} strokeWidth={1.6} />
          <path d="M-18,-62 l18,-16 M-10,-50 l18,-16" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
        </g>
      );
    case 'floor_lamp':
      return (
        <g>
          <ellipse cx={0} cy={-4} rx={26} ry={7} fill={INK} />
          <rect x={-3} y={-160} width={6} height={156} fill={INK} />
          <path d="M-34,-150 L-22,-208 L22,-208 L34,-150Z" fill={shade(a, 0.5)} {...O} />
          <ellipse cx={0} cy={-128} rx={46} ry={22} fill="#fff3c4" opacity={0.45} />
          <path d="M-30,-168 L30,-168" stroke={a} strokeWidth={3} />
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
    case 'rug_round':
      return (
        <g>
          <ellipse cx={0} cy={-34} rx={128} ry={34} fill={shade(a, 0.45)} {...O} />
          <ellipse cx={0} cy={-34} rx={98} ry={24} fill={shade(a, 0.62)} />
          <ellipse cx={0} cy={-34} rx={64} ry={14} fill={shade(b, 0.55)} />
        </g>
      );
    case 'rug_stripes':
      return (
        <g>
          <clipPath id="rugstripes-clip">
            <rect x={-138} y={-66} width={276} height={62} rx={12} />
          </clipPath>
          <rect x={-138} y={-66} width={276} height={62} rx={12} fill={shade(b, 0.55)} />
          <g clipPath="url(#rugstripes-clip)">
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={-138 + i * 30} y={-66} width={14} height={62} fill={i % 2 ? shade(a, 0.45) : '#fff'} opacity={0.8} />
            ))}
          </g>
          <rect x={-138} y={-66} width={276} height={62} rx={12} fill="none" {...O} />
        </g>
      );
    case 'plant_monstera':
      return (
        <g>
          {[[-30, -120, -30], [26, -128, 25], [0, -140, 0], [-36, -86, -55], [34, -90, 55]].map(([x, y, r], i) => (
            <g key={i} transform={`rotate(${r} ${x} ${y + 30})`}>
              <path d={`M${x},${y + 40} C${x - 30},${y + 20} ${x - 26},${y - 20} ${x},${y - 14} C${x + 26},${y - 20} ${x + 30},${y + 20} ${x},${y + 40}Z`} fill={i % 2 ? '#4cae6e' : '#5fbf7a'} {...O} />
              <path d={`M${x},${y + 36} L${x},${y - 6} M${x - 14},${y + 6} l10,6 M${x + 14},${y + 6} l-10,6`} stroke="#2f7a4a" strokeWidth={2} />
            </g>
          ))}
          <path d="M-34,-54 L34,-54 L26,0 L-26,0Z" fill={shade(a, 0.3)} {...O} />
          <rect x={-38} y={-60} width={76} height={12} rx={5} fill={shade(a, 0.15)} {...O} />
        </g>
      );
    case 'plant_cactus':
      return (
        <g>
          <rect x={-12} y={-88} width={24} height={60} rx={12} fill="#5fbf7a" {...O} />
          <path d="M-12,-56 q-14,0 -14,-14 l0,-8" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
          <path d="M-12,-56 q-14,0 -14,-14 l0,-8" fill="none" stroke="#5fbf7a" strokeWidth={8} strokeLinecap="round" />
          <circle cx={0} cy={-90} r={6} fill="#ff9ec4" {...O} strokeWidth={1.4} />
          <path d="M-24,-34 L24,-34 L18,0 L-18,0Z" fill={b} {...O} />
        </g>
      );
    case 'shelf':
      return (
        <g>
          <rect x={-84} y={-14} width={168} height={10} rx={4} fill="#c98f62" {...O} />
          <path d="M-60,-4 l0,10 M60,-4 l0,10" {...O} strokeWidth={4} />
          {[[-70, 30, a], [-36, 38, b], [-2, 26, '#ff9ec4'], [30, 34, '#f2c14e']].map(([x, h, c], i) => (
            <rect key={i} x={x as number} y={-14 - (h as number)} width={30} height={h as number} rx={6} fill={c as string} {...O} strokeWidth={1.8} />
          ))}
          <rect x={-84} y={-80} width={168} height={10} rx={4} fill="#c98f62" {...O} />
          <circle cx={-50} cy={-92} r={12} fill={shade(b, 0.3)} {...O} strokeWidth={1.8} />
          <rect x={10} y={-104} width={40} height={24} rx={4} fill={shade(a, 0.4)} {...O} strokeWidth={1.8} />
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
    case 'dog_bed':
      return (
        <g>
          <ellipse cx={0} cy={-22} rx={64} ry={24} fill={shade(a, 0.25)} {...O} />
          <ellipse cx={0} cy={-26} rx={46} ry={14} fill={shade(a, 0.6)} />
          <path d="M-20,-30 l6,-4 l6,4 M8,-28 l6,-4 l6,4" fill="none" stroke={shade(a, 0.1)} strokeWidth={2} />
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
    case 'poster':
      return (
        <g>
          <rect x={-44} y={-118} width={88} height={116} rx={6} fill={shade(b, 0.55)} {...O} />
          <circle cx={0} cy={-70} r={24} fill="#e2a65b" {...O} strokeWidth={1.8} />
          <ellipse cx={-22} cy={-72} rx={8} ry={14} fill="#b97b37" {...O} strokeWidth={1.4} />
          <ellipse cx={22} cy={-72} rx={8} ry={14} fill="#b97b37" {...O} strokeWidth={1.4} />
          <circle cx={-8} cy={-74} r={3} fill={INK} />
          <circle cx={8} cy={-74} r={3} fill={INK} />
          <ellipse cx={0} cy={-64} rx={4} ry={3} fill={INK} />
          <rect x={-30} y={-34} width={60} height={8} rx={4} fill={a} />
          <rect x={-20} y={-20} width={40} height={6} rx={3} fill={shade(a, 0.4)} />
        </g>
      );
    case 'frame':
      return (
        <g>
          <rect x={-38} y={-92} width={76} height={90} rx={4} fill="#c98f62" {...O} />
          <rect x={-28} y={-82} width={56} height={70} fill="#fff7ec" />
          <path d="M-28,-24 L-10,-46 L4,-30 L14,-40 L28,-24 L28,-12 L-28,-12Z" fill={shade(b, 0.2)} />
          <circle cx={12} cy={-64} r={7} fill="#f2c14e" />
        </g>
      );
    case 'clock':
      return (
        <g>
          <circle cx={0} cy={-35} r={33} fill="#fff" {...O} />
          <circle cx={0} cy={-35} r={33} fill="none" stroke={a} strokeWidth={6} />
          {Array.from({ length: 12 }, (_, i) => {
            const t = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={Math.sin(t) * 24} cy={-35 - Math.cos(t) * 24} r={1.8} fill={INK} />;
          })}
          <path d="M0,-35 L0,-52 M0,-35 L12,-30" {...O} strokeWidth={3} />
        </g>
      );
    case 'balloons':
      return (
        <g>
          {[[-22, -160, a], [18, -175, b], [0, -130, '#ff9ec4']].map(([x, y, c], i) => (
            <g key={i}>
              <path d={`M${x},${(y as number) + 28} Q${(x as number) + 6},${(y as number) + 80} 0,0`} fill="none" stroke={INK} strokeWidth={1.6} />
              <ellipse cx={x as number} cy={y as number} rx={22} ry={27} fill={c as string} {...O} />
              <ellipse cx={(x as number) - 8} cy={(y as number) - 10} rx={5} ry={8} fill="#fff" opacity={0.6} />
              <path d={`M${(x as number) - 4},${(y as number) + 27} l4,6 l4,-6Z`} fill={c as string} {...O} strokeWidth={1.4} />
            </g>
          ))}
          <rect x={-10} y={-10} width={20} height={10} rx={3} fill="#f2c14e" {...O} strokeWidth={1.6} />
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
    case 'loveseat':
      return (
        <g>
          <path d="M-74,-6 l-4,8 M74,-6 l4,8" {...O} strokeWidth={5} />
          <rect x={-70} y={-104} width={140} height={64} rx={30} fill={shade(a, 0.4)} {...O} />
          <rect x={-82} y={-62} width={164} height={56} rx={22} fill={shade(a, 0.25)} {...O} />
          <rect x={-88} y={-76} width={30} height={70} rx={15} fill={shade(a, 0.32)} {...O} />
          <rect x={58} y={-76} width={30} height={70} rx={15} fill={shade(a, 0.32)} {...O} />
          <path d="M0,-98 L0,-48" stroke={shade(a, 0.1)} strokeWidth={2} />
          <circle cx={-30} cy={-80} r={3} fill={shade(a, -0.1)} />
          <circle cx={30} cy={-80} r={3} fill={shade(a, -0.1)} />
        </g>
      );
    case 'cozy_chair':
      return (
        <g>
          <path d="M-40,-6 l-6,8 M40,-6 l6,8" {...O} strokeWidth={5} />
          <path d="M-52,-20 Q-60,-108 0,-108 Q60,-108 52,-20 Z" fill={shade(a, 0.3)} {...O} />
          <ellipse cx={0} cy={-26} rx={52} ry={20} fill={shade(a, 0.15)} {...O} />
          <path d="M-34,-80 Q0,-96 34,-80" fill="none" stroke={shade(a, 0.5)} strokeWidth={3} />
        </g>
      );
    case 'pouf':
      return (
        <g>
          <ellipse cx={0} cy={-26} rx={36} ry={26} fill={shade(a, 0.3)} {...O} />
          <ellipse cx={0} cy={-40} rx={30} ry={10} fill={shade(a, 0.5)} />
          {[-24, -8, 8, 24].map((x) => (
            <path key={x} d={`M${x},-48 Q${x * 1.2},-26 ${x},-4`} fill="none" stroke={shade(a, 0.05)} strokeWidth={2} />
          ))}
        </g>
      );
    case 'cushions':
      return (
        <g>
          <rect x={-54} y={-34} width={64} height={32} rx={14} fill={shade(a, 0.35)} {...O} />
          <rect x={-4} y={-38} width={58} height={36} rx={14} fill={shade(b, 0.4)} {...O} />
          <rect x={-30} y={-66} width={56} height={34} rx={14} fill="#ffd6e7" {...O} transform="rotate(-8 -2 -49)" />
          <path d="M-12,-52 l8,6 l8,-6" fill="none" stroke="#ff7eb6" strokeWidth={2.4} />
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
    case 'arch_mirror':
      return (
        <g>
          <path d="M-38,-2 L-38,-80 A38,38 0 0,1 38,-80 L38,-2 Z" fill={shade(a, 0.35)} {...O} />
          <path d="M-29,-10 L-29,-80 A29,29 0 0,1 29,-80 L29,-10 Z" fill="#d9f3f6" />
          <path d="M-12,-74 l16,-16 M-6,-60 l16,-16" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case 'wall_shelves':
      return (
        <g>
          {[-58, -8].map((y) => (
            <rect key={y} x={-72} y={y} width={144} height={9} rx={4} fill="#c98f62" {...O} />
          ))}
          <rect x={-62} y={-86} width={16} height={28} rx={3} fill={a} {...O} strokeWidth={1.6} />
          <rect x={-44} y={-82} width={16} height={24} rx={3} fill={shade(a, 0.4)} {...O} strokeWidth={1.6} />
          <circle cx={10} cy={-70} r={12} fill="#7fdcaa" {...O} strokeWidth={1.6} />
          <path d="M30,-58 L44,-84 L58,-58 Z" fill="#ffd6e7" {...O} strokeWidth={1.6} />
          <rect x={-52} y={-34} width={34} height={26} rx={5} fill="#fff" {...O} strokeWidth={1.6} />
          <circle cx={30} cy={-20} r={11} fill={shade(a, 0.2)} {...O} strokeWidth={1.6} />
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
    case 'rug_fluffy':
      return (
        <g>
          {Array.from({ length: 22 }, (_, i) => {
            const t = (i / 22) * Math.PI * 2;
            return <circle key={i} cx={Math.cos(t) * 100} cy={-30 + Math.sin(t) * 26} r={10} fill={shade(a, 0.62)} {...O} strokeWidth={1.6} />;
          })}
          <ellipse cx={0} cy={-30} rx={102} ry={28} fill={shade(a, 0.62)} />
        </g>
      );
    case 'rug_rect':
      return (
        <g>
          <rect x={-128} y={-58} width={256} height={54} rx={6} fill={shade(a, 0.55)} {...O} />
          <rect x={-114} y={-50} width={228} height={38} rx={4} fill="none" stroke={shade(a, 0.2)} strokeWidth={3} />
          <path d="M-60,-31 l12,-10 l12,10 l-12,10Z M48,-31 l12,-10 l12,10 l-12,10Z" fill={shade(b, 0.35)} />
          {[-128, 128].map((x) => (
            <path key={x} d={`M${x},-54 l${x < 0 ? -8 : 8},0 M${x},-40 l${x < 0 ? -8 : 8},0 M${x},-26 l${x < 0 ? -8 : 8},0 M${x},-12 l${x < 0 ? -8 : 8},0`} stroke={INK} strokeWidth={1.6} />
          ))}
        </g>
      );
    case 'side_lamp':
      return (
        <g>
          <rect x={-30} y={-62} width={60} height={10} rx={4} fill="#c98f62" {...O} />
          <path d="M-24,-52 L-24,0 M24,-52 L24,0" {...O} strokeWidth={4} />
          <rect x={-5} y={-92} width={10} height={30} fill={INK} />
          <path d="M-24,-92 L-14,-126 L14,-126 L24,-92 Z" fill={shade(a, 0.45)} {...O} />
          <ellipse cx={0} cy={-80} rx={30} ry={14} fill="#fff3c4" opacity={0.45} />
        </g>
      );
    case 'wall_lamp':
      return (
        <g>
          <rect x={-8} y={-50} width={16} height={22} rx={4} fill="#c98f62" {...O} />
          <path d="M0,-40 Q-2,-62 12,-64" fill="none" {...O} strokeWidth={3} />
          <path d="M-6,-60 L30,-60 L22,-80 L2,-80 Z" fill={shade(a, 0.45)} {...O} />
          <ellipse cx={12} cy={-44} rx={20} ry={14} fill="#fff3c4" opacity={0.4} />
        </g>
      );
    case 'hanging_plant':
      return (
        <g>
          <path d="M0,-128 L-20,-58 M0,-128 L20,-58 M0,-128 L0,-58" stroke="#c98f62" strokeWidth={2} />
          <path d="M-24,-58 L24,-58 Q22,-30 0,-30 Q-22,-30 -24,-58Z" fill={a} {...O} />
          {[-18, -6, 6, 18].map((x, i) => (
            <path key={x} d={`M${x},-40 Q${x + (i % 2 ? 10 : -10)},-10 ${x + (i % 2 ? 4 : -4)},${-2 + i * 4}`} fill="none" stroke="#4cae6e" strokeWidth={4} strokeLinecap="round" />
          ))}
          {[[-20, -14], [14, -8], [-6, 0], [22, 6]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx={6} ry={4} fill="#5fbf7a" {...O} strokeWidth={1.2} />
          ))}
        </g>
      );
    case 'flower_pot':
      return (
        <g>
          {([[-14, -74, '#ff7eb6'], [10, -82, '#f2c14e'], [0, -64, '#b48ef0'], [16, -60, '#ff9ec4']] as [number, number, string][]).map(([x, y, col], i) => (
            <g key={i}>
              <path d={`M${x * 0.4},-30 L${x},${y}`} stroke="#4f9e63" strokeWidth={3} />
              {[0, 72, 144, 216, 288].map((ang) => (
                <ellipse key={ang} cx={x} cy={y - 5} rx={4} ry={6} fill={col} stroke={INK} strokeWidth={1} transform={`rotate(${ang} ${x} ${y})`} />
              ))}
              <circle cx={x} cy={y} r={2.6} fill="#fff3c4" />
            </g>
          ))}
          <path d="M-24,-34 L24,-34 L18,0 L-18,0Z" fill={a} {...O} />
          <rect x={-27} y={-40} width={54} height={10} rx={4} fill={shade(a, -0.15)} {...O} />
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
    case 'round_dog_bed':
      return (
        <g>
          <ellipse cx={0} cy={-24} rx={58} ry={24} fill={shade(a, 0.3)} {...O} />
          <ellipse cx={0} cy={-28} rx={42} ry={14} fill="#fff" />
          {[-30, -10, 10, 30].map((x) => (
            <circle key={x} cx={x} cy={-28 + Math.abs(x) * 0.1} r={3} fill={shade(a, 0.5)} />
          ))}
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
  const pad = 14;
  const w = f.w + pad * 2;
  const h = f.h + pad * 2;
  return (
    <svg viewBox={`${-w / 2} ${-h + pad} ${w} ${h}`} role="img" aria-label={f.name}>
      <FurnitureArt id={id} p={p} color={color} />
    </svg>
  );
}
