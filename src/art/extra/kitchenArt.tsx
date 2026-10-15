// Modular kitchen: base cabinets share one worktop height (112 units) so pieces line up
// side by side; the fridge is about twice that. Drawn around (0,0) = bottom-centre.
import type { FurnitureArtFn } from '../extraArt';
import { INK, shade } from '../color';
import { FO as O, heart, star4 } from './rigHelpers';

/** Worktop height shared by every base module (see placement surfaces). */
export const WORKTOP = 112;
const TOP = '#f6dfbd';
const TOP_EDGE = '#d9a878';
const WOOD = '#eec79c';
const WOOD_DARK = '#c99168';

function plinth(w: number) {
  return <rect x={-w / 2 + 4} y={-12} width={w - 8} height={10} rx={3} fill="#cdb39b" {...O} strokeWidth={1.8} />;
}

function worktop(w: number) {
  return <g>
    <rect x={-w / 2} y={-WORKTOP} width={w} height={12} rx={4} fill={TOP} {...O} />
    <path d={`M${-w / 2 + 6},${-WORKTOP + 8}H${w / 2 - 6}`} stroke={TOP_EDGE} strokeWidth={2} />
  </g>;
}

/** carcass between worktop and plinth */
function carcass(w: number, fill: string) {
  return <rect x={-w / 2 + 2} y={-WORKTOP + 10} width={w - 4} height={WORKTOP - 20} rx={4} fill={fill} {...O} />;
}

const counter: FurnitureArtFn = ({ a }) => {
  const front = shade(a, 0.72);
  return <g>
    {plinth(120)}
    {carcass(120, shade(a, 0.55))}
    {[-1, 1].map((s) => <g key={s}>
      <rect x={s < 0 ? -53 : 3} y={-96} width={50} height={80} rx={6} fill={front} {...O} strokeWidth={2} />
      <rect x={s < 0 ? -45 : 11} y={-88} width={34} height={64} rx={4} fill="none" stroke={shade(a, 0.45)} strokeWidth={2} />
      <rect x={s < 0 ? -11 : 7} y={-70} width={4} height={18} rx={2} fill={INK} />
    </g>)}
    {worktop(120)}
  </g>;
};

const counterDrawers: FurnitureArtFn = ({ a }) => {
  const front = shade(a, 0.72);
  return <g>
    {plinth(90)}
    {carcass(90, shade(a, 0.55))}
    {[0, 1, 2].map((i) => <g key={i}>
      <rect x={-39} y={-96 + i * 27} width={78} height={23} rx={5} fill={i === 1 ? shade(a, 0.62) : front} {...O} strokeWidth={2} />
      <rect x={-10} y={-87 + i * 27} width={20} height={5} rx={2.5} fill={INK} />
    </g>)}
    <path d={heart(-27, -86, 3.5)} fill="#ff9ec4" />
    {worktop(90)}
  </g>;
};

