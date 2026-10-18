// The studio room (first room) in the bold toy-dollhouse look: patterned wallpaper, beadboard
// wainscot, wood-plank floor, a big window onto the city, an arched door, a reading alcove on the
// left and a garden door + craft pegboard on the right. Original art. Architecture only:
// nothing here is selectable furniture. Room units: x −400…1200, y 0…500, floor from y 334.
import { useId } from 'react';
import { backgroundById, type Palette } from '../content/catalog';
import { shade } from './color';
import { COLORS as C, INK, LINE, SURFACES } from './style';
import { heart, star4 } from './extra/rigHelpers';

const O = { stroke: INK, strokeWidth: LINE.base, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const T = { ...O, strokeWidth: LINE.thin };
const X0 = -400, W = 1600;
export const STUDIO_FLOOR_Y = 334;
const RAIL_Y = 232;

const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, '');

/** stable pseudo-random 0..1 from an integer */
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** wallpaper, wainscot, skirting and floor across the whole 1600-unit room */
export function StudioSurface({ wall, floor, p }: { wall: string; floor: string; p: Palette }) {
  const uid = useUid();
  const wi = backgroundById(wall), fi = backgroundById(floor);
  const wallId = wi?.baseId ?? wall, floorId = fi?.baseId ?? floor;
  const wc = wi?.color ?? p.wallAccent;
  const wallFill = wi?.color ? shade(wi.color, 0.7) : p.wall;
  const fc = fi?.color ?? p.floorAccent;
  const floorFill = fi?.color ? shade(fi.color, 0.5) : p.floor;
  const seam = shade(fc, -0.15);
  const wainscot = shade(wi?.color ? wc : p.wallAccent, -0.12);
  const wp = `${uid}studioWall`, fp = `${uid}studioFloor`;
  const floorH = 500 - STUDIO_FLOOR_Y;
  // plank rows get taller towards the viewer
  const rows = [0, 20, 44, 74, 110, 166].map((d) => STUDIO_FLOOR_Y + d);
  return <g data-room-surface="studio">
    <defs>
      <pattern id={wp} width={64} height={64} patternUnits="userSpaceOnUse">
        <rect width={64} height={64} fill={wallFill} />
        {wallId === 'wall_stripes' && <><rect width={26} height={64} fill={wc} /><rect x={38} width={4} height={64} fill="#fff" opacity={0.55} /></>}
        {wallId === 'wall_dots' && <><circle cx={16} cy={16} r={7} fill={wc} /><circle cx={48} cy={48} r={7} fill={wc} /><circle cx={48} cy={16} r={2.5} fill="#fff" /><circle cx={16} cy={48} r={2.5} fill="#fff" /></>}
        {wallId === 'wall_hearts' && <><path d={heart(16, 16, 11)} fill={wc} /><path d={heart(48, 48, 11)} fill={wc} /><circle cx={48} cy={16} r={2.5} fill="#fff" /><circle cx={16} cy={48} r={2.5} fill="#fff" /></>}
        {wallId === 'wall_stars' && <><path d={star4(16, 16, 11)} fill={wc} /><path d={star4(48, 48, 9)} fill={wc} /><path d={star4(48, 16, 4)} fill="#fff" /><path d={star4(16, 48, 4)} fill="#fff" /></>}
        {wallId === 'wall_ribbons' && <path d="M0 44C16 12 32 64 48 28C54 14 60 20 64 22" fill="none" stroke={wc} strokeWidth={8} strokeLinecap="round" />}
        {wi?.rare && <path d={star4(32, 32, 6)} fill={C.sun} />}
      </pattern>
      <pattern id={fp} width={80} height={40} patternUnits="userSpaceOnUse">
        <rect width={80} height={40} fill={floorFill} />
        {floorId === 'floor_tiles' && <><rect width={40} height={40} fill={shade(floorFill, 0.55)} /><path d="M0 0H80M0 0V40M40 0V40" stroke={seam} strokeWidth={2.5} /></>}
        {floorId === 'floor_checker' && <><rect width={40} height={20} fill={fi?.color ?? p.accent2} /><rect x={40} y={20} width={40} height={20} fill={fi?.color ?? p.accent2} /><rect x={40} width={40} height={20} fill="#fff" /><rect y={20} width={40} height={20} fill="#fff" /></>}
        {floorId === 'floor_carpet' && <><rect width={80} height={40} fill={shade(fi?.color ?? p.accent, 0.45)} /><circle cx={20} cy={10} r={2.5} fill={shade(fi?.color ?? p.accent, 0.2)} /><circle cx={60} cy={30} r={2.5} fill={shade(fi?.color ?? p.accent, 0.2)} /></>}
        {fi?.rare && <path d={star4(40, 20, 5)} fill={C.sun} />}
      </pattern>
    </defs>
    {/* wallpaper */}
    <rect x={X0} width={W} height={STUDIO_FLOOR_Y} fill={`url(#${wp})`} />
    {/* beadboard wainscot under the chair rail */}
    <rect x={X0} y={RAIL_Y} width={W} height={STUDIO_FLOOR_Y - RAIL_Y} fill={wainscot} />
    <path d={Array.from({ length: 40 }, (_, i) => `M${X0 + 20 + i * 40} ${RAIL_Y + 10}V${STUDIO_FLOOR_Y - 16}`).join('')} stroke={shade(wainscot, -0.18)} strokeWidth={2.5} />
    <path d={Array.from({ length: 40 }, (_, i) => `M${X0 + 24 + i * 40} ${RAIL_Y + 12}V${STUDIO_FLOOR_Y - 18}`).join('')} stroke="#fff" strokeWidth={1.5} opacity={0.35} />
    <rect x={X0} y={RAIL_Y - 2} width={W} height={12} fill="#fff" {...O} />
    {/* ceiling molding */}
    <rect x={X0} y={-4} width={W} height={20} fill="#fff" {...O} />
    <path d={`M${X0} 22H${X0 + W}`} stroke={shade(wallFill, -0.15)} strokeWidth={4} />
    {/* floor */}
    {floorId === 'floor_wood' ? <g data-floor="planks">
      <rect x={X0} y={STUDIO_FLOOR_Y} width={W} height={floorH} fill={floorFill} />
      {rows.slice(0, -1).map((y0, r) => {
        const y1 = rows[r + 1], len = 150 + r * 34, off = (r * 97) % len;
        const n = Math.ceil(W / len) + 1;
        return <g key={r}>
          {Array.from({ length: n }, (_, i) => {
            const x = X0 - off + i * len, t = rnd(r * 31 + i);
            const fill = t < 0.33 ? floorFill : t < 0.66 ? shade(floorFill, 0.1) : shade(floorFill, -0.06);
            return <rect key={i} x={x} y={y0} width={len} height={y1 - y0} fill={fill} stroke={seam} strokeWidth={2.5} />;
          })}
          {Array.from({ length: n }, (_, i) => <path key={`k${i}`} d={`M${X0 - off + i * len + len * 0.3} ${y0 + (y1 - y0) * 0.5}q10 -3 20 0`} stroke={seam} strokeWidth={1.6} fill="none" opacity={0.6} />)}
        </g>;
      })}
    </g> : <rect x={X0} y={STUDIO_FLOOR_Y} width={W} height={floorH} fill={`url(#${fp})`} />}
    {/* skirting board + its shadow on the floor */}
    <rect x={X0} y={STUDIO_FLOOR_Y} width={W} height={8} fill={INK} opacity={0.14} />
    <rect x={X0} y={STUDIO_FLOOR_Y - 18} width={W} height={18} fill="#fff" {...O} />
  </g>;
}

