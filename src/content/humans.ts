// Original human characters for the studio (people you can place, move, dress and seat).
// Dressing people is free play: every wearable costs 0.

export type HumanSlot = 'hair' | 'top' | 'bottom' | 'shoes' | 'accessory';

export interface HumanWearable {
  id: string;
  /** Hebrew name */
  name: string;
  slot: HumanSlot;
  /** default colour (every piece is recolourable) */
  color: string;
  /** 0 = free */
  price: number;
}

export type HumanOutfit = Partial<Record<HumanSlot, { itemId: string; color: string }>>;

/** Hair styles drawn by `HumanFigure`. */
export type HumanHairStyle = 'ponytail' | 'puffs' | 'bun' | 'braids' | 'short' | 'grandpa';

export interface HumanDef {
  id: string;
  /** Hebrew name */
  name: string;
  /** short Hebrew description: role / personality */
  description: string;
  female: boolean;
  age: 'child' | 'adult';
  skin: string;
  hairColor: string;
  hairStyle: HumanHairStyle;
  eyeColor: string;
  defaultOutfit: HumanOutfit;
}

export const HUMAN_SLOT_LABEL: Record<HumanSlot, string> = {
  hair: 'שיער',
  top: 'חולצה',
  bottom: 'מכנסיים וחצאיות',
  shoes: 'נעליים',
  accessory: 'אביזרים',
};

export const HUMAN_WEARABLES: HumanWearable[] = [
  // hair (accessories that sit on the hair)
  { id: 'hair_bow', name: 'פפיון לשיער', slot: 'hair', color: '#ff7eb6', price: 0 },
  { id: 'hair_headband', name: 'קשת לשיער', slot: 'hair', color: '#ffd166', price: 0 },
  { id: 'hair_flower', name: 'זר פרחים', slot: 'hair', color: '#ffb3d1', price: 0 },
  { id: 'hair_cap', name: 'כובע מצחייה', slot: 'hair', color: '#8fc7ff', price: 0 },
  { id: 'hair_clips', name: 'סיכות כוכב', slot: 'hair', color: '#ffd166', price: 0 },
  // tops
  { id: 'top_tshirt', name: 'חולצת טי', slot: 'top', color: '#8fd3ff', price: 0 },
  { id: 'top_hoodie', name: 'סווטשירט עם כובע', slot: 'top', color: '#7cc6ff', price: 0 },
  { id: 'top_blouse', name: 'חולצה עם צווארון סלסלה', slot: 'top', color: '#ffb3d1', price: 0 },
  { id: 'top_dress', name: 'שמלה קצרה', slot: 'top', color: '#9ee6cf', price: 0 },
  { id: 'top_leotard', name: 'בגד התעמלות נוצץ', slot: 'top', color: '#c8a2ff', price: 0 },
  { id: 'top_polo', name: 'חולצת פולו', slot: 'top', color: '#7fd1c7', price: 0 },
  { id: 'top_cardigan', name: 'קרדיגן חם', slot: 'top', color: '#c98b6b', price: 0 },
  // bottoms
  { id: 'bottom_jeans', name: "ג'ינס", slot: 'bottom', color: '#6f8fd8', price: 0 },
  { id: 'bottom_skirt', name: 'חצאית', slot: 'bottom', color: '#b9a5ff', price: 0 },
  { id: 'bottom_shorts', name: 'מכנסיים קצרים', slot: 'bottom', color: '#ffd166', price: 0 },
  { id: 'bottom_leggings', name: 'טייץ', slot: 'bottom', color: '#5b4b8a', price: 0 },
  { id: 'bottom_tutu', name: 'חצאית טוטו', slot: 'bottom', color: '#ffc4dc', price: 0 },
  // shoes
  { id: 'shoes_sneakers', name: 'נעלי ספורט', slot: 'shoes', color: '#ff8fa3', price: 0 },
  { id: 'shoes_boots', name: 'מגפונים', slot: 'shoes', color: '#9a6a4c', price: 0 },
  { id: 'shoes_flats', name: 'נעלי בלט', slot: 'shoes', color: '#ff8fb3', price: 0 },
  { id: 'shoes_clogs', name: 'כפכפי עבודה', slot: 'shoes', color: '#ffb86b', price: 0 },
  // accessories
  { id: 'acc_glasses', name: 'משקפיים', slot: 'accessory', color: '#3b2d4f', price: 0 },
  { id: 'acc_apron', name: 'סינר ספרית כלבים', slot: 'accessory', color: '#ff9ec4', price: 0 },
  { id: 'acc_scarf', name: 'צעיף', slot: 'accessory', color: '#ff8a65', price: 0 },
  { id: 'acc_bag', name: 'תיק צד', slot: 'accessory', color: '#ffd166', price: 0 },
  { id: 'acc_whistle', name: 'משרוקית מאמנת', slot: 'accessory', color: '#ff6f91', price: 0 },
  { id: 'acc_necklace', name: 'שרשרת חרוזים', slot: 'accessory', color: '#ff9ec4', price: 0 },
];

