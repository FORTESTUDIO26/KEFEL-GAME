// Registry for item drawings that live outside Dog.tsx / Furniture.tsx.
// Entries are declared in extraArtEntries.tsx (and files it imports), so adding
// new items never needs edits to the large drawing switches.
import type { ReactNode } from 'react';
import type { Palette } from '../content/catalog';
import type { Rig } from './Dog';
import { FURNITURE_ENTRIES, WEARABLE_ENTRIES } from './extraArtEntries';

/** Where a clothing piece is drawn relative to the dog's body parts (back to front). */
export type WearableLayer = 'back' | 'bodyUnder' | 'feet' | 'bodyOver' | 'backFront' | 'neck' | 'head' | 'eyes' | 'prop';
export interface WearableArtProps {
  r: Rig;
  /** chosen colour */
  c: string;
  /** unique id prefix for clip paths / gradients */
  uid: string;
}
export type WearableArt = Partial<Record<WearableLayer, (props: WearableArtProps) => ReactNode>>;

export interface FurnitureArtProps {
  p: Palette;
  /** main colour (the chosen colour, or the palette accent) */
  a: string;
  /** secondary colour */
  b: string;
  /** interactive state (see content/interactive.ts); undefined = the item's resting look */
  state?: string;
}
/** Drawn around (0,0) = bottom-centre, growing upwards (negative y), like Furniture.tsx. */
export type FurnitureArtFn = (props: FurnitureArtProps) => ReactNode;

export const EXTRA_WEARABLE_ART: Record<string, WearableArt> = WEARABLE_ENTRIES;
export const EXTRA_FURNITURE_ART: Record<string, FurnitureArtFn> = FURNITURE_ENTRIES;

export function hasExtraWearable(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(EXTRA_WEARABLE_ART, id);
}

export function extraWearable(id: string, layer: WearableLayer, props: WearableArtProps): ReactNode {
  return EXTRA_WEARABLE_ART[id]?.[layer]?.(props) ?? null;
}
