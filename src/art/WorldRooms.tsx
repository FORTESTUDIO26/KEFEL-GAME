import { useId } from 'react';
import type { Palette } from '../content/catalog';
import { RoomBackground } from './Scenes';
import { INK, shade } from './color';

type RoomId = 'studio' | 'dressing' | 'garden' | 'stage';
type RoomProps = { id: RoomId; wall: string; floor: string; p: Palette };

const ROOM_LABELS: Record<RoomId, string> = {
  studio: 'סטודיו יצירתי', dressing: 'חדר הלבשה', garden: 'גן עם מזרקה', stage: 'במת התעמלות אמנותית',
};

/** Architecture only. The parent supplies movable objects above this layer. */
export function RoomScenery({ id, wall, floor, p }: RoomProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const sky = `${uid}roomSky`;
  const glass = `${uid}roomGlass`;
  const glow = `${uid}roomGlow`;
  const clip = `${uid}roomClip`;
  const trim = shade(p.accent, 0.65);
  const line = shade(INK, 0.35);

  return (
    <g pointerEvents="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id={clip}><rect width={800} height={500} /></clipPath>
        <linearGradient id={sky} x2="0" y2="1">
          <stop stopColor="#d8eff8" /><stop offset="1" stopColor="#f5fbef" />
        </linearGradient>
        <linearGradient id={glass} x2="1" y2="1">
          <stop stopColor="#e3f5fa" /><stop offset="0.5" stopColor="#fafcff" />
          <stop offset="1" stopColor={shade(p.accent2, 0.72)} />
        </linearGradient>
        <radialGradient id={glow}>
          <stop stopColor="#fff7d6" stopOpacity="0.65" />
          <stop offset="1" stopColor="#fff7d6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {id !== 'garden' && <RoomBackground wall={wall} floor={floor} p={p} />}

        {id === 'studio' && (
          <>
            <path d="M0 22H800 M0 34H800" stroke={p.soft} strokeWidth={9} />
            <path d="M0 43H800" stroke={trim} strokeWidth={2} />
            <path d="M23 320V135a63 63 0 0 1 126 0v185" fill={trim} stroke={line} strokeWidth={2.5} />
            <path d="M35 320V136a51 51 0 0 1 102 0v184Z" fill={p.soft} stroke={line} strokeWidth={2} />
            <path d="M45 315V139a41 41 0 0 1 82 0v176Z" fill={shade(p.accent, 0.82)} />
            <path d="M58 160H114V275H58Z" fill="none" stroke={trim} strokeWidth={3} />
            <path d="M59 140a27 27 0 0 1 54 0Z" fill={`url(#${glass})`} stroke={line} strokeWidth={2} />
            <path d="M86 114V140 M62 127L111 127" stroke="#fff" strokeWidth={3} />
            <circle cx={116} cy={222} r={5} fill="#e7c583" stroke={line} strokeWidth={1.5} />
            <path d="M24 319H149" stroke={shade(p.floor, -0.12)} strokeWidth={7} />
            <rect x={178} y={102} width={34} height={57} rx={15} fill={p.soft} stroke={line} strokeWidth={2} />
            <path d="M185 131H205" stroke={trim} strokeWidth={4} />
            <circle cx={195} cy={121} r={9} fill="#fff0c4" />
            <path d="M660 72H758V210H660Z" fill={trim} stroke={line} strokeWidth={2.5} />
            <rect x={668} y={80} width={82} height={121} rx={3} fill={`url(#${sky})`} />
            <path d="M669 166Q702 135 750 156V201H669Z" fill="#c5dfbc" />
            <path d="M709 79V204 M666 141H752" stroke={p.soft} strokeWidth={7} />
            <rect x={650} y={207} width={118} height={10} rx={4} fill={p.soft} stroke={line} strokeWidth={2} />
            <path d="M680 262H754 M686 263V302 M748 263V302" stroke={trim} strokeWidth={7} />
            <rect x={698} y={239} width={33} height={20} rx={5} fill={shade(p.accent2, 0.5)} stroke={line} strokeWidth={1.5} />
            <path d="M714 239V216 M714 228Q694 215 696 206Q715 205 714 228 M715 223Q734 207 736 215Q736 227 715 229" fill="#b2d5a9" stroke={line} strokeWidth={1.5} />
            <path d="M255 73Q400 100 546 73" fill="none" stroke={trim} strokeWidth={2} />
            {[278, 336, 400, 464, 522].map((x, i) => (
              <g key={x} transform={`translate(${x} ${83 + (2 - Math.abs(i - 2)) * 5})`}>
                <path d="M-10 0H10L0 18Z" fill={i % 2 ? shade(p.accent2, 0.6) : trim} stroke={line} strokeWidth={1.3} />
              </g>
            ))}
          </>
        )}

        {id === 'dressing' && (
          <>
            <rect width={800} height={40} fill={p.soft} />
            <path d="M0 40H800 M0 49H800" stroke={trim} strokeWidth={3} />
            <path d="M242 252V133a78 78 0 0 1 156 0v119Z" fill={trim} stroke={line} strokeWidth={2.5} />
            <path d="M253 243V134a67 67 0 0 1 134 0v109Z" fill={`url(#${sky})`} />
            <path d="M253 213Q300 188 387 215V243H253Z" fill="#c6dec7" />
            <path d="M320 67V246 M253 162H387" stroke={p.soft} strokeWidth={6} />
            <path d="M232 255H408" stroke={p.soft} strokeWidth={11} />
            <path d="M235 89Q219 162 238 236 M405 89Q420 163 403 236" fill="none" stroke={shade(p.accent2, 0.65)} strokeWidth={16} />
            {[52, 476].map((x) => (
              <g key={x}>
                <rect x={x} y={72} width={126} height={230} rx={60} fill={trim} stroke={line} strokeWidth={2.5} />
                <rect x={x + 12} y={83} width={102} height={205} rx={49} fill={`url(#${glass})`} stroke={line} strokeWidth={1.5} />
                <path d={`M${x + 31} 173l50-57 M${x + 32} 202l68-79`} stroke="#fff" strokeWidth={7} opacity={0.65} />
                {[112, 151, 190, 229, 268].map((y) => (
                  <g key={y} fill="#fff6d9" stroke={line} strokeWidth={1}>
                    <circle cx={x + 6} cy={y} r={5} /><circle cx={x + 120} cy={y} r={5} />
                  </g>
                ))}
                <rect x={x - 9} y={300} width={144} height={13} rx={5} fill={p.soft} stroke={line} strokeWidth={2} />
              </g>
            ))}
            <rect x={651} y={74} width={122} height={243} rx={18} fill={trim} stroke={line} strokeWidth={2.5} />
            <rect x={663} y={87} width={98} height={215} rx={10} fill={p.soft} />
            {[145, 209, 274].map((y, i) => (
              <g key={y}>
                <rect x={675} y={y - 33} width={32} height={31} rx={6} fill={shade(i % 2 ? p.accent : p.accent2, 0.65)} stroke={line} strokeWidth={1.5} />
                <path d={`M683 ${y - 34}v-6h16v6`} fill="none" stroke={line} strokeWidth={2} />
                <rect x={722} y={y - 25} width={26} height={23} rx={4} fill={shade(p.accent, 0.82)} />
                <path d={`M666 ${y}H759`} stroke={trim} strokeWidth={6} />
              </g>
            ))}
            <path d="M0 318H800" stroke={p.soft} strokeWidth={5} />
          </>
        )}

        {id === 'garden' && (
          <>
            <rect width={800} height={330} fill={`url(#${sky})`} />
            <circle cx={568} cy={76} r={52} fill={`url(#${glow})`} />
            <circle cx={568} cy={76} r={27} fill="#fff0bc" />
            {[ [215, 68], [407, 116], [687, 55] ].map(([x, y]) => (
              <path key={x} d={`M${x - 45} ${y}q-8-19 17-22q9-28 34-12q26-7 29 17q29 0 25 17Z`} fill="#fff" opacity={0.85} />
            ))}
            <path d="M0 274Q108 215 260 267T535 258T800 248V330H0Z" fill="#d0e6ca" />
            <path d="M0 305Q210 267 395 300T800 285V330H0Z" fill="#b5d7b3" />
            <path d="M0 302H800" stroke="#e7efe0" strokeWidth={5} />
            {[190, 238, 286, 334, 382, 430, 478, 526, 574].map((x) => (
              <path key={x} d={`M${x} 323V284q6-12 12 0v39`} fill="#f8f7e8" stroke="#a9c6a2" strokeWidth={1.5} />
            ))}
            <rect y={330} width={800} height={170} fill="#c4e2b5" />
            <path d="M364 330H442Q423 391 503 500H277Q371 403 364 330Z" fill="#f0e4ce" />
            <path d="M364 330Q371 403 277 500 M442 330Q423 391 503 500" fill="none" stroke="#ddd1bd" strokeWidth={2} />
            <path d="M342 378Q394 389 449 378 M318 435Q398 449 469 435" fill="none" stroke="#ded4c2" strokeWidth={2} />
            {[68, 745].map((x, i) => (
              <g key={x}>
                <path d={`M${x - 12} 327L${x - 8} 181H${x + 9}L${x + 14} 327Z`} fill="#c9ad92" stroke={line} strokeWidth={2} />
                <path d={`M${x} 267v-78m0 43l-27-28m27 9l27-27`} fill="none" stroke="#a88d78" strokeWidth={3} />
                <path d={`M${x - 65} 177q-30-52 15-74q-10-59 43-66q45-16 62 34q54 1 51 46q33 39-9 67q-72 29-162-7Z`} fill={i ? '#b4d5ba' : '#a6cfb1'} stroke={line} strokeWidth={2.5} />
                <path d={`M${x - 38} 118q7-31 34-28 M${x + 25} 148q20 8 34-8`} fill="none" stroke="#d9edcc" strokeWidth={7} />
                {[-31, 6, 40].map((dx, j) => <circle key={dx} cx={x + dx} cy={133 + (j % 2) * 34} r={6} fill={shade(p.accent2, 0.7)} />)}
              </g>
            ))}
            <ellipse cx={641} cy={334} rx={67} ry={12} fill="#93bc9a" opacity={0.4} />
            <path d="M591 299Q593 337 641 338Q689 337 691 299Z" fill="#e4ded3" stroke={line} strokeWidth={2.5} />
            <ellipse cx={641} cy={298} rx={50} ry={13} fill="#addce1" stroke={line} strokeWidth={2} />
            <path d="M630 291L635 250H647L652 291" fill="#eee8dd" stroke={line} strokeWidth={2} />
            <path d="M613 242Q617 261 641 261Q665 261 669 242Z" fill="#e4ded3" stroke={line} strokeWidth={2} />
            <ellipse cx={641} cy={241} rx={28} ry={8} fill="#b9e6e7" stroke={line} strokeWidth={1.5} />
            <path d="M641 239V217Q621 208 615 235 M641 217Q661 208 667 235 M619 254Q612 270 612 290 M663 254Q670 272 670 290" fill="none" stroke="#87cdd8" strokeWidth={3} />
            <circle cx={641} cy={213} r={5} fill="#b9e6e7" />
            {[29, 142, 215, 562, 707, 775].map((x, i) => (
              <g key={x} transform={`translate(${x} ${367 + (i % 3) * 37})`}>
                <path d="M-8 7L-11-2 M0 7V-7 M8 7L13-3" stroke="#91b788" strokeWidth={2} />
                <path d="M0-7V-19" stroke="#91b788" strokeWidth={2} />
                <circle cy={-20} r={6} fill={i % 2 ? '#fff4ca' : shade(p.accent2, 0.7)} />
                <circle cy={-20} r={2} fill="#d5b77d" />
              </g>
            ))}
          </>
        )}

        {id === 'stage' && (
          <>
            <rect width={800} height={320} fill={shade(p.accent, 0.78)} />
            <path d="M200 44L120 317H367Z M602 44L449 317H686Z" fill="#fff8dc" opacity={0.23} />
            <ellipse cx={403} cy={216} rx={237} ry={146} fill={`url(#${glow})`} />
            <path d="M0 0H145Q139 131 102 219Q109 269 131 320H0Z M800 0H655Q661 131 698 219Q691 269 669 320H800Z" fill={shade(p.accent, 0.25)} stroke={line} strokeWidth={2.5} />
            <path d="M24 41Q42 146 28 309 M57 42Q80 150 58 309 M91 43Q118 151 94 212 M776 41Q758 146 772 309 M743 42Q720 150 742 309 M709 43Q682 151 706 212" fill="none" stroke={shade(p.accent, -0.08)} strokeWidth={4} opacity={0.6} />
            <path d="M22 219Q65 239 103 219 M778 219Q735 239 697 219" stroke="#e8ca89" strokeWidth={8} fill="none" />
            <path d="M0 0H800V42Q720 86 640 42Q560 86 480 42Q400 86 320 42Q240 86 160 42Q80 86 0 42Z" fill={shade(p.accent, 0.12)} stroke={line} strokeWidth={2.5} />
            <path d="M0 15H800" stroke={shade(p.accent, 0.48)} strokeWidth={6} />
            {[209, 400, 591].map((x, i) => (
              <g key={x} transform={`translate(${x} 72) rotate(${i === 0 ? 16 : i === 2 ? -16 : 0})`}>
                <path d="M0-19V0" stroke={line} strokeWidth={3} />
                <rect x={-19} width={38} height={24} rx={7} fill={p.soft} stroke={line} strokeWidth={2} />
                <ellipse cy={24} rx={14} ry={5} fill="#fff0bc" stroke={line} strokeWidth={1.5} />
              </g>
            ))}
            <circle cx={186} cy={200} r={43} fill="none" stroke={line} strokeWidth={8} />
            <circle cx={186} cy={200} r={43} fill="none" stroke={shade(p.accent2, 0.35)} strokeWidth={5} />
            <path d="M186 115V155" stroke={trim} strokeWidth={3} />
            <path d="M605 153Q551 107 550 157T611 197Q659 195 641 235Q621 268 574 241" fill="none" stroke={shade(p.accent2, 0.38)} strokeWidth={8} />
            <path d="M608 154L625 131" stroke={line} strokeWidth={4} />
            {[ [303, 150], [470, 132], [401, 235] ].map(([x, y]) => (
              <path key={x} d={`M${x} ${y - 10}Q${x + 2} ${y - 2} ${x + 10} ${y}Q${x + 2} ${y + 2} ${x} ${y + 10}Q${x - 2} ${y + 2} ${x - 10} ${y}Q${x - 2} ${y - 2} ${x} ${y - 10}Z`} fill="#fff3cf" />
            ))}
            <rect y={317} width={800} height={13} fill={p.soft} />
            <path d="M130 347H670L755 481H45Z" fill={shade(p.soft, -0.025)} stroke={shade(p.accent, 0.65)} strokeWidth={3} />
            <path d="M153 359H647L718 467H82Z" fill="none" stroke={shade(p.accent2, 0.65)} strokeWidth={2} />
            <path d="M0 494H800" stroke={shade(p.floor, -0.1)} strokeWidth={5} />
          </>
        )}
      </g>
    </g>
  );
}

/** A separate SVG instance keeps every paint-server ID unique in room pickers. */
export function RoomThumbnail({ id, p }: { id: RoomId; p: Palette }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label={ROOM_LABELS[id]}>
      <RoomScenery id={id} wall="wall_plain" floor="floor_wood" p={p} />
    </svg>
  );
}
