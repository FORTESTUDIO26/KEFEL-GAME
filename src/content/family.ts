// The family: ready-made illustrations (see Desktop\liori-studio-assets\family for the untouched
// originals, the full-resolution cutouts and Lior's alternative). Each image is cropped to the
// visible figure with the feet on the bottom edge, at 4 px per room unit, so they stand on one line.
import lidorSrc from '../assets/family/lidor.webp';
import sharonSrc from '../assets/family/sharon.webp';
import liorSrc from '../assets/family/lior.webp';
import liorAltSrc from '../assets/family/lior-alt.webp';
import noaSrc from '../assets/family/noa.webp';
import amitSrc from '../assets/family/amit.webp';
import yonatanSrc from '../assets/family/yonatan-shai.webp';

export type FamilyId = 'lidor' | 'sharon' | 'lior' | 'noa' | 'amit' | 'yonatan_shai';

/**
 * Display heights in room units — THE place to tune sizes (room height is 500).
 * Sharon found 250…158 too small next to the furniture and dogs, so everyone is 35% larger.
 * Dad > Mom; Lior > Noa > Amit > Yonatan Shai. Width always follows each image's own aspect ratio.
 */
export const FAMILY_HEIGHTS: Record<FamilyId, number> = {
  lidor: 338,
  sharon: 313,
  lior: 266,
  noa: 247,
  amit: 228,
  yonatan_shai: 213,
};

/** Lior: 'latest' (looking ahead) is the default; 'tilted' is the earlier version with the tilted head. */
export const LIOR_VERSION: 'latest' | 'tilted' = 'latest';

export interface FamilyMember {
  id: FamilyId;
  name: string;
  src: string;
  /** image size in pixels (for the aspect ratio) */
  px: { w: number; h: number };
}

export const FAMILY: FamilyMember[] = [
  { id: 'lidor', name: 'אבא', src: lidorSrc, px: { w: 343, h: 838 } },
  { id: 'sharon', name: 'אמא', src: sharonSrc, px: { w: 261, h: 819 } },
  LIOR_VERSION === 'latest'
    ? { id: 'lior', name: 'ליאור', src: liorSrc, px: { w: 329, h: 1064 } }
    : { id: 'lior', name: 'ליאור', src: liorAltSrc, px: { w: 325, h: 1064 } },
  { id: 'noa', name: 'נועה', src: noaSrc, px: { w: 321, h: 988 } },
  { id: 'amit', name: 'עמית', src: amitSrc, px: { w: 406, h: 912 } },
  { id: 'yonatan_shai', name: 'יונתן שי', src: yonatanSrc, px: { w: 295, h: 852 } },
];

export function familyById(id: string): FamilyMember | undefined {
  return FAMILY.find((m) => m.id === id);
}

/** Size in room units: the set height, and the width from the image's own aspect ratio (never stretched). */
export function familySize(m: FamilyMember): { w: number; h: number } {
  const h = FAMILY_HEIGHTS[m.id];
  return { w: (h * m.px.w) / m.px.h, h };
}
