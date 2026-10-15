// Drawings for items added after the original collection. Keyed by catalog id.
// Split into more files and spread them in here as the collection grows.
import type { FurnitureArtFn, WearableArt } from './extraArt';
import { KITCHEN_FURNITURE_ART } from './extra/kitchenArt';
import { RG_FURNITURE_ART, RG_WEARABLE_ART } from './extra/rgArt';
import { DANCE_FURNITURE_ART, DANCE_WEARABLE_ART } from './extra/danceArt';

export const WEARABLE_ENTRIES: Record<string, WearableArt> = {
  ...RG_WEARABLE_ART,
  ...DANCE_WEARABLE_ART,
};
export const FURNITURE_ENTRIES: Record<string, FurnitureArtFn> = {
  ...KITCHEN_FURNITURE_ART,
  ...RG_FURNITURE_ART,
  ...DANCE_FURNITURE_ART,
};