export const HUMANS: HumanDef[] = [
  {
    id: 'maya',
    name: 'מאיה',
    description: 'מעצבת צעירה שממציאה בגדים לכלבים',
    female: true,
    age: 'child',
    skin: '#f6d2b8',
    hairColor: '#7a4a2a',
    hairStyle: 'ponytail',
    eyeColor: '#6b4a2b',
    defaultOutfit: {
      hair: { itemId: 'hair_bow', color: '#ff7eb6' },
      top: { itemId: 'top_blouse', color: '#ffb3d1' },
      bottom: { itemId: 'bottom_skirt', color: '#b9a5ff' },
      shoes: { itemId: 'shoes_sneakers', color: '#8fd3ff' },
      accessory: { itemId: 'acc_bag', color: '#ffd166' },
    },
  },
  {
    id: 'ella',
    name: 'אלה',
    description: 'חברה שמחה שאוהבת לרקוד עם הכלבים',
    female: true,
    age: 'child',
    skin: '#8d5a3b',
    hairColor: '#2b1a14',
    hairStyle: 'puffs',
    eyeColor: '#3b2516',
    defaultOutfit: {
      hair: { itemId: 'hair_flower', color: '#ffe066' },
      top: { itemId: 'top_dress', color: '#9ee6cf' },
      bottom: { itemId: 'bottom_leggings', color: '#ffd6e8' },
      shoes: { itemId: 'shoes_flats', color: '#ff8fb3' },
      accessory: { itemId: 'acc_necklace', color: '#ff9ec4' },
    },
  },
  {
    id: 'omer',
    name: 'עומר',
    description: 'אח קטן וסקרן שאוהב לשחק בכדור עם הכלבים',
    female: false,
    age: 'child',
    skin: '#e0ac85',
    hairColor: '#2a211c',
    hairStyle: 'short',
    eyeColor: '#4a3426',
    defaultOutfit: {
      hair: { itemId: 'hair_cap', color: '#ff9f43' },
      top: { itemId: 'top_hoodie', color: '#7cc6ff' },
      bottom: { itemId: 'bottom_shorts', color: '#ffd166' },
      shoes: { itemId: 'shoes_sneakers', color: '#ff7a7a' },
    },
  },
  {
    id: 'dana',
    name: 'דנה',
    description: 'ספרית כלבים עדינה שיודעת לסרק כל פרווה',
    female: true,
    age: 'adult',
    skin: '#c68a62',
    hairColor: '#4a2c1d',
    hairStyle: 'bun',
    eyeColor: '#4a2c1d',
    defaultOutfit: {
      hair: { itemId: 'hair_headband', color: '#ffd166' },
      top: { itemId: 'top_polo', color: '#7fd1c7' },
      bottom: { itemId: 'bottom_jeans', color: '#6f8fd8' },
      shoes: { itemId: 'shoes_clogs', color: '#ffb86b' },
      accessory: { itemId: 'acc_apron', color: '#ff9ec4' },
    },
  },
  {
    id: 'shira',
    name: 'שירה',
    description: 'מאמנת התעמלות וריקוד שמלמדת כלבים טריקים',
    female: true,
    age: 'adult',
    skin: '#f1c9a5',
    hairColor: '#d9a25a',
    hairStyle: 'braids',
    eyeColor: '#4f8a6e',
    defaultOutfit: {
      hair: { itemId: 'hair_clips', color: '#ffd166' },
      top: { itemId: 'top_leotard', color: '#c8a2ff' },
      bottom: { itemId: 'bottom_leggings', color: '#5b4b8a' },
      shoes: { itemId: 'shoes_sneakers', color: '#ffffff' },
      accessory: { itemId: 'acc_whistle', color: '#ff6f91' },
    },
  },
  {
    id: 'saba_avi',
    name: 'סבא אבי',
    description: 'סבא חם שבונה צעצועים ומספר סיפורים',
    female: false,
    age: 'adult',
    skin: '#f3cfb3',
    hairColor: '#d9d4cf',
    hairStyle: 'grandpa',
    eyeColor: '#5a7ca8',
    defaultOutfit: {
      top: { itemId: 'top_cardigan', color: '#c98b6b' },
      bottom: { itemId: 'bottom_jeans', color: '#7a6f8f' },
      shoes: { itemId: 'shoes_boots', color: '#9a6a4c' },
      accessory: { itemId: 'acc_glasses', color: '#3b2d4f' },
    },
  },
];

export function humanById(id: string): HumanDef | undefined {
  return HUMANS.find((h) => h.id === id);
}

export function humanWearableById(id: string): HumanWearable | undefined {
  return HUMAN_WEARABLES.find((w) => w.id === id);
}