const sinkCounter: FurnitureArtFn = ({ a }) => {
  const front = shade(a, 0.72);
  return <g>
    {plinth(130)}
    {carcass(130, shade(a, 0.55))}
    {[-1, 1].map((s) => <g key={s}>
      <rect x={s < 0 ? -58 : 3} y={-96} width={55} height={80} rx={6} fill={front} {...O} strokeWidth={2} />
      <rect x={s < 0 ? -11 : 7} y={-70} width={4} height={18} rx={2} fill={INK} />
    </g>)}
    {worktop(130)}
    {/* basin inset in the worktop */}
    <ellipse cx={0} cy={-WORKTOP + 2} rx={38} ry={6} fill="#a4d6de" {...O} strokeWidth={2} />
    <path d={`M-24,${-WORKTOP + 1}q8,-3 16,0`} stroke="#fff" strokeWidth={2} fill="none" />
    {/* tap */}
    <path d={`M26,${-WORKTOP}V-146q0,-6 -7,-6H6q-7,0 -7,7v6`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
    <path d={`M26,${-WORKTOP}V-146q0,-6 -7,-6H6q-7,0 -7,7v6`} fill="none" stroke="#dfe7ef" strokeWidth={4.5} strokeLinecap="round" />
    <circle cx={38} cy={-WORKTOP - 6} r={5} fill="#ff9ec4" {...O} strokeWidth={1.6} />
    <circle cx={14} cy={-WORKTOP - 6} r={5} fill="#9fd3f2" {...O} strokeWidth={1.6} />
  </g>;
};

const ovenRange: FurnitureArtFn = ({ a }) => {
  const enamel = '#fbf7f1';
  return <g>
    {plinth(100)}
    {/* splash-back with knobs */}
    <rect x={-48} y={-124} width={96} height={14} rx={4} fill={shade(a, 0.6)} {...O} strokeWidth={2} />
    <rect x={-48} y={-WORKTOP + 6} width={96} height={WORKTOP - 16} rx={5} fill={enamel} {...O} />
    {/* hob */}
    <rect x={-50} y={-WORKTOP} width={100} height={7} rx={3} fill="#5b6475" {...O} strokeWidth={2} />
    <ellipse cx={-24} cy={-WORKTOP} rx={15} ry={2.5} fill={INK} />
    <ellipse cx={24} cy={-WORKTOP} rx={15} ry={2.5} fill={INK} />
    {[-30, -10, 10, 30].map((x) => <circle key={x} cx={x} cy={-94} r={4.5} fill={shade(a, 0.4)} {...O} strokeWidth={1.5} />)}
    {/* oven door */}
    <rect x={-30} y={-84} width={60} height={5} rx={2.5} fill="#c9ced8" {...O} strokeWidth={1.5} />
    <rect x={-40} y={-76} width={80} height={56} rx={7} fill={enamel} {...O} strokeWidth={2} />
    <rect x={-31} y={-68} width={62} height={34} rx={6} fill="#3e4a5e" />
    <path d="M-24,-46l14,-16M-14,-42l12,-14" stroke="#9fb6cf" strokeWidth={3} strokeLinecap="round" />
    <rect x={-20} y={-56} width={18} height={8} rx={3} fill="#f4c38a" opacity={0.9} />
  </g>;
};

const fridgeTall: FurnitureArtFn = ({ a }) => {
  const body = shade(a, 0.78);
  return <g>
    <path d="M-38,-8v6M38,-8v6" {...O} strokeWidth={5} />
    <rect x={-46} y={-220} width={92} height={212} rx={14} fill={body} {...O} />
    <path d="M-46,-152H46" {...O} strokeWidth={2.2} />
    <rect x={28} y={-196} width={6} height={30} rx={3} fill={INK} />
    <rect x={28} y={-140} width={6} height={44} rx={3} fill={INK} />
    <path d="M-34,-212q12,-4 26,0" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.8} />
    {/* magnets and a child's drawing */}
    <path d={heart(-26, -180, 6)} fill="#ff8fb4" {...O} strokeWidth={1.4} />
    <path d={star4(-4, -186, 6)} fill="#ffd56b" {...O} strokeWidth={1.2} />
    <g transform="rotate(-5 -12 -118)">
      <rect x={-34} y={-136} width={36} height={30} rx={2} fill="#fffaf0" {...O} strokeWidth={1.5} />
      <circle cx={-24} cy={-125} r={5} fill="#ffd56b" />
      <path d="M-30,-112q8,-10 14,-2q6,-8 12,2" fill="none" stroke="#7bbf8e" strokeWidth={2} />
      <circle cx={-16} cy={-138} r={3} fill="#9fd3f2" {...O} strokeWidth={1} />
    </g>
  </g>;
};

