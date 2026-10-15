import { furnitureById, type Furniture } from '../content/catalog';
import type { PlacedItem, RoomLayout, SaveData } from './types';
import { characterHalfWidth, isCharacter } from './characters';

const DOG_UID = '__dog__';
const SNAP_DISTANCE = 40;
// Coordinates are fractions of catalog bounds, measured from the original SVG
// bottom-centre origin. Each tuple is [left, right, height above the origin].
type Surface = readonly [number, number, number];
const surfaces: Record<string, readonly Surface[]> = {
  kitchen_table: [[-90/190,90/190,70/100]],
  kitchen_sink: [[-66/140,66/140,93/140]],
  kitchen_stove: [[-62/130,62/130,132/145]],
  vanity: [[-68/140,68/140,112/190]],
  dressing_table: [[-62/130,62/130,84/170]],
  sewing: [[-72/150,72/150,74/130]],
  side_lamp: [[-30/74,30/74,62/130]],
  shelf: [[-84/170,84/170,80/90],[-84/170,84/170,14/90]],
  wall_shelves: [[-72/150,72/150,58/110],[-72/150,72/150,8/110]],
  sofa: [[-76/210,76/210,62/120]],
  loveseat: [[-58/170,58/170,62/110]],
  armchair: [[-38/120,38/120,66/125]],
  cozy_chair: [[-52/110,52/110,26/110]],
  pouf: [[-30/74,30/74,40/56]],
  dog_bed: [[-64/130,64/130,26/60]],
  round_dog_bed: [[-58/120,58/120,28/62]],
  yard_bench: [[-73/170,73/170,48/105]],
  // modular kitchen (all worktops at 112 units) and the newer collections
  kitchen_counter: [[-58/120,58/120,112/114]],
  kitchen_counter_drawers: [[-43/90,43/90,112/114]],
  kitchen_sink_counter: [[-63/130,63/130,112/158]],
  kitchen_oven_range: [[-48/100,48/100,112/126]],
  kitchen_fridge_tall: [[-44/100,44/100,220/224]],
  kitchen_upper: [[-66/140,66/140,84/86]],
  kitchen_family_table: [[-86/180,86/180,96/98]],
  rg_podium: [[-34/220,34/220,104/106],[-106/220,-38/220,74/106],[38/220,106/220,54/106]],
  dance_dj_booth: [[-78/160,78/160,100/130]],
};
const seats = new Set(['sofa','loveseat','armchair','cozy_chair','pouf','dog_bed','round_dog_bed','yard_bench']);
const smallObjects = new Set(['kitchen_cups','kitchen_pots','kitchen_plates','kitchen_kettle',
  'kitchen_toaster','kitchen_bread','bowl','flower_pot','plant_cactus','bath_soap',
  'kitchen_pan','kitchen_fruit_bowl','kitchen_tray','kitchen_cake','kitchen_jars','kitchen_cutlery',
  'kitchen_mixing_bowl','kitchen_treat_jar','rg_trophy','dance_boombox']);

function base(item: Furniture | undefined): Furniture | undefined {
  const seen = new Set<string>();
  while (item?.baseId) {
    if (seen.has(item.id)) return undefined;
    seen.add(item.id);
    item = furnitureById(item.baseId);
  }
  return item;
}

function nodes(room: RoomLayout) {
  return new Map<string, {x:number;y:number;supportUid?:string}>([
    ...room.items.map(p => [p.uid,p] as const), [DOG_UID,room.dog],
  ]);
}

/** Invalid cyclic/ambiguous rooms are never partially changed. */
function hasCycle(room: RoomLayout): boolean {
  const entries = nodes(room);
  if (entries.size !== room.items.length + 1) return true;
  const complete = new Set<string>();
  for (const uid of entries.keys()) {
    const path = new Set<string>();
    let at: string | undefined = uid;
    while (at && entries.has(at) && !complete.has(at)) {
      if (path.has(at)) return true;
      path.add(at);
      at = entries.get(at)?.supportUid;
    }
    for (const id of path) complete.add(id);
  }
  return false;
}

/** Checks host presence, object compatibility and the proposed attachment chain.
 * RoomLayout contains placed objects only; ownership must be filtered by callers.
 */
