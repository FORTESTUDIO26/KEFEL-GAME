import { useId } from 'react';
import { backgroundById, type BackdropId, type Palette } from '../content/catalog';
import { VariantDecal } from './VariantDecal';
import { INK, shade } from './color';

export const ROOM_W = 800;
export const ROOM_H = 500;
export const FLOOR_Y = 330;

function heartPath(x: number, y: number, s: number) {
  return `M${x},${y + s * 0.9} C${x - s * 1.4},${y - s * 0.1} ${x - s * 0.7},${y - s * 1.2} ${x},${y - s * 0.4} C${x + s * 0.7},${y - s * 1.2} ${x + s * 1.4},${y - s * 0.1} ${x},${y + s * 0.9}Z`;
}
function starPath(x: number, y: number, s: number) {
  return `M${x},${y - s} Q${x + s * 0.2},${y - s * 0.2} ${x + s},${y} Q${x + s * 0.2},${y + s * 0.2} ${x},${y + s} Q${x - s * 0.2},${y + s * 0.2} ${x - s},${y} Q${x - s * 0.2},${y - s * 0.2} ${x},${y - s}Z`;
}

/** Wall + floor of the studio, in room units. */
export function RoomBackground({ wall, floor, p }: { wall: string; floor: string; p: Palette }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const wallItem = backgroundById(wall);
  const floorItem = backgroundById(floor);
  wall = wallItem?.baseId ?? wall;
  floor = floorItem?.baseId ?? floor;
  p = { ...p, ...(wallItem?.color ? {wall: shade(wallItem.color, 0.8), wallAccent: wallItem.color} : {}), ...(floorItem?.color ? {floor: shade(floorItem.color, 0.65), floorAccent: floorItem.color, soft: shade(floorItem.color, 0.8), accent: floorItem.color} : {}) };
  const wp = `${uid}w`;
  const fp = `${uid}f`;
  return (
    <g>
      <defs>
        <pattern id={wp} width={60} height={60} patternUnits="userSpaceOnUse">
          <rect width={60} height={60} fill={p.wall} />
          {wall === 'wall_stripes' && <rect width={26} height={60} fill={p.wallAccent} />}
          {wall === 'wall_dots' && (
            <>
              <circle cx={15} cy={15} r={5} fill={p.wallAccent} />
              <circle cx={45} cy={45} r={5} fill={p.wallAccent} />
            </>
          )}
          {wall === 'wall_hearts' && (
            <>
              <path d={heartPath(15, 16, 7)} fill={p.wallAccent} />
              <path d={heartPath(45, 46, 7)} fill={p.wallAccent} />
            </>
          )}
          {wall === 'wall_stars' && (
            <>
              <path d={starPath(15, 15, 8)} fill={p.wallAccent} />
              <path d={starPath(45, 45, 6)} fill={p.wallAccent} />
            </>
          )}
          {wall === 'wall_ribbons' && <path d="M0,40 C15,10 30,60 45,25 C52,10 58,18 60,20" fill="none" stroke={p.wallAccent} strokeWidth={6} strokeLinecap="round" />}
        </pattern>
        <pattern id={fp} width={80} height={40} patternUnits="userSpaceOnUse">
          <rect width={80} height={40} fill={p.floor} />
          {floor === 'floor_wood' && (
            <>
              <path d="M0,20 L80,20 M0,40 L80,40" stroke={p.floorAccent} strokeWidth={3} />
              <path d="M30,0 L30,20 M70,20 L70,40" stroke={p.floorAccent} strokeWidth={3} />
            </>
          )}
          {floor === 'floor_tiles' && (
            <>
              <rect width={40} height={40} fill={floorItem?.color ? shade(floorItem.color, 0.9) : "#fbf8ff"} />
              <rect x={40} width={40} height={40} fill={p.soft} />
              <path d="M0,0 L80,0 M0,0 L0,40 M40,0 L40,40" stroke={p.floorAccent} strokeWidth={2} />
            </>
          )}
          {floor === 'floor_checker' && (
            <>
              <rect width={40} height={20} fill={floorItem?.color ?? p.wallAccent} />
              <rect x={40} y={20} width={40} height={20} fill={floorItem?.color ?? p.wallAccent} />
              <rect x={40} width={40} height={20} fill="#fff" />
              <rect y={20} width={40} height={20} fill="#fff" />
            </>
          )}
          {floor === 'floor_carpet' && (
            <>
              <rect width={80} height={40} fill={shade(p.accent, 0.62)} />
              <circle cx={20} cy={10} r={2} fill={shade(p.accent, 0.45)} />
              <circle cx={60} cy={30} r={2} fill={shade(p.accent, 0.45)} />
            </>
          )}
        </pattern>
      </defs>
      <rect x={0} y={0} width={ROOM_W} height={FLOOR_Y} fill={`url(#${wp})`} />
      <rect x={0} y={FLOOR_Y} width={ROOM_W} height={ROOM_H - FLOOR_Y} fill={`url(#${fp})`} />
      {wallItem?.rare && <VariantDecal x={740} y={45} rare />}
      {floorItem?.rare && <VariantDecal x={740} y={440} rare />}
      <rect x={0} y={FLOOR_Y - 10} width={ROOM_W} height={14} fill="#fff" />
      <rect x={0} y={FLOOR_Y + 2} width={ROOM_W} height={3} fill={shade(p.floor, -0.15)} />
    </g>
  );
}