const upperCabinets: FurnitureArtFn = ({ a }) => {
  const front = shade(a, 0.72);
  return <g>
    <rect x={-70} y={-84} width={140} height={8} rx={3} fill={shade(a, 0.5)} {...O} strokeWidth={2} />
    <rect x={-68} y={-78} width={136} height={70} rx={5} fill={shade(a, 0.55)} {...O} />
    <rect x={-63} y={-73} width={61} height={60} rx={5} fill={front} {...O} strokeWidth={2} />
    <rect x={-10} y={-30} width={4} height={14} rx={2} fill={INK} />
    {/* glass door with cups */}
    <rect x={2} y={-73} width={61} height={60} rx={5} fill="#e4f4f6" {...O} strokeWidth={2} />
    <path d="M4,-43H61" stroke={shade(a, 0.4)} strokeWidth={2.5} />
    <path d="M12,-45v-12h11v12zM30,-45v-16h10v16z" fill="#fff4dc" stroke={INK} strokeWidth={1.3} />
    <path d="M46,-45v-10q6,-6 12,0v10z" fill="#ffc2d6" stroke={INK} strokeWidth={1.3} />
    <path d="M10,-16h48M16,-16v-10h10v10M36,-16v-12h14v12" fill="#cfe8d6" stroke={INK} strokeWidth={1.3} />
    <path d="M12,-66l10,-6M40,-66l12,-6" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
    <rect x={6} y={-30} width={4} height={14} rx={2} fill={INK} />
    <rect x={-66} y={-10} width={132} height={4} rx={2} fill="#fff1c9" opacity={0.9} />
  </g>;
};

const familyTable: FurnitureArtFn = ({ a }) => <g>
  <rect x={-78} y={-86} width={9} height={82} rx={4} fill={WOOD_DARK} {...O} strokeWidth={2} />
  <rect x={69} y={-86} width={9} height={82} rx={4} fill={WOOD_DARK} {...O} strokeWidth={2} />
  <rect x={-80} y={-86} width={160} height={10} rx={3} fill={WOOD_DARK} {...O} strokeWidth={2} />
  <rect x={-88} y={-96} width={176} height={12} rx={6} fill={WOOD} {...O} />
  {/* checked runner */}
  <path d="M-30,-96H30V-70L22,-74L14,-70L6,-74L-2,-70L-10,-74L-18,-70L-26,-74L-30,-70Z" fill={shade(a, 0.75)} {...O} strokeWidth={1.8} />
  <path d="M-20,-96V-74M-8,-96V-72M4,-96V-72M16,-96V-73M-30,-88H30M-30,-80H30" stroke={shade(a, 0.45)} strokeWidth={2} opacity={0.6} />
</g>;

const chair: FurnitureArtFn = ({ a }) => <g>
  <rect x={-27} y={-54} width={7} height={50} rx={3} fill={WOOD_DARK} {...O} strokeWidth={2} />
  <rect x={20} y={-54} width={7} height={50} rx={3} fill={WOOD_DARK} {...O} strokeWidth={2} />
  <path d="M-22,-28H22" stroke={WOOD_DARK} strokeWidth={4} />
  <rect x={-25} y={-108} width={50} height={46} rx={16} fill={WOOD} {...O} />
  <path d={heart(0, -88, 8)} fill={shade(a, 0.55)} {...O} strokeWidth={1.6} />
  <rect x={-32} y={-62} width={64} height={11} rx={5.5} fill={shade(a, 0.55)} {...O} />
</g>;

const pan: FurnitureArtFn = () => <g>
  <rect x={14} y={-20} width={14} height={6} rx={2} fill="#6b7383" {...O} strokeWidth={1.8} />
  <rect x={26} y={-22} width={18} height={10} rx={5} fill="#e88b6a" {...O} strokeWidth={1.8} />
  <path d="M-44,-20H16L12,-7Q10,-3 5,-3H-33Q-38,-3 -40,-7Z" fill="#5b6475" {...O} />
  <ellipse cx={-14} cy={-20} rx={30} ry={4} fill="#3e4554" {...O} strokeWidth={1.8} />
  <path d="M-26,-21q2,-8 12,-7q10,-1 11,6q-4,3 -12,3q-9,0 -11,-2z" fill="#fffaf0" {...O} strokeWidth={1.6} />
  <circle cx={-15} cy={-24} r={4} fill="#ffc542" stroke={INK} strokeWidth={1.2} />
