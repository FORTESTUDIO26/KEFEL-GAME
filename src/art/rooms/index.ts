// Merges every room's art file (one file per room so they can be designed separately).
import type { RoomId } from '../../state/types';
import type { FurnitureArtFn } from '../extraArt';
import * as bathroom from './bathroom';
import * as cafe from './cafe';
import * as craft from './craft';
import * as dressing from './dressing';
import * as garden from './garden';
import * as kitchen from './kitchen';
import * as stage from './stage';
import * as studio from './studio';
import type { RoomSceneryFn } from './types';

const ROOMS = { studio, kitchen, dressing, garden, bathroom, stage, cafe, craft } as const;
export const ROOM_SCENERY: Partial<Record<RoomId | 'kitchen' | 'bathroom', RoomSceneryFn>> = Object.fromEntries(
  Object.entries(ROOMS).filter(([, m]) => m.SCENERY).map(([id, m]) => [id, m.SCENERY!]),
);
export const ROOM_ITEM_ART: Record<string, FurnitureArtFn> = Object.assign({}, ...Object.values(ROOMS).map((m) => m.ITEMS));
