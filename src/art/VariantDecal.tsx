/** Small stitched motif for furniture variants; gold sparkle marks earned collections. */
export function VariantDecal({ x, y, rare = false, color = '#b48ef0' }: { x: number; y: number; rare?: boolean; color?: string }) {
 return <g data-variant-decal={rare ? 'rare' : 'atelier'} transform={`translate(${x} ${y})`} pointerEvents="none">
  {rare ? <><path d="M0,-10 L3,-3 L10,0 L3,3 L0,10 L-3,3 L-10,0 L-3,-3Z" fill="#f2c14e" stroke="#9a6c20" strokeWidth={1}/><path d="M16,-15 v8 M12,-11 h8 M-16,6 v6 M-19,9 h6" stroke="#f2c14e" strokeWidth={2} strokeLinecap="round"/><circle cx={0} cy={0} r={2} fill="#fff8da"/></> : <><path d="M-12,0 Q-6,-8 0,0 Q6,8 12,0" fill="none" stroke={color} strokeWidth={3}/><circle cx={-12} cy={0} r={3} fill="#fff"/><circle cx={12} cy={0} r={3} fill="#fff"/></>}
 </g>;
}