</g>;

const fruitBowl: FurnitureArtFn = ({ a }) => <g>
  <path d="M-12,-24q4,-30 26,-26q-2,10 -26,26z" fill="#ffe27a" {...O} strokeWidth={1.8} />
  <circle cx={-18} cy={-30} r={12} fill="#f26d78" {...O} strokeWidth={1.8} />
  <path d="M-18,-42q1,-6 6,-8" stroke={INK} strokeWidth={2} fill="none" />
  <ellipse cx={-12} cy={-46} rx={5} ry={2.5} fill="#7cc58c" transform="rotate(-25 -12 -46)" />
  <circle cx={6} cy={-32} r={11} fill="#ffad5c" {...O} strokeWidth={1.8} />
  {[[20, -30], [26, -34], [24, -26], [30, -28]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={4.5} fill="#b48ef0" stroke={INK} strokeWidth={1.2} />)}
  <path d="M-38,-24Q-36,-2 0,-2Q36,-2 38,-24Z" fill={shade(a, 0.55)} {...O} />
  <path d="M-26,-14q26,8 52,0" fill="none" stroke="#fff" strokeWidth={2.4} strokeDasharray="2 6" />
  <ellipse cx={0} cy={-24} rx={38} ry={4} fill={shade(a, 0.35)} {...O} strokeWidth={1.6} />
</g>;

const tray: FurnitureArtFn = ({ a }) => <g>
  <rect x={-26} y={-34} width={16} height={22} rx={3} fill="#ffcf8a" fillOpacity={0.9} {...O} strokeWidth={1.6} />
  <path d="M-25,-26h14" stroke="#fff" strokeWidth={2} />
  <ellipse cx={10} cy={-15} rx={18} ry={3.5} fill="#fffaf0" {...O} strokeWidth={1.5} />
  <circle cx={4} cy={-21} r={6} fill="#d9a06b" {...O} strokeWidth={1.4} />
  <circle cx={17} cy={-21} r={6} fill="#d9a06b" {...O} strokeWidth={1.4} />
  {[[3, -22], [6, -19], [16, -22], [19, -20]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.2} fill={INK} />)}
  <path d="M-44,-12H44L39,-3H-39Z" fill={shade(a, 0.5)} {...O} />
  <path d="M-44,-12q-4,-6 2,-8M44,-12q4,-6 -2,-8" fill="none" {...O} strokeWidth={3} />
</g>;

const cake: FurnitureArtFn = ({ a }) => <g>
  <path d="M-8,-4H8L5,-12H-5Z" fill="#fffaf0" {...O} strokeWidth={1.8} />
  <ellipse cx={0} cy={-13} rx={34} ry={4} fill="#fffaf0" {...O} strokeWidth={1.8} />
  <rect x={-27} y={-50} width={54} height={36} rx={7} fill="#fff1e2" {...O} />
  <path d="M-27,-33H27" stroke="#f3a3b8" strokeWidth={4} />
  <path d="M-27,-44Q-27,-52 -20,-52H20Q27,-52 27,-44V-40Q21,-34 16,-41Q10,-33 4,-41Q-2,-32 -8,-41Q-14,-33 -20,-41Q-24,-35 -27,-40Z" fill={shade(a, 0.6)} {...O} strokeWidth={1.8} />
  {[-16, 0, 16].map((x) => <g key={x}>
    <path d={`M${x - 6},${-55}q6,-10 12,0q-2,8 -6,8q-4,0 -6,-8z`} fill="#ef4f5f" {...O} strokeWidth={1.4} />
    <path d={`M${x - 3},${-59}l3,-3l3,3`} fill="none" stroke="#5fbf7a" strokeWidth={2} />
  </g>)}
  <rect x={-2.5} y={-72} width={5} height={14} rx={2} fill="#9fd3f2" {...O} strokeWidth={1.2} />
  <path d="M0,-74q-5,-4 0,-10q5,6 0,10z" fill="#ffc542" stroke={INK} strokeWidth={1.2} />
