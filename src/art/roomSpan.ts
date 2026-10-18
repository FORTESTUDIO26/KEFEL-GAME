// How wide every room is (room units). The screen shows about 800 units; the rest opens when you swipe sideways.
// Centre stays 0…800 (where the old rooms were), each side adds 800 more.
export const ROOM_X0 = -800;
export const ROOM_X1 = 1600;
export const ROOM_W = ROOM_X1 - ROOM_X0;
export const ROOM_H = 500;
/** furniture stays this far inside the edges; the dog a little further */
export const ITEM_MIN_X = ROOM_X0 + 20;
export const ITEM_MAX_X = ROOM_X1 - 20;
export const DOG_MIN_X = ROOM_X0 + 40;
export const DOG_MAX_X = ROOM_X1 - 40;