export function isValidSupport(room: RoomLayout, uid: string, supportUid: string): boolean {
  if (uid === supportUid || hasCycle(room)) return false;
  const host = room.items.find(p => p.uid === supportUid);
  const hostBase = base(host && furnitureById(host.itemId));
  if (!host || !hostBase || !surfaces[hostBase.id] || !validPlacement(host)) return false;
  const child = room.items.find(p => p.uid === uid);
  if (uid === DOG_UID || (child && isCharacter(child.itemId))) {
    // dogs and people sit on seats (sofa, armchair, pouf, dog bed, bench)
    if (!seats.has(hostBase.id) || (child && !validPlacement(child))) return false;
  } else {
    const child = room.items.find(p => p.uid === uid);
    const childBase = base(child && furnitureById(child.itemId));
    if (!child || !childBase || !validPlacement(child) || !smallObjects.has(childBase.id) || seats.has(hostBase.id)) return false;
  }
  const entries = nodes(room);
  let at: string | undefined = supportUid;
  while (at && entries.has(at)) {
    if (at === uid) return false;
    at = entries.get(at)?.supportUid;
  }
  return true;
}

function validPlacement(item: PlacedItem): boolean {
  return Number.isFinite(item.x) && Number.isFinite(item.y) && Number.isFinite(item.scale) && item.scale > 0;
}

/** point is the dragged object's bottom-centre, already adjusted for its grab offset. */
export function resolveDrop(room: RoomLayout, uid: string, point: {x:number;y:number}): {x:number;y:number;supportUid?:string} {
  const free = {x:point.x,y:point.y};
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return free;
  const child = room.items.find(p => p.uid === uid);
  const childItem = child && furnitureById(child.itemId);
  const character = !!child && isCharacter(child.itemId);
  if (uid !== DOG_UID && (!child || (!childItem && !character) || !validPlacement(child))) return free;
  // Dog foot contact spans 64 world units at Studio's fixed 0.56 rendering scale.
  const halfWidth = uid === DOG_UID ? 32 : character ? characterHalfWidth(child!.itemId) : childItem!.w * child!.scale / 2;
  let best: {x:number;y:number;supportUid:string} | undefined;
  let bestDistance = Infinity;
  // Reverse placement order gives visually later hosts priority for equal distances.
  for (const host of [...room.items].reverse()) {
    if (!isValidSupport(room,uid,host.uid)) continue;
    const item = furnitureById(host.itemId)!;
    const original = base(item)!;
    for (const [left,right,height] of surfaces[original.id]) {
      const direction = host.flip ? -1 : 1;
      const a = host.x + left * item.w * host.scale * direction;
      const b = host.x + right * item.w * host.scale * direction;
      const min = Math.min(a,b) + halfWidth, max = Math.max(a,b) - halfWidth;
      if (min > max) continue;
      const x = Math.max(min,Math.min(max,point.x));
      const y = host.y - height * item.h * host.scale;
      const distance = Math.hypot(x-point.x,y-point.y);
      if (distance <= SNAP_DISTANCE && distance < bestDistance) {
        bestDistance = distance;
        best = {x,y,supportUid:host.uid};
      }
    }
  }
  return best ?? free;
}

/** Operates on save.studio, like updatePlaced; use editRoom for world rooms.
 * Applies only a translation: callers resolve the final drop and attachment separately.
 */
export function moveWithSupports(save: SaveData, uid: string, x: number, y: number): SaveData {
  const room = save.studio, entries = nodes(room), root = entries.get(uid);
  if (!root || !Number.isFinite(x) || !Number.isFinite(y) || hasCycle(room)) return save;
  const dx = x-root.x, dy = y-root.y;
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || (!dx && !dy)) return save;
  const moving = new Set([uid]);
  const children = new Map<string,string[]>();
  for (const [id,node] of entries) {
    if (node.supportUid) children.set(node.supportUid,[...(children.get(node.supportUid) ?? []),id]);
  }
  const queue = [uid];
  for (let i=0;i<queue.length;i++) {
    for (const id of children.get(queue[i]) ?? []) {
      if (!moving.has(id)) { moving.add(id); queue.push(id); }
    }
  }
  for (const id of moving) {
    const node = entries.get(id)!;
    if (!Number.isFinite(node.x+dx) || !Number.isFinite(node.y+dy)) return save;
  }
  return {...save,studio:{...room,
    items:room.items.map(p => moving.has(p.uid) ? {...p,x:p.x+dx,y:p.y+dy} : p),
    dog:moving.has(DOG_UID) ? {...room.dog,x:room.dog.x+dx,y:room.dog.y+dy} : room.dog,
  }};
}

/** Before removing a host, detach only its immediate dependents, without moving them. */
export function detachSupports(save: SaveData, uid: string): SaveData {
  const room = save.studio;
  if (!nodes(room).has(uid) || hasCycle(room)) return save;
  const detach = <T extends {supportUid?:string}>(node:T):T => {
    if (node.supportUid !== uid) return node;
    const copy = {...node};
    delete copy.supportUid;
    return copy;
  };
  const items = room.items.map(detach), dog = detach(room.dog);
  if (dog === room.dog && items.every((p,i) => p === room.items[i])) return save;
  return {...save,studio:{...room,items,dog}};
}