</g>;

const jars: FurnitureArtFn = ({ a }) => <g>
  {[
    { x: -26, h: 46, w: 26, fill: '#ffe8a8', dots: '#f2b33d' },
    { x: 2, h: 54, w: 28, fill: '#ffd2c2', dots: '#d9785e' },
    { x: 29, h: 38, w: 24, fill: '#d9f0dd', dots: '#7cbf8a' },
  ].map(({ x, h, w, fill, dots }, i) => <g key={x}>
    <rect x={x - w / 2} y={-h - 2} width={w} height={h} rx={7} fill="#eef8fb" fillOpacity={0.9} {...O} strokeWidth={1.8} />
    <rect x={x - w / 2 + 3} y={-h * 0.62 - 2} width={w - 6} height={h * 0.62 - 3} rx={5} fill={fill} />
    {[0, 1, 2].map((k) => <circle key={k} cx={x - 5 + k * 5} cy={-h * 0.35 - (k % 2) * 6} r={1.8} fill={dots} />)}
    <rect x={x - w / 2 - 1} y={-h - 8} width={w + 2} height={8} rx={4} fill={i === 1 ? shade(a, 0.4) : shade(a, 0.6)} {...O} strokeWidth={1.6} />
    <circle cx={x} cy={-h - 10} r={3} fill={shade(a, 0.3)} {...O} strokeWidth={1.2} />
  </g>)}
</g>;

const cutlery: FurnitureArtFn = ({ a }) => <g>
  {/* fork */}
  <path d="M-10,-30L-14,-50" stroke={INK} strokeWidth={5} strokeLinecap="round" />
  <path d="M-10,-30L-14,-50" stroke="#dfe7ef" strokeWidth={2.5} strokeLinecap="round" />
  <path d="M-19,-50v-8M-15,-51v-9M-11,-52v-8M-19,-50h9" stroke={INK} strokeWidth={2} strokeLinecap="round" />
  {/* spoon */}
  <path d="M0,-30V-48" stroke={INK} strokeWidth={5} strokeLinecap="round" />
  <path d="M0,-30V-48" stroke="#dfe7ef" strokeWidth={2.5} strokeLinecap="round" />
  <ellipse cx={0} cy={-53} rx={5} ry={7} fill="#dfe7ef" {...O} strokeWidth={1.6} />
  {/* spatula */}
  <path d="M10,-30L15,-46" stroke={INK} strokeWidth={5} strokeLinecap="round" />
  <path d="M10,-30L15,-46" stroke="#e4b07f" strokeWidth={2.5} strokeLinecap="round" />
  <rect x={11} y={-60} width={10} height={14} rx={3} fill="#ffb3c8" {...O} strokeWidth={1.6} transform="rotate(18 16 -53)" />
  <path d="M-19,-34H19L15,-4H-15Z" fill={shade(a, 0.6)} {...O} />
  <path d={heart(0, -20, 5)} fill="#fff" opacity={0.85} />
</g>;

const mixingBowl: FurnitureArtFn = ({ a }) => <g>
  <path d="M8,-30L26,-46" stroke={INK} strokeWidth={4} strokeLinecap="round" />
  <path d="M8,-30L26,-46" stroke="#e4b07f" strokeWidth={2} strokeLinecap="round" />
  <path d="M-2,-26q-2,-14 8,-12q10,-2 6,12" fill="none" stroke="#9aa6b8" strokeWidth={2} />
  <path d="M-36,-30Q-34,-2 0,-2Q34,-2 36,-30Z" fill={shade(a, 0.6)} {...O} />
  <ellipse cx={0} cy={-30} rx={36} ry={5} fill="#fff1d4" {...O} strokeWidth={1.8} />
  <path d="M-22,-16H22" stroke="#fff" strokeWidth={3} strokeDasharray="5 5" strokeLinecap="round" />
</g>;

