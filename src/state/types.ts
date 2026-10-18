import type { BackdropId, Slot,ShopKind } from '../content/catalog';
import type { LearningData } from '../learning/data';

import type { BirthdayData } from './birthday';
import type { PlayTime } from './playTime';
import type { HumanOutfit } from '../content/humans';
export const SCHEMA_VERSION = 9;
export type RoomId = 'studio' | 'dressing' | 'garden' | 'stage' | 'cafe' | 'craft' | 'kitchen' | 'bathroom';
export interface RoomLayout { wall:string; floor:string; items:PlacedItem[]; order?:string[]; dog:{x:number;y:number;supportUid?:string} }
export interface RoomChallenge {
 roomId:Exclude<RoomId,'studio'>;
 facts:string[];
 index:number;
 /** help was opened for the current question */
 helped:boolean;
 /** answers remembered alone in this attempt */
 score:number;
 /** facts that needed help, were wrong, or came too soon after seeing the answer */
 missed:string[];
 /** all questions answered without 10/10: the result is shown */
 finished:boolean;
}
export interface WorldData {
 activeRoom:RoomId; unlocked:RoomId[];
 rooms:Record<Exclude<RoomId,'studio'>,RoomLayout>;
 /** room challenge: 10 learned facts; the room opens only with 10/10 remembered alone in one attempt */
 opening:null|RoomChallenge;
 activities:{garden:number;stage:number;cafe:number;craft:number;kitchen:number;bathroom:number};
}

export interface PlacedItem {
  uid: string;
  supportUid?:string;
  itemId: string;
  /** bottom-centre position in room units (wide rooms span −400…1200, height 500) */
  x: number;
  y: number;
  scale: number;
  flip: boolean;
  /** chosen colour; the palette colour when missing */
  color?: string;
  /** clothes of a person placed in the room (see state/characters) */
  outfit?: HumanOutfit;
}

export interface OutfitPiece {
  itemId: string;
  color: string;
}

export type Outfit = Partial<Record<Slot, OutfitPiece>>;

export interface AlbumEntry {
  id: string;
  dogId: string;
  outfit: Outfit;
  backdrop: BackdropId;
  title: string;
  requestId: string | null;
  directionId: string | null;
  stars: number;
  createdAt: number;
}

export interface Settings {
  tables: number[];
  sound: boolean;
  reduceMotion: boolean;
}

export interface Progress {
  roundsCompleted: number;
  clientsServed: number;
  /** distinct days with at least one completed round */
  practiceDays: string[];
  milestonesClaimed: number[];
  recentRequests: string[];
  recentDogs: string[];
}

export interface GiftRecord {kind:ShopKind;id:string;category:string;missionId:string;at:number}
export interface SaveData {
  /** design / learning balance for this profile */
  playTime: PlayTime;
  birthday:BirthdayData;
  rewards:{claimed:string[];gifts:GiftRecord[]};
  version: number;
  createdAt: number;
  updatedAt: number;
  profile: {
    studioName: string;
    paletteId: string;
    ownDogId: string;
    onboarded: boolean;
  };
  coins: number;
  totalEarned: number;
  owned: { wearables: string[]; furniture: string[]; backgrounds: string[] };
  studio: RoomLayout;
  world: WorldData;
  outfits: Record<string, Outfit>;
  metDogs: string[];
  album: AlbumEntry[];
  learning: LearningData;
  progress: Progress;
  settings: Settings;
  tips: string[];
}
