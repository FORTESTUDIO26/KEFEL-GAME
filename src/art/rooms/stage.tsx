// Room art: stage. SCENERY draws the whole room architecture (walls, floor, windows, built-ins) across
// x ROOM_X0…ROOM_X1 (art/roomSpan.ts), y 0…500, floor line about y 330. null = the older drawing.
// ITEMS draws this room's furniture by catalog id (overrides older drawings with the same id).
import type { FurnitureArtFn } from '../extraArt';
import type { RoomSceneryFn } from './types';

export const SCENERY: RoomSceneryFn | null = null;
export const ITEMS: Record<string, FurnitureArtFn> = {};