function Sun({ x, y, r }: { x: number; y: number; r: number }) {
  return <g>
    {Array.from({ length: 10 }, (_, i) => {
      const t = (i / 10) * Math.PI * 2;
      return <path key={i} d={`M${x + Math.cos(t) * (r + 5)} ${y + Math.sin(t) * (r + 5)}L${x + Math.cos(t) * (r + 13)} ${y + Math.sin(t) * (r + 13)}`} stroke={C.sun} strokeWidth={4} strokeLinecap="round" />;
    })}
    <circle cx={x} cy={y} r={r} fill={C.sun} {...T} />
  </g>;
}
function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M-30 8Q-38 8-36 0Q-34-10-22-8Q-18-22-2-18Q8-26 18-14Q34-16 34-2Q36 8 26 8Z" fill="#fff" {...T} />;
}
function Tree({ x, y, s = 1, c = C.green }: { x: number; y: number; s?: number; c?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-4} y={-22} width={8} height={24} fill={C.woodDark} {...T} />
    <circle cx={0} cy={-36} r={20} fill={c} {...T} />
    <circle cx={-7} cy={-42} r={5} fill="#fff" opacity={0.35} />
  </g>;
}
function Curtain({ x, side, color, top, bottom }: { x: number; side: 1 | -1; color: string; top: number; bottom: number }) {
  // gathered curtain hanging from (x, top); side 1 = left curtain (folds to the right edge)
  const w = 38;
  const x2 = x + side * w;
  const d = `M${x} ${top}H${x2}Q${x2 - side * 10} ${(top + bottom) / 2 - 30} ${x2 - side * 4} ${bottom - 30}Q${x2 + side * 2} ${bottom - 6} ${x2 - side * 14} ${bottom}Q${x + side * 10} ${bottom + 6} ${x} ${bottom - 4}Z`;
  return <g>
    <path d={d} fill={color} {...O} />
    {[0.3, 0.62].map((f) => <path key={f} d={`M${x + side * w * f} ${top + 4}Q${x + side * w * f - side * 4} ${(top + bottom) / 2} ${x + side * w * f} ${bottom - 12}`} fill="none" stroke={shade(color, -0.22)} strokeWidth={2.5} />)}
    {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={x + side * (8 + (i % 2) * 18)} cy={top + 22 + i * ((bottom - top - 50) / 4)} r={3} fill="#fff" opacity={0.8} />)}
  </g>;
}
function Bunting({ x1, x2, y, sag, colors }: { x1: number; x2: number; y: number; sag: number; colors: string[] }) {
  const n = Math.max(3, Math.round((x2 - x1) / 30));
  return <g>
    <path d={`M${x1} ${y}Q${(x1 + x2) / 2} ${y + sag * 2} ${x2} ${y}`} fill="none" stroke={INK} strokeWidth={2} />
    {Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n, x = x1 + (x2 - x1) * t, yy = y + sag * 4 * t * (1 - t);
      return <path key={i} d={`M${x - 10} ${yy}H${x + 10}L${x} ${yy + 20}Z`} fill={colors[i % colors.length]} {...T} />;
    })}
  </g>;
}
function Outlet({ x, y }: { x: number; y: number }) {
  return <g><rect x={x - 9} y={y - 11} width={18} height={22} rx={4} fill="#fff" {...T} /><circle cx={x - 3} cy={y} r={1.6} fill={INK} /><circle cx={x + 3} cy={y} r={1.6} fill={INK} /></g>;
}