/** Photo backdrops, drawn in a 400×440 card. */
export function Backdrop({ id, p }: { id: BackdropId; p: Palette }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  switch (id) {
    case 'party':
      return (
        <g>
          <rect width={400} height={440} fill="#ffe3ef" />
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={(i * 97) % 400} cy={(i * 53) % 300} r={3 + (i % 3)} fill={['#b48ef0', '#2ec4c0', '#ffab7a', '#f2c14e'][i % 4]} opacity={0.6} />
          ))}
          <path d="M0,40 Q200,90 400,40" fill="none" stroke={INK} strokeWidth={2} />
          {Array.from({ length: 9 }, (_, i) => {
            const x = 22 + i * 44;
            const y = 40 + Math.sin((x / 400) * Math.PI) * 26;
            return <path key={i} d={`M${x - 14},${y - 2} L${x + 14},${y - 2} L${x},${y + 26}Z`} fill={['#b48ef0', '#2ec4c0', '#ff7eb6', '#f2c14e'][i % 4]} stroke={INK} strokeWidth={1.6} />;
          })}
          <rect y={360} width={400} height={80} fill="#f7c8dc" />
        </g>
      );
    case 'stage':
      return (
        <g>
          <rect width={400} height={440} fill="#3a2a5c" />
          <path d="M200,-10 L90,370 L310,370Z" fill="#fff6c9" opacity={0.18} />
          <path d="M0,0 L80,0 Q60,180 90,380 L0,380Z" fill="#c2395f" stroke={INK} strokeWidth={2} />
          <path d="M400,0 L320,0 Q340,180 310,380 L400,380Z" fill="#c2395f" stroke={INK} strokeWidth={2} />
          <path d="M20,0 Q30,190 20,380 M50,0 Q60,190 56,380 M380,0 Q370,190 380,380 M350,0 Q340,190 344,380" stroke="#9e2a4b" strokeWidth={3} fill="none" />
          <rect y={0} width={400} height={30} fill="#9e2a4b" />
          <rect y={360} width={400} height={80} fill="#7a4a2c" />
          <rect y={360} width={400} height={8} fill="#a8683f" />
          {[60, 140, 260, 340].map((x) => (
            <path key={x} d={starPath(x, 90 + (x % 3) * 20, 6)} fill="#fff6c9" opacity={0.8} />
          ))}
        </g>
      );
    case 'park':
      return (
        <g>
          <rect width={400} height={440} fill="#c9ecff" />
          <circle cx={330} cy={70} r={34} fill="#ffe17a" />
          <ellipse cx={90} cy={80} rx={50} ry={18} fill="#fff" />
          <ellipse cx={120} cy={70} rx={30} ry={16} fill="#fff" />
          {[40, 360].map((x) => (
            <g key={x}>
              <rect x={x - 8} y={200} width={16} height={130} fill="#9b6a43" stroke={INK} strokeWidth={2} />
              <circle cx={x} cy={190} r={56} fill="#5fbf7a" stroke={INK} strokeWidth={2} />
              <circle cx={x - 20} cy={176} r={8} fill="#ff9ec4" />
              <circle cx={x + 18} cy={204} r={7} fill="#ff9ec4" />
            </g>
          ))}
          <path d="M0,320 Q200,290 400,320 L400,440 L0,440Z" fill="#8fd88a" />
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M${20 + i * 28},${360 + (i % 3) * 20} l3,-8 l3,8`} fill="none" stroke="#5aa85a" strokeWidth={2} />
          ))}
        </g>
      );
    case 'rain':
      return (
        <g>
          <rect width={400} height={440} fill="#c8d6ea" />
          {[[80, 70], [250, 50], [340, 110]].map(([x, y], i) => (
            <g key={i} fill="#eef3fa">
              <ellipse cx={x} cy={y} rx={56} ry={22} />
              <ellipse cx={x + 26} cy={y - 14} rx={30} ry={20} />
            </g>
          ))}
          {Array.from({ length: 34 }, (_, i) => (
            <path key={i} d={`M${(i * 61) % 400},${110 + ((i * 37) % 220)} l-6,16`} stroke="#7d9cc6" strokeWidth={2.4} strokeLinecap="round" />
          ))}
          <rect y={350} width={400} height={90} fill="#9fb2c9" />
          <ellipse cx={200} cy={400} rx={130} ry={18} fill="#b7d3ef" />
        </g>
      );
    case 'beach':
      return (
        <g>
          <rect width={400} height={440} fill="#bfeaff" />
          <circle cx={70} cy={70} r={34} fill="#ffe17a" />
          <rect y={230} width={400} height={100} fill="#4cc4d6" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${i * 56},250 q14,-10 28,0 t28,0`} fill="none" stroke="#fff" strokeWidth={3} opacity={0.8} />
          ))}
          <path d="M0,320 Q200,296 400,320 L400,440 L0,440Z" fill="#f6dfae" />
          <path d="M340,330 Q330,260 350,190" fill="none" stroke="#9b6a43" strokeWidth={12} strokeLinecap="round" />
          {[-60, -20, 20, 60].map((r) => (
            <ellipse key={r} cx={350} cy={190} rx={40} ry={11} fill="#5fbf7a" stroke={INK} strokeWidth={1.6} transform={`rotate(${r} 350 190) translate(28 0)`} />
          ))}
        </g>
      );
    case 'snow':
      return (
        <g>
          <rect width={400} height={440} fill="#dcecfb" />
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={(i * 83) % 400} cy={(i * 47) % 320} r={2 + (i % 3)} fill="#fff" />
          ))}
          <path d="M0,300 Q120,270 220,300 Q320,326 400,296 L400,440 L0,440Z" fill="#fff" stroke="#c4d8ee" strokeWidth={2} />
          <path d="M40,300 L70,230 L100,300Z M300,300 L336,214 L372,300Z" fill="#7fb7a0" stroke={INK} strokeWidth={1.6} />
          <path d="M60,252 L80,252 M318,240 L354,240" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case 'night':
      return (
        <g>
          <rect width={400} height={440} fill="#2f2a5a" />
          <circle cx={320} cy={80} r={30} fill="#fff3c4" />
          <circle cx={334} cy={70} r={28} fill="#2f2a5a" />
          {Array.from({ length: 22 }, (_, i) => (
            <path key={i} d={starPath((i * 89) % 400, 20 + ((i * 53) % 230), 3 + (i % 3))} fill="#fff3c4" opacity={0.85} />
          ))}
          <rect y={340} width={400} height={100} fill="#5a4a8a" />
          <rect x={30} y={300} width={110} height={60} rx={20} fill="#8b6fd1" stroke={INK} strokeWidth={2} />
          <rect x={46} y={286} width={40} height={30} rx={10} fill="#ff9ec4" stroke={INK} strokeWidth={1.6} />
        </g>
      );
    default: {
      const pid = `${uid}st`;
      return (
        <g>
          <defs>
            <pattern id={pid} width={50} height={50} patternUnits="userSpaceOnUse">
              <rect width={50} height={50} fill={p.wall} />
              <rect width={22} height={50} fill={p.wallAccent} />
            </pattern>
          </defs>
          <rect width={400} height={440} fill={`url(#${pid})`} />
          <rect y={340} width={400} height={100} fill={p.floor} />
          <rect y={334} width={400} height={10} fill="#fff" />
          <ellipse cx={200} cy={392} rx={150} ry={30} fill={shade(p.accent, 0.5)} />
        </g>
      );
    }
  }
}
