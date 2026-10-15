// Drawings for items added after the original collection. Keyed by catalog id.
// Split into more files and spread them in here as the collection grows.
import type { FurnitureArtFn, WearableArt } from './extraArt';

export const WEARABLE_ENTRIES: Record<string, WearableArt> = {};
export const FURNITURE_ENTRIES: Record<string, FurnitureArtFn> = {};