const treatJar: FurnitureArtFn = ({ a }) => <g>
  <rect x={-22} y={-50} width={44} height={46} rx={12} fill="#eef8fb" fillOpacity={0.9} {...O} />
  {[[-10, -14, 20], [6, -18, -15], [-4, -30, 8], [9, -34, -25]].map(([x, y, rot]) => (
    <g key={`${x}${y}`} transform={`rotate(${rot} ${x} ${y})`}>
      <path d={`M${x - 8},${y - 2}h16M${x - 8},${y + 2}h16`} stroke="#d9a06b" strokeWidth={4} />
      {[-1, 1].map((s) => [-1, 1].map((t) => <circle key={`${s}${t}`} cx={x + s * 8} cy={y + t * 2.5} r={2.6} fill="#d9a06b" stroke={INK} strokeWidth={0.8} />))}
    </g>
  ))}
  <rect x={-24} y={-58} width={48} height={10} rx={5} fill={shade(a, 0.45)} {...O} strokeWidth={1.8} />
  <circle cx={0} cy={-61} r={4} fill={shade(a, 0.2)} {...O} strokeWidth={1.4} />
  <g fill={shade(a, 0.2)}>
    <ellipse cx={0} cy={-38} rx={4} ry={3.4} />
    <circle cx={-4.5} cy={-43} r={1.8} /><circle cx={0} cy={-45} r={1.8} /><circle cx={4.5} cy={-43} r={1.8} />
  </g>
</g>;

const spiceRack: FurnitureArtFn = ({ a }) => <g>
  <rect x={-54} y={-62} width={108} height={8} rx={3} fill={WOOD} {...O} strokeWidth={2} />
  <rect x={-54} y={-14} width={108} height={8} rx={3} fill={WOOD} {...O} strokeWidth={2} />
  <path d="M-50,-54V-14M50,-54V-14" stroke={WOOD_DARK} strokeWidth={5} />
  {[-36, -18, 0, 18, 36].map((x, i) => <g key={x}>
    <rect x={x - 7} y={-40} width={14} height={26} rx={4} fill="#fffaf0" {...O} strokeWidth={1.5} />
    <rect x={x - 6} y={-30} width={12} height={15} rx={3} fill={['#e46a54', '#ffd25a', '#8cc88f', '#c98b5f', '#f5a3b7'][i]} />
    <rect x={x - 7} y={-46} width={14} height={7} rx={3} fill={i % 2 ? shade(a, 0.3) : shade(a, 0.6)} {...O} strokeWidth={1.4} />
  </g>)}
</g>;

const kitchenRug: FurnitureArtFn = ({ a }) => <g>
  <path d="M-104,-8H104L96,-42H-96Z" fill={shade(a, 0.7)} {...O} />
  <path d="M-98,-16H98M-96,-34H96" stroke="#fffaf0" strokeWidth={4} />
  <path d="M-60,-25h20M-10,-25h20M40,-25h20" stroke={shade(a, 0.3)} strokeWidth={5} strokeLinecap="round" />
  {Array.from({ length: 9 }, (_, i) => -104 + i * 26).map((x) => <path key={x} d={`M${x},-8v5`} stroke={INK} strokeWidth={1.6} />)}
</g>;

export const KITCHEN_FURNITURE_ART: Record<string, FurnitureArtFn> = {
  kitchen_counter: counter,
  kitchen_counter_drawers: counterDrawers,
  kitchen_sink_counter: sinkCounter,
  kitchen_oven_range: ovenRange,
  kitchen_fridge_tall: fridgeTall,
  kitchen_upper: upperCabinets,
  kitchen_family_table: familyTable,
  kitchen_chair: chair,
  kitchen_pan: pan,
  kitchen_fruit_bowl: fruitBowl,
  kitchen_tray: tray,
  kitchen_cake: cake,
  kitchen_jars: jars,
  kitchen_cutlery: cutlery,
  kitchen_mixing_bowl: mixingBowl,
  kitchen_treat_jar: treatJar,
  kitchen_spice_rack: spiceRack,
  kitchen_rug: kitchenRug,
};
