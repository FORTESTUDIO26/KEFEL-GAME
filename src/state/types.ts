import type { BackdropId, Slot } from '../content/catalog';
import type { LearningData } from '../learning/data';

export const SCHEMA_VERSION = 2;

export interface PlacedItem {
  uid: string;
  itemId: string;
  /** bottom-centre position in room units (800×500) */
  x: number;
  y: number;
  scale: number;
  flip: boolean;
  /** chosen colour; the palette colour when missing */
  color?: string;
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

export interface SaveData {
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
  studio: { wall: string; floor: string; items: PlacedItem[]; dog: { x: number; y: number } };
  outfits: Record<string, Outfit>;
  metDogs: string[];
  album: AlbumEntry[];
  learning: LearningData;
  progress: Progress;
  settings: Settings;
  tips: string[];
}
