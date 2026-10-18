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
 * Display heights in room units — THE place to tune sizes. Scale: the sofa back is ~120 units ≈ 85 cm,
 * so 1 unit ≈ 0.71 cm (a man of 1.78 m ≈ 250; the studio dog is ~134). Dad > Mom; Lior > Noa > Amit >
 * Yonatan Shai. Width always follows each image's own aspect ratio.
 */
export const FAMILY_HEIGHTS: Record<FamilyId, number> = {
  lidor: 250,
  sharon: 232,
  lior: 197,
  noa: 183,
  amit: 169,
  yonatan_shai: 158,
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
  { id: 'lidor', name: 'אבא', src: lidorSrc, px: { w: 327, h: 800 } },
  { id: 'sharon', name: 'אמא', src: sharonSrc, px: { w: 237, h: 744 } },
  LIOR_VERSION === 'latest'
    ? { id: 'lior', name: 'ליאור', src: liorSrc, px: { w: 195, h: 632 } }
    : { id: 'lior', name: 'ליאור', src: liorAltSrc, px: { w: 193, h: 632 } },
  { id: 'noa', name: 'נועה', src: noaSrc, px: { w: 190, h: 584 } },
  { id: 'amit', name: 'עמית', src: amitSrc, px: { w: 237, h: 532 } },
  { id: 'yonatan_shai', name: 'יונתן שי', src: yonatanSrc, px: { w: 171, h: 496 } },
];

export function familyById(id: string): FamilyMember | undefined {
  return FAMILY.find((m) => m.id === id);
}

/** Size in room units: the set height, and the width from the image's own aspect ratio (never stretched). */
export function familySize(m: FamilyMember): { w: number; h: number } {
  const h = FAMILY_HEIGHTS[m.id];
  return { w: (h * m.px.w) / m.px.h, h };
}
