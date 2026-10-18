// A small square preview of a wall or floor pattern, for the item menu (no names, just the look).
import { useId } from 'react';
import type { Background, Palette } from '../content/catalog';
import { shade } from '../art/color';

export function SurfaceSwatch({ bg, p }: { bg: Background; p: Palette }) {
  const id = useId().replace(/:/g, '') + 'sw';
  const kind = bg.baseId ?? bg.id;
  if (bg.type === 'wall') {
    const c = bg.color ?? p.wallAccent;
    const fill = bg.color ? shade(c, 0.8) : p.wall;
    return (
      <svg viewBox="0 0 60 60" aria-hidden="true" className="surface-swatch">
        <defs>
          <pattern id={id} width={30} height={30} patternUnits="userSpaceOnUse">
            <rect width={30} height={30} fill={fill} />
            {kind === 'wall_stripes' && <rect width={13} height={30} fill={c} />}
            {kind === 'wall_dots' && <circle cx={15} cy={15} r={5} fill={c} />}
            {kind === 'wall_hearts' && <path d="M15 21c-16-9-8-20 0-12c8-8 16 3 0 12Z" fill={c} />}
            {kind === 'wall_stars' && <path d="M15 7l3 5 5 3-5 3-3 5-3-5-5-3 5-3Z" fill={c} />}
            {kind === 'wall_ribbons' && <path d="M0 22C8 6 16 30 30 12" fill="none" stroke={c} strokeWidth={4} />}
          </pattern>
        </defs>
        <rect width={60} height={60} fill={`url(#${id})`} />
        {bg.rare && <path d="M48 4l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#ffc93c" stroke="#33203f" strokeWidth={1} />}
      </svg>
    );
  }
  const c = bg.color ?? p.floorAccent;
  const fill = bg.color ? shade(c, 0.65) : p.floor;
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true" className="surface-swatch">
      <defs>
        <pattern id={id} width={40} height={20} patternUnits="userSpaceOnUse">
          <rect width={40} height={20} fill={fill} />
          {kind === 'floor_wood' && <path d="M0 10H40M0 20H40M15 0V10M35 10V20" stroke={c} strokeWidth={2} />}
          {kind === 'floor_tiles' && <><rect width={20} height={20} fill={bg.color ? shade(c, 0.9) : '#fbf8ff'} /><rect x={20} width={20} height={20} fill={bg.color ? shade(c, 0.8) : p.soft} /><path d="M0 0H40M0 0V20M20 0V20" stroke={c} strokeWidth={1.5} /></>}
          {kind === 'floor_checker' && <><rect width={20} height={10} fill={bg.color ?? p.wallAccent} /><rect x={20} y={10} width={20} height={10} fill={bg.color ?? p.wallAccent} /><rect x={20} width={20} height={10} fill="#fff" /><rect y={10} width={20} height={10} fill="#fff" /></>}
          {kind === 'floor_carpet' && <><rect width={40} height={20} fill={shade(bg.color ?? p.accent, 0.62)} /><circle cx={10} cy={5} r={1.5} fill={shade(bg.color ?? p.accent, 0.45)} /></>}
        </pattern>
      </defs>
      <rect width={60} height={60} fill={`url(#${id})`} />
      {bg.rare && <path d="M48 4l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#ffc93c" stroke="#33203f" strokeWidth={1} />}
    </svg>
  );
}