/** centre part of the studio (x 0…800); keeps the original arched doorway outline */
export function StudioCenter({ p }: { p: Palette }) {
  const uid = useUid();
  const sky = `${uid}studioSky`, clip = `${uid}studioView`;
  const curtain = p.accent2;
  return <g data-studio-center="">
    <defs>
      <linearGradient id={sky} x2="0" y2="1"><stop stopColor="#55c3ff" /><stop offset="1" stopColor="#c9efff" /></linearGradient>
      <clipPath id={clip}><rect x={396} y={70} width={208} height={156} rx={4} /></clipPath>
    </defs>
    {/* arched door */}
    <path d="M11 318V135a75 75 0 0 1 150 0v183Z" fill="#fff" {...O} />
    <path d="M23 320V135a63 63 0 0 1 126 0v185" fill={C.sky} {...O} />
    <path d="M38 140a48 48 0 0 1 96 0Z" fill="#c9efff" {...T} />
    <path d="M86 92V140M43 120H129" stroke="#fff" strokeWidth={5} />
    <path d="M38 140a48 48 0 0 1 96 0Z" fill="none" {...T} />
    <rect x={38} y={160} width={96} height={64} rx={8} fill={shade(C.sky, 0.22)} {...T} />
    <rect x={38} y={238} width={96} height={68} rx={8} fill={shade(C.sky, 0.22)} {...T} />
    <path d={heart(86, 192, 12)} fill={C.pink} {...T} />
    <circle cx={132} cy={232} r={6} fill={C.sun} {...T} />
    <ellipse cx={86} cy={344} rx={58} ry={9} fill={C.red} {...T} />
    <path d="M42 344H130" stroke="#fff" strokeWidth={2} strokeDasharray="5 6" />
    {/* light switch */}
    <rect x={172} y={176} width={18} height={26} rx={4} fill="#fff" {...T} />
    <rect x={177} y={182} width={8} height={9} rx={2} fill={C.sun} {...T} strokeWidth={1.5} />
    {/* bunting over the frame spot */}
    <Bunting x1={184} x2={336} y={34} sag={12} colors={[C.red, C.sun, C.sky, C.green, C.pink]} />
    {/* big window with a city view */}
    <Curtain x={372} side={1} color={curtain} top={46} bottom={262} />
    <rect x={382} y={56} width={236} height={184} rx={10} fill="#fff" {...O} />
    <rect x={396} y={70} width={208} height={156} rx={4} fill={`url(#${sky})`} />
    <g clipPath={`url(#${clip})`}>
      <Sun x={560} y={104} r={16} />
      <Cloud x={446} y={96} s={0.9} /><Cloud x={540} y={146} s={0.6} />
      {([[400, 160, 34, C.coral], [436, 136, 30, C.sun], [468, 170, 28, C.grape], [498, 148, 36, C.mint], [536, 176, 26, C.orange], [564, 156, 40, C.pink]] as [number, number, number, string][]).map(([x, y, w, c], i) => <g key={i}>
        <rect x={x} y={y} width={w} height={240 - y} fill={c} {...T} />
        {Array.from({ length: Math.floor((226 - y) / 16) }, (_, r) => <g key={r}>{[0.25, 0.6].map((f) => <rect key={f} x={x + w * f - 3} y={y + 8 + r * 16} width={7} height={8} rx={1.5} fill="#fff" opacity={0.85} />)}</g>)}
      </g>)}
      <path d="M396 214Q440 198 480 212T560 206T604 210V226H396Z" fill={C.lime} {...T} />
      <Tree x={414} y={226} s={0.8} /><Tree x={492} y={228} s={0.95} c={C.lime} /><Tree x={586} y={226} s={0.75} />
    </g>
    <path d="M500 70V226M396 148H604" stroke="#fff" strokeWidth={8} />
    <path d="M500 70V226M396 148H604" stroke={INK} strokeWidth={1.5} opacity={0.35} />
    <rect x={396} y={70} width={208} height={156} rx={4} fill="none" {...T} />
    <path d="M410 84l26 26M410 100l14 14" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
    <rect x={370} y={228} width={260} height={14} rx={5} fill="#fff" {...O} />
    <Curtain x={628} side={-1} color={curtain} top={46} bottom={262} />
    <rect x={352} y={38} width={296} height={9} rx={4.5} fill={C.woodDark} {...T} />
    <circle cx={352} cy={42} r={8} fill={C.sun} {...T} /><circle cx={648} cy={42} r={8} fill={C.sun} {...T} />
    {/* radiator under the window */}
    <rect x={432} y={256} width={136} height={50} rx={10} fill="#fff" {...O} />
    {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${448 + i * 17.5} 264V298`} stroke={shade(p.wall, -0.2)} strokeWidth={4} strokeLinecap="round" />)}
    {/* coat pegs with a scarf and a hat */}
    <rect x={688} y={108} width={100} height={12} rx={5} fill={C.wood} {...O} />
    {[704, 738, 772].map((x) => <circle key={x} cx={x} cy={126} r={5} fill={C.woodDark} {...T} />)}
    <path d="M697 128Q704 122 711 128L716 178L706 174L700 182Z" fill={C.pink} {...T} />
    <path d="M700 150H714M702 162H713" stroke="#fff" strokeWidth={2.5} />
    <path d="M756 140Q772 112 788 140Z" fill={C.sun} {...T} /><path d="M752 140H792" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <path d="M756 136H788" stroke={C.red} strokeWidth={4} />
    <Outlet x={752} y={292} />
  </g>;
}

/** side areas revealed by scrolling (each drawn in its own 0…400 frame) */
export function StudioWing({ side }: { side: 'left' | 'right' }) {
  const uid = useUid();
  if (side === 'left') {
    // a reading alcove with a built-in bookcase and a round window
    const back = SURFACES.sunWall, sideWall = shade(back, -0.14), soffit = shade(back, -0.22);
    const sky = `${uid}alcoveSky`;
    const spines = [C.red, C.sky, C.sun, C.green, C.grape, C.orange, C.pink, C.mint, C.blue];
    return <g data-studio-wing="alcove">
      <defs><linearGradient id={sky} x2="0" y2="1"><stop stopColor="#55c3ff" /><stop offset="1" stopColor="#c9efff" /></linearGradient></defs>
      <path d="M40 46H320V316H40Z" fill={back} />
      {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={78 + (i % 6) * 42 + (Math.floor(i / 6) % 2) * 21} cy={110 + Math.floor(i / 6) * 50} r={4} fill={shade(back, -0.1)} />)}
      <path d="M40 46L72 82V316H40Z" fill={sideWall} />
      <path d="M320 46L288 82V316H320Z" fill={sideWall} />
      <path d="M40 46H320L288 82H72Z" fill={soffit} />
      {/* bookcase */}
      <rect x={88} y={112} width={112} height={204} rx={6} fill={C.wood} {...O} />
      {[118, 176, 234].map((y, s) => <g key={y}>
        <rect x={98} y={y} width={92} height={48} fill={shade(C.wood, 0.55)} {...T} />
        {Array.from({ length: 6 - (s % 2) }, (_, i) => {
          const h = 30 + rnd(s * 9 + i) * 14, w = 10 + (i % 2) * 3, x = 101 + i * 15;
          return <rect key={i} x={x} y={y + 48 - h} width={w} height={h} rx={2} fill={spines[(i + s * 3) % spines.length]} {...T} strokeWidth={1.5} transform={i === 5 - (s % 2) ? `rotate(14 ${x} ${y + 48})` : undefined} />;
        })}
      </g>)}
      <rect x={98} y={292} width={92} height={22} rx={3} fill={C.woodDark} {...T} />
      <circle cx={144} cy={303} r={3} fill={C.sun} />
      <circle cx={112} cy={100} r={12} fill={C.sky} {...T} /><path d="M100 100H124M112 88Q104 100 112 112" fill="none" stroke={C.green} strokeWidth={3} />
      <path d="M150 112l6-18h22l6 18Z" fill={C.coral} {...T} />
      {[-10, 0, 10].map((dx) => <ellipse key={dx} cx={167 + dx} cy={88} rx={5} ry={9} fill={C.green} {...T} strokeWidth={1.5} transform={`rotate(${dx * 2} ${167 + dx} 96)`} />)}
      {/* round window */}
      <circle cx={250} cy={150} r={38} fill="#fff" {...O} />
      <circle cx={250} cy={150} r={28} fill={`url(#${sky})`} {...T} />
      <Cloud x={244} y={150} s={0.5} />
      <path d="M222 150H278M250 122V178" stroke="#fff" strokeWidth={4} />
      <circle cx={250} cy={150} r={28} fill="none" {...T} />
      {/* alcove casing */}
      <path d="M28 330V40H332V330H320V52H40V330Z" fill="#fff" {...O} />
      {/* cork board */}
      <rect x={340} y={102} width={50} height={78} rx={5} fill="#d9a066" {...O} />
      <rect x={346} y={110} width={22} height={26} fill="#fff" {...T} strokeWidth={1.5} transform="rotate(-6 357 123)" />
      <path d={star4(357, 123, 7)} fill={C.sun} />
      <rect x={364} y={138} width={20} height={24} fill={C.sky} {...T} strokeWidth={1.5} transform="rotate(5 374 150)" />
      <circle cx={357} cy={110} r={2.5} fill={C.red} /><circle cx={374} cy={139} r={2.5} fill={C.green} />
      <Outlet x={360} y={292} />
    </g>;
  }
  // garden door with a view, and a craft pegboard
  const sky = `${uid}gardenSky`, clip = `${uid}gardenView`;
  return <g data-studio-wing="garden-door">
    <defs>
      <linearGradient id={sky} x2="0" y2="1"><stop stopColor="#55c3ff" /><stop offset="1" stopColor="#d6f4ff" /></linearGradient>
      <clipPath id={clip}><rect x={64} y={58} width={172} height={246} /></clipPath>
    </defs>
    <rect x={48} y={42} width={204} height={278} rx={8} fill="#fff" {...O} />
    <rect x={64} y={58} width={172} height={246} fill={`url(#${sky})`} />
    <g clipPath={`url(#${clip})`}>
      <Sun x={204} y={92} r={14} />
      <Cloud x={110} y={96} s={0.8} />
      <path d="M64 214Q120 186 170 206T236 196V304H64Z" fill={C.lime} {...T} />
      <Tree x={92} y={222} s={1.3} /><Tree x={204} y={214} s={1.1} c={C.lime} />
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${66 + i * 18} 300V254l7-8l7 8V300Z`} fill="#fff" {...T} strokeWidth={1.6} />)}
      <path d="M64 268H236M64 288H236" stroke="#fff" strokeWidth={5} />
      <path d="M64 304V296H236V304Z" fill={C.green} />
      {[[90, 292, C.red], [130, 296, C.sun], [176, 290, C.pink], [214, 296, C.grape]].map(([x, y, c]) => <g key={x as number}>
        <path d={`M${x} ${y}v12`} stroke={C.green} strokeWidth={2.5} />
        <circle cx={x as number} cy={y as number} r={5} fill={c as string} {...T} strokeWidth={1.4} />
      </g>)}
      <path d="M150 140q-8-10-14-2q6 8 14 2q8-10 14-2q-6 8-14 2Z" fill={C.pink} {...T} strokeWidth={1.4} />
    </g>
    <path d="M150 58V304M64 140H236M64 222H236" stroke="#fff" strokeWidth={7} />
    <path d="M150 58V304" stroke={INK} strokeWidth={2} />
    <rect x={64} y={58} width={172} height={246} fill="none" {...T} />
    <path d="M80 76l30 30M80 94l16 16" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
    <circle cx={140} cy={236} r={4.5} fill={C.sun} {...T} /><circle cx={160} cy={236} r={4.5} fill={C.sun} {...T} />
    {/* craft pegboard */}
    <rect x={282} y={96} width={104} height={124} rx={8} fill={C.sun} {...O} />
    {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={294 + (i % 6) * 16} cy={108 + Math.floor(i / 6) * 24} r={1.8} fill={shade(C.sun, -0.35)} />)}
    <g>
      <circle cx={304} cy={142} r={7} fill="none" stroke={C.red} strokeWidth={4} /><circle cx={318} cy={142} r={7} fill="none" stroke={C.red} strokeWidth={4} />
      <path d="M306 136L326 112M316 136L300 112" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </g>
    <rect x={338} y={112} width={10} height={70} rx={2} fill={C.sky} {...T} />
    {[122, 134, 146, 158, 170].map((y) => <path key={y} d={`M338 ${y}h5`} stroke={INK} strokeWidth={1.4} />)}
    <circle cx={368} cy={136} r={12} fill={C.pink} {...T} /><circle cx={368} cy={136} r={4} fill="#fff" {...T} strokeWidth={1.4} />
    {[[298, 170, C.green], [312, 174, C.grape], [326, 168, C.orange]].map(([x, y, c]) => <g key={x as number}>
      <rect x={x as number} y={y as number} width={8} height={36} rx={2} fill={c as string} {...T} strokeWidth={1.6} />
      <path d={`M${x} ${y}l4-8l4 8`} fill={C.cream} {...T} strokeWidth={1.4} />
    </g>)}
    <path d={heart(368, 190, 12)} fill={C.red} {...T} />
    <Outlet x={330} y={292} />
  </g>;
}
