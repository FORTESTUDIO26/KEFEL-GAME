// Merges every room's content file (one file per room so they can be designed separately).
import { ROOM as bathroom } from './bathroom';
import { ROOM as cafe } from './cafe';
import { ROOM as craft } from './craft';
import { ROOM as dressing } from './dressing';
import { ROOM as garden } from './garden';
import { ROOM as kitchen } from './kitchen';
import { ROOM as stage } from './stage';
import { ROOM as studio } from './studio';
import type { RoomContent } from './types';

const ALL: RoomContent[] = [studio, kitchen, dressing, garden, bathroom, stage, cafe, craft];
export const ROOM_FURNITURE = ALL.flatMap((r) => r.furniture);
export const ROOM_INTERACTIVE = Object.assign({}, ...ALL.map((r) => r.interactive)) as RoomContent['interactive'];
export const ROOM_SURFACES = Object.assign({}, ...ALL.map((r) => r.surfaces)) as RoomContent['surfaces'];
export const ROOM_SEATS = ALL.flatMap((r) => r.seats);
export const ROOM_SMALL = ALL.flatMap((r) => r.small);
