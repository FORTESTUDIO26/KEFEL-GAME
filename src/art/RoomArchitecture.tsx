import { ROOM_W, ROOM_X0 } from './roomSpan';
import { useId } from 'react';
import { backgroundById, type Palette } from '../content/catalog';
import type { RoomId } from '../state/types';
import { shade } from './color';
import { StudioWing } from './StudioRoom';

type ArtRoomId = RoomId | 'kitchen' | 'bathroom';
const LINE = '#795b77';
const OUT = { stroke: LINE, strokeWidth: 2.5 };
const CANDY = ['#ff92ba', '#81d9cd', '#ffd578', '#bca0ed', '#ffa983'];

export function RoomFlower({ x, y, color = '#ff92ba', size = 1 }: { x: number; y: number; color?: string; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    {[0, 72, 144, 216, 288].map(angle => <ellipse key={angle} cy={-9} rx={6} ry={10} fill={color} transform={`rotate(${angle})`} {...OUT} strokeWidth={1.2} />)}
    <circle r={5} fill="#ffe392" />
  </g>;
}

export function RoomSparkle({ x, y, size = 9 }: { x: number; y: number; size?: number }) {
  return <path d={`M${x} ${y-size}q2 ${size-2} ${size} ${size}q${2-size} 2 ${-size} ${size}q-2 ${2-size} ${-size} ${-size}q${size-2}-2 ${size}-${size}Z`} fill="#ffdc75" stroke="#dfad57" strokeWidth={1} />;
}

/** Shared world-coordinate patterns keep the joins at x=0 and x=800 seamless. */
export function WideRoomSurface({ wall, floor, p }: { wall: string; floor: string; p: Palette }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const wi = backgroundById(wall), fi = backgroundById(floor);
  wall = wi?.baseId ?? wall; floor = fi?.baseId ?? floor;
  const wc = wi?.color ?? p.wallAccent, fc = fi?.color ?? p.floorAccent;
  const wallFill = wi?.color ? shade(wc, 0.8) : p.wall;
  const floorFill = fi?.color ? shade(fc, 0.65) : p.floor;
  const wp = `${uid}wideWall`, fp = `${uid}wideFloor`;
  return <g data-room-surface="continuous">
    <defs>
      <pattern id={wp} width={60} height={60} patternUnits="userSpaceOnUse">
        <rect width={60} height={60} fill={wallFill} />
        {wall === 'wall_stripes' && <rect width={26} height={60} fill={wc} />}
        {wall === 'wall_dots' && <><circle cx={15} cy={15} r={5} fill={wc}/><circle cx={45} cy={45} r={5} fill={wc}/></>}
        {wall === 'wall_hearts' && [15,45].map(v => <path key={v} d={`M${v} ${v+6}c-16-9-8-20 0-12c8-8 16 3 0 12Z`} fill={wc}/>)}
        {wall === 'wall_stars' && [15,45].map(v => <path key={v} d={`M${v} ${v-8}l3 5 5 3-5 3-3 5-3-5-5-3 5-3Z`} fill={wc}/>)}
        {wall === 'wall_ribbons' && <path d="M0 40C15 10 30 60 45 25C52 10 58 18 60 20" fill="none" stroke={wc} strokeWidth={6}/>}
        {wi?.rare && <path d="M30 5l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#f2c14e"/>}
      </pattern>
      <pattern id={fp} width={80} height={40} patternUnits="userSpaceOnUse">
        <rect width={80} height={40} fill={floorFill}/>
        {floor === 'floor_wood' && <path d="M0 20H80M0 40H80M30 0V20M70 20V40" stroke={fc} strokeWidth={3}/>}
        {floor === 'floor_tiles' && <><rect width={40} height={40} fill={fi?.color ? shade(fc,0.9) : '#fbf8ff'}/><rect x={40} width={40} height={40} fill={fi?.color ? shade(fc,0.8) : p.soft}/><path d="M0 0H80M0 0V40M40 0V40" stroke={fc} strokeWidth={2}/></>}
        {floor === 'floor_checker' && <><rect width={40} height={20} fill={fi?.color ?? p.wallAccent}/><rect x={40} y={20} width={40} height={20} fill={fi?.color ?? p.wallAccent}/><rect x={40} width={40} height={20} fill="#fff"/><rect y={20} width={40} height={20} fill="#fff"/></>}
        {floor === 'floor_carpet' && <><rect width={80} height={40} fill={shade(fi?.color ?? p.accent,0.62)}/><circle cx={20} cy={10} r={2} fill={shade(fi?.color ?? p.accent,0.45)}/><circle cx={60} cy={30} r={2} fill={shade(fi?.color ?? p.accent,0.45)}/></>}
        {fi?.rare && <path d="M40 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#f2c14e"/>}
      </pattern>
    </defs>
    <rect x={ROOM_X0} width={ROOM_W} height={330} fill={`url(#${wp})`}/>
    <rect x={ROOM_X0} y={330} width={ROOM_W} height={170} fill={`url(#${fp})`}/>
    <rect x={ROOM_X0} y={320} width={ROOM_W} height={14} fill="#fff9f0"/>
    <path d="M-400 335H1200" stroke={shade(floorFill,-0.15)} strokeWidth={3}/>
    <path d="M-400 24H1200M-400 38H1200" stroke="#fff9f0" strokeWidth={7}/>
  </g>;
}

function Garland({ variant = 0 }: { variant?: number }) {
  return <g>
    <path d="M18 46Q200 104 382 46" fill="none" stroke={LINE} strokeWidth={2}/>
    {[40,85,130,175,220,265,310,355].map((x,i) => <g key={x} transform={`translate(${x} ${50+Math.sin((x/400)*Math.PI)*30})`}>
      <path d={variant ? 'M-11 0Q-19-16-7-17Q0-26 7-17Q19-16 11 0L0 15Z' : 'M-13 0H13L0 23Z'} fill={CANDY[(i+variant)%5]} {...OUT} strokeWidth={1.5}/>
    </g>)}
  </g>;
}

function Window({ x, color, sky }: { x: number; color: string; sky: string }) {
  return <g transform={`translate(${x} 112)`}>
    <path d="M0 134V38a48 48 0 0 1 96 0v96Z" fill="#fff7e9" {...OUT}/>
    <path d="M8 126V39a40 40 0 0 1 80 0v87Z" fill={`url(#${sky})`}/>
    <path d="M8 99Q45 64 88 91V126H8Z" fill="#9dd8ba"/>
    <path d="M48 0V126M8 69H88" stroke="#fff9f0" strokeWidth={5}/>
    <path d="M-10 0Q7 53-4 102L-22 102V0Z M106 0Q89 53 100 102H118V0Z" fill={color} {...OUT}/>
    <path d="M-16 18V84M112 18V84" stroke="#fff" strokeWidth={3} opacity={0.6}/>
    <path d="M-24 107H120" stroke="#fff7e9" strokeWidth={9}/>
    <RoomFlower x={-10} y={81} size={0.6} color="#ffdb81"/>
    <RoomFlower x={107} y={81} size={0.6} color="#ffdb81"/>
  </g>;
}

function RibbonPanel({ x, y, color }: { x: number; y: number; color: string }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect x={-58} y={-50} width={116} height={100} rx={24} fill="#fff9ec" {...OUT}/>
    <path d="M-42-32H42V32H-42Z" fill={shade(color,0.55)} stroke={color} strokeWidth={2}/>
    <path d="M0-5Q-36-37-29-7Q-20 5 0 0Q36-32 29-5Q20 6 0 0L-12 26L0 18L12 26Z" fill={color} {...OUT}/>
    <RoomSparkle x={35} y={-22} size={6}/>
  </g>;
}

function Shelf({ x, y, craft = false }: { x: number; y: number; craft?: boolean }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect width={132} height={14} rx={6} fill="#edbb92" {...OUT}/>
    <path d="M12 14L28 34H12Z M120 14L104 34H120Z" fill="#ffdca9" {...OUT}/>
    {[0,1,2,3].map(i => <g key={i} transform={`translate(${15+i*28} 0)`}>
      <rect x={-7} y={-40-i%2*10} width={20} height={40+i%2*10} rx={craft?4:8} fill={CANDY[i]} {...OUT} strokeWidth={1.5}/>
      {craft ? <><path d="M-2-18H8" stroke="#fff" strokeWidth={4}/><path d="M2-44V-67M8-45V-62" stroke={LINE} strokeWidth={3}/><path d="M0-66L2-80L5-66Z" fill="#ff9bba"/></> : <path d="M-1-12H7" stroke="#fff" strokeWidth={4}/>}
    </g>)}
  </g>;
}

function CafeCase({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect width={190} height={125} rx={18} fill="#fff6df" {...OUT}/>
    <rect x={10} y={10} width={170} height={100} rx={12} fill="#dff4f1" {...OUT} strokeWidth={1.5}/>
    <path d="M12 59H178" stroke="#edbb92" strokeWidth={6}/>
    {[0,1,2].map(i => <g key={i} transform={`translate(${38+i*57} 45)`}>
      <path d="M-16 0L-11-16H11L16 0Z" fill="#e6ba87" {...OUT} strokeWidth={1.3}/>
      <path d="M-15-14Q-22-28-10-29Q-5-43 5-32Q20-31 16-15Z" fill={CANDY[i]} {...OUT} strokeWidth={1.3}/>
      <circle cy={-35} r={4} fill="#f3758e"/>
      <path d="M-13 45Q-16 24 0 24Q16 24 13 45Z" fill="#f3c981" {...OUT} strokeWidth={1.3}/>
      <path d="M-7 38Q0 30 7 38" fill="none" stroke="#c59167" strokeWidth={2}/>
    </g>)}
    <path d="M20 120H170" stroke="#ffacb9" strokeWidth={8}/>
  </g>;
}

/** All props here are permanent wall architecture, never selectable furniture. */
export function RoomWing({ id, side, p, sky, glass }: { id: ArtRoomId; side: 'left'|'right'; p: Palette; sky: string; glass: string }) {
  const left = side === 'left';
  return <g data-room-wing={side} transform={`translate(${left?-400:800} 0)`}>
    {id !== 'garden' && id !== 'studio' && <Garland variant={left?0:1}/>}
    {(id === 'kitchen' || id === 'bathroom') && <HouseholdArchitecture id={id} wing={side} sky={sky} p={p}/>}
    {id === 'studio' && <StudioWing side={side}/>}
    {id === 'dressing' && <>
      {left ? <><rect x={61} y={107} width={142} height={193} rx={62} fill="#ffd578" {...OUT}/><rect x={73} y={118} width={118} height={167} rx={54} fill={`url(#${glass})`}/><path d="M91 203L164 144M98 234L176 165" stroke="#fff" strokeWidth={7}/>{[130,171,213,255].map(y=><g key={y}><circle cx={66} cy={y} r={6} fill="#fff9d7"/><circle cx={199} cy={y} r={6} fill="#fff9d7"/></g>)}<RibbonPanel x={296} y={179} color="#ff9ac1"/></> : <><Window x={245} color="#ffb68e" sky={sky}/><rect x={37} y={106} width={155} height={204} rx={20} fill="#f3d9ff" {...OUT}/>{[121,177,233].map((y,i)=><g key={y}><rect x={49} y={y} width={131} height={51} rx={12} fill={shade(CANDY[i],0.5)} {...OUT}/><path d={`M103 ${y+25}h22`} stroke={LINE} strokeWidth={4}/></g>)}</>}
      <RoomFlower x={left?296:221} y={285} color="#9adace"/>
    </>}
    {id === 'garden' && <>
      <YardOrchard/>
      <path d={left ? 'M0 250Q140 207 400 274V330H0Z' : 'M0 248Q230 209 400 252V330H0Z'} fill="#d0e6ca"/>
      <path d={left ? 'M0 287Q190 267 400 305V330H0Z' : 'M0 285Q170 275 400 304V330H0Z'} fill="#b5d7b3"/>
      <path d="M0 302H400" stroke="#e7efe0" strokeWidth={5}/>
      {[42,90,138,186,234,282,330].map(x=><path key={x} d={`M${x} 323V284q6-12 12 0v39`} fill="#fff8e7" stroke="#98ba8c" strokeWidth={1.5}/>)}
      {left ? <><path d="M47 328V170Q47 97 128 97Q209 97 209 170V328" fill="none" stroke="#fff5d2" strokeWidth={17}/><path d="M55 324V170Q55 109 128 109Q201 109 201 170V324" fill="none" stroke="#83c590" strokeWidth={5}/>{[66,99,143,180,205].map((x,i)=><RoomFlower key={x} x={x} y={i===0||i===4?170:112} color={CANDY[i]} size={0.9}/>)}<path d="M260 265Q260 205 300 205Q340 205 340 265Z" fill="#b69ad5" {...OUT}/><path d="M270 260H330V321H270Z" fill="#ffdec0" {...OUT}/><path d="M294 321V291q12-16 22 0v30" fill="#b7dcd2" {...OUT}/></> : <><path d="M70 326V155M310 326V155M60 155H320" stroke="#d0ab7c" strokeWidth={12}/><path d="M104 157V273M273 157V273" stroke="#a8896d" strokeWidth={3}/><rect x={88} y={274} width={203} height={16} rx={8} fill="#fbb4c6" {...OUT}/><path d="M109 272V246H269V272" fill="#ffd8e4" {...OUT}/><path d="M107 126q45-55 99-18q58-18 111 31" fill="none" stroke="#8ac797" strokeWidth={11}/><RoomFlower x={122} y={115}/><RoomFlower x={268} y={119} color="#ffd578"/></>}
      {[42,127,237,358].map((x,i)=><g key={x}><path d={`M${x} 403v-26`} stroke="#72b87f" strokeWidth={3}/><RoomFlower x={x} y={375} color={CANDY[i]} size={0.8}/><path d={`M${x} 403q-17-17-18-6q6 15 18 6`} fill="#8bca8a"/></g>)}
    </>}
    {id === 'stage' && <>
      <path d="M0 0H400V320H0Z" fill={shade(p.accent,0.78)}/>
      <Garland variant={1}/>
      <path d="M20 78H380V98Q335 124 290 98Q245 124 200 98Q155 124 110 98Q65 124 20 98Z" fill="#ff9dba" {...OUT}/>
      {left ? <><path d="M54 97V286M133 97V286" stroke="#a69bd9" strokeWidth={12}/><path d="M39 297H148" stroke="#ffd578" strokeWidth={11}/><circle cx={94} cy={197} r={39} fill="none" stroke="#5ccbbc" strokeWidth={8}/><RibbonPanel x={274} y={193} color="#ff9fbc"/></> : <><Window x={251} color="#be9ee8" sky={sky}/><path d="M70 302V170M54 171H132M113 171V287" stroke="#c49975" strokeWidth={6}/><path d="M75 175C153 183 42 219 131 242S72 262 120 291" fill="none" stroke="#ff97b8" strokeWidth={9}/><RoomSparkle x={179} y={151} size={18}/></>}
      <path d="M0 317H400" stroke="#fff7ec" strokeWidth={13}/>
      {[173,222,359].map((x,i)=><RoomSparkle key={x} x={x} y={114+i*53}/>)}
    </>}
    {id === 'cafe' && <>
      {left ? <><Window x={63} color="#ffa6b9" sky={sky}/><CafeCase x={195} y={168}/></> : <><Window x={238} color="#90d9c9" sky={sky}/><Shelf x={42} y={225}/><path d="M60 278h86v-16H60Z" fill="#ffe4a5" {...OUT}/><path d="M69 261v-22h38v22m0-15q23-11 23 4q0 12-23 5" fill="#fff7ef" {...OUT}/><path d="M78 229q-8-12 0-20M94 229q-8-12 0-20" fill="none" stroke="#deaf9a" strokeWidth={2}/></>}
      <RoomFlower x={left?181:183} y={128} color="#ffb0cc"/>
      <path d="M20 310H380" stroke="#bde6d4" strokeWidth={7}/>
    </>}
    {id === 'craft' && <>
      {left ? <><Window x={245} color="#ffd481" sky={sky}/><Shelf x={40} y={196} craft/><Shelf x={40} y={290} craft/><RibbonPanel x={116} y={102} color="#9b82df"/></> : <><Window x={56} color="#95dcd0" sky={sky}/><rect x={211} y={113} width={158} height={147} rx={15} fill="#ffe3ba" {...OUT}/><path d="M221 125H359V248H221Z" fill="#fff5db"/>{[0,1,2,3].map(i=><g key={i} transform={`translate(${232+i%2*64} ${143+Math.floor(i/2)*60}) rotate(${i%2?8:-7})`}><rect width={44} height={43} fill={CANDY[i]}/><path d="M8 30L21 10L35 30Z" fill="#fff9ef"/></g>)}<Shelf x={223} y={302} craft/></>}
      <RoomSparkle x={left?209:181} y={125} size={14}/>
    </>}
  </g>;
}

export function NewRoomCenter({ id, p, sky }: { id: ArtRoomId; p: Palette; sky: string }) {
  if (id === 'kitchen' || id === 'bathroom') return <HouseholdArchitecture id={id} sky={sky} p={p}/>;
  if (id === 'cafe') return <g data-room-theme="strawberry-cafe">
    <rect x={218} y={111} width={370} height={187} rx={28} fill="#ffe2bc" {...OUT}/>
    <rect x={232} y={123} width={342} height={160} rx={20} fill={`url(#${sky})`}/>
    <path d="M232 240Q400 205 574 240V283H232Z" fill="#bce2bd"/>
    <path d="M345 123V283M458 123V283" stroke="#fff8ea" strokeWidth={8}/>
    <path d="M201 81H605L622 135H185Z" fill="#fff7df" {...OUT}/>
    {[0,1,2,3,4,5,6,7].map(i=><g key={i}><path d={`M${201+i*50} 81h25l${i<4?-4:4} 54h-27Z`} fill="#fa9fbb"/><path d={`M${185+i*55} 135h55v12q-28 25-55 0Z`} fill={i%2?'#fff7df':'#fa9fbb'} {...OUT} strokeWidth={1.5}/></g>)}
    <rect x={292} y={35} width={219} height={53} rx={24} fill="#fff7df" {...OUT}/>
    <path d="M377 61q-20-26-37-9q-13 21 14 34q30-11 23-25Z" fill="#ff8da7" {...OUT}/>
    <path d="M356 46l-8-12 13 5 6-9 4 15" fill="#86cda0"/>
    <path d="M405 58h53v22h-53Z M458 62q25-6 22 9q-1 12-22 5" fill="#b1e3d6" {...OUT}/>
    <path d="M415 49q-9-10 0-18M436 49q-9-10 0-18" fill="none" stroke="#deaa8e" strokeWidth={2}/>
    <CafeCase x={41} y={174}/>
    <rect x={615} y={133} width={139} height={157} rx={16} fill="#fff5de" {...OUT}/>
    <rect x={625} y={144} width={119} height={135} rx={10} fill="#7aaea0"/>
    <RoomFlower x={685} y={178} size={0.8} color="#ffe29b"/>
    <path d="M650 214H719M660 231H709M650 249H719" stroke="#fff5df" strokeWidth={5}/>
    <path d="M218 301H588" stroke="#f39fbb" strokeWidth={12}/>
    <RoomSparkle x={259} y={189}/><RoomSparkle x={546} y={187}/>
  </g>;
  if (id !== 'craft') return null;
  return <g data-room-theme="rainbow-craft">
    <path d="M279 166V136a123 123 0 0 1 246 0v30Z" fill="#ffb1c3" {...OUT}/>
    <path d="M296 166V136a106 106 0 0 1 212 0v30Z" fill="#ffdb91"/>
    <path d="M313 166V136a89 89 0 0 1 178 0v30Z" fill="#9cddca"/>
    <path d="M330 166V136a72 72 0 0 1 144 0v30Z" fill={`url(#${sky})`}/>
    <path d="M402 68V166M332 125H472" stroke="#fff9ed" strokeWidth={5}/>
    <path d="M261 169q-32-25-47 2q-29-4-29 16h119q4-25-24-19Z M539 169q32-25 47 2q29-4 29 16H496q-4-25 24-19Z" fill="#fff9ed" {...OUT}/>
    <rect x={283} y={205} width={239} height={83} rx={18} fill="#ffdeb3" {...OUT}/>
    {[0,1,2,3].map(i=><g key={i}><rect x={294+i*56} y={214} width={48} height={62} rx={10} fill={CANDY[i]} {...OUT} strokeWidth={1.5}/><circle cx={318+i*56} cy={244} r={4} fill="#fff7ed"/></g>)}
    <Shelf x={44} y={142} craft/><Shelf x={620} y={142} craft/>
    <rect x={43} y={183} width={142} height={109} rx={15} fill="#eed9ff" {...OUT}/>
    <path d="M57 197H172V280H57Z" fill="#fff7df"/>
    <path d="M83 260L89 221L126 209L144 239L126 267Z" fill="#ffb1c3" stroke="#bd83a6" strokeWidth={2}/>
    <path d="M89 221L126 267M83 260L126 209L144 239Z" fill="none" stroke="#fff7df" strokeWidth={2}/>
    <rect x={623} y={183} width={138} height={109} rx={15} fill="#c5ebdf" {...OUT}/>
    <RoomFlower x={691} y={236} color={p.accent2} size={1.9}/>
    <path d="M183 59Q400 99 619 59" fill="none" stroke={LINE} strokeWidth={2}/>
    {[203,257,550,598].map((x,i)=><g key={x}><path d={`M${x} 69v31`} stroke={LINE} strokeWidth={1.5}/><path d={`M${x-16} 99l16-15 16 15-16 17Z`} fill={CANDY[i]} {...OUT} strokeWidth={1.5}/></g>)}
    <RoomSparkle x={244} y={227}/><RoomSparkle x={563} y={227}/>
  </g>;
}

/** Permanent household architecture; loose objects are rendered by FurnitureArt. */
function HouseholdArchitecture({id,wing,sky,p}:{id:'kitchen'|'bathroom';wing?:'left'|'right';sky:string;p:Palette}) {
 const bath=id==='bathroom', width=wing?400:800;
 return <g data-household-center={wing?undefined:id} data-household-wing={wing?id:undefined}>
  <rect x={8} y={170} width={width-16} height={145} rx={8} fill={bath?'#e1f2ef':'#fff1d9'} {...OUT}/>
  {Array.from({length:Math.floor(width/40)},(_,i)=><g key={i}>
   <path d={`M${i*40} 174V315`} stroke={bath?'#a9d8d4':'#e9cfb0'} strokeWidth={2}/>
   <path d={`M${i*40+17} 210l4-4 4 4-4 4Z M${i*40+17} 285l4-4 4 4-4 4Z`} fill={bath?'#93c9cd':'#eeb5a9'}/>
  </g>)}
  <path d={`M8 245H${width-8}M8 315H${width-8}`} stroke="#fffaf0" strokeWidth={5}/>
  <Window x={wing?150:352} color={bath?'#a8ddd8':'#f7bf93'} sky={sky}/>
  {!wing && <>
   {bath ? <>
    <path d="M40 308V96q0-20 20-20h132q20 0 20 20v212Z" fill="#f3e3ef" {...OUT}/>
    <path d="M54 296V96h144v200Z" fill="#d8ebf2"/>
    <path d="M66 257L176 119M75 275L186 137" stroke="#fff" strokeWidth={7}/>
    <path d="M262 110H310M286 110V76" stroke="#b3a0b8" strokeWidth={6}/>
    <path d="M252 110h68l-12 24h-44Z" fill="#fff0c4" {...OUT}/>
    <Shelf x={591} y={267}/><RoomFlower x={655} y={110} size={1.3} color="#a9cfe0"/>
   </> : <>
    <path d="M37 306V202H235V306Z" fill="#b8d9cb" {...OUT}/>
    <path d="M42 201H231" stroke="#e1b68d" strokeWidth={12}/>
    <path d="M104 211V298M167 211V298" stroke="#81b3a1" strokeWidth={3}/>
    {[71,136,199].map(x=><circle key={x} cx={x} cy={239} r={4} fill="#fff9e8"/>)}
    <path d="M72 137H201L176 94H98Z" fill="#efd6b8" {...OUT}/><path d="M118 94V62H156V94" fill="#fff1de" {...OUT}/>
    <Shelf x={589} y={162}/><Shelf x={589} y={286}/>
   </>}
  </>}
  {wing && <>
   <Shelf x={wing==='left'?15:250} y={bath?280:158}/>
   <RibbonPanel x={wing==='left'?325:65} y={bath?116:265} color={bath?'#8ecac8':p.accent2}/>
   <RoomFlower x={wing==='left'?55:346} y={100} color={bath?'#a2cfdc':'#ffc88e'}/>
  </>}
  <RoomSparkle x={wing?125:300} y={149}/><RoomSparkle x={wing?279:546} y={85}/>
 </g>;
}

function YardOrchard() {
 return <g data-yard-scenery="orchard-and-path">
  <path d="M85 500Q170 430 190 340H232Q222 430 294 500Z" fill="#e4d5ad" stroke="#c9b889" strokeWidth={2}/>
  <path d="M157 438l65 5M137 468l105 4M183 385l43 4" stroke="#f7ebca" strokeWidth={4}/>
  <path d="M345 323V195M345 246l-33-35M345 230l29-31" stroke="#aa7e5f" strokeWidth={9}/>
  <path d="M298 210Q270 176 308 157Q300 119 341 121Q379 104 391 153Q421 183 384 212Z" fill="#8cc595" stroke="#629e79" strokeWidth={2}/>
  {[312,340,371].map((x,i)=><circle key={x} cx={x} cy={163+i%2*27} r={8} fill="#f4b587" stroke="#c98c72"/>)}
  <path d="M20 445H110L98 477H31Z" fill="#c19370" stroke="#8f715e" strokeWidth={2}/>
  {[39,63,87].map(x=><g key={x}><path d={`M${x} 445v-25`} stroke="#609a69" strokeWidth={3}/><path d={`M${x} 431q-22-24-20-4q7 15 20 4q23-22 20-5q-5 15-20 5`} fill="#8bbf79"/></g>)}
 </g>;
}
