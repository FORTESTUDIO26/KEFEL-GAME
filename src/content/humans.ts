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
  { id: 'hair_bow', name: 'פפיון לשיער', slot: 'hair', color: '#ff5fa2', price: 0 },
  { id: 'hair_headband', name: 'קשת לשיער', slot: 'hair', color: '#ffc93c', price: 0 },
  { id: 'hair_flower', name: 'זר פרחים', slot: 'hair', color: '#ff6f61', price: 0 },
  { id: 'hair_cap', name: 'כובע מצחייה', slot: 'hair', color: '#2f9bff', price: 0 },
  { id: 'hair_clips', name: 'סיכות כוכב', slot: 'hair', color: '#ffc93c', price: 0 },
  // tops
  { id: 'top_tshirt', name: 'חולצת טי', slot: 'top', color: '#2f9bff', price: 0 },
  { id: 'top_hoodie', name: 'סווטשירט עם כובע', slot: 'top', color: '#3d5afe', price: 0 },
  { id: 'top_blouse', name: 'חולצה עם צווארון סלסלה', slot: 'top', color: '#ff5fa2', price: 0 },
  { id: 'top_dress', name: 'שמלה קצרה', slot: 'top', color: '#2ec4b6', price: 0 },
  { id: 'top_leotard', name: 'בגד התעמלות נוצץ', slot: 'top', color: '#8c4dff', price: 0 },
  { id: 'top_polo', name: 'חולצת פולו', slot: 'top', color: '#2ec4b6', price: 0 },
  { id: 'top_cardigan', name: 'קרדיגן חם', slot: 'top', color: '#22a95b', price: 0 },
  // bottoms
  { id: 'bottom_jeans', name: "ג'ינס", slot: 'bottom', color: '#3d5afe', price: 0 },
  { id: 'bottom_skirt', name: 'חצאית', slot: 'bottom', color: '#8c4dff', price: 0 },
  { id: 'bottom_shorts', name: 'מכנסיים קצרים', slot: 'bottom', color: '#ffc93c', price: 0 },
  { id: 'bottom_leggings', name: 'טייץ', slot: 'bottom', color: '#d6246e', price: 0 },
  { id: 'bottom_tutu', name: 'חצאית טוטו', slot: 'bottom', color: '#ff5fa2', price: 0 },
  // shoes
  { id: 'shoes_sneakers', name: 'נעלי ספורט', slot: 'shoes', color: '#f0443a', price: 0 },
  { id: 'shoes_boots', name: 'מגפונים', slot: 'shoes', color: '#8a5232', price: 0 },
  { id: 'shoes_flats', name: 'נעלי בלט', slot: 'shoes', color: '#d6246e', price: 0 },
  { id: 'shoes_clogs', name: 'כפכפי עבודה', slot: 'shoes', color: '#ff8a1f', price: 0 },
  // accessories
  { id: 'acc_glasses', name: 'משקפיים', slot: 'accessory', color: '#33203f', price: 0 },
  { id: 'acc_apron', name: 'סינר ספרית כלבים', slot: 'accessory', color: '#ff5fa2', price: 0 },
  { id: 'acc_scarf', name: 'צעיף', slot: 'accessory', color: '#f0443a', price: 0 },
  { id: 'acc_bag', name: 'תיק צד', slot: 'accessory', color: '#ff8a1f', price: 0 },
  { id: 'acc_whistle', name: 'משרוקית מאמנת', slot: 'accessory', color: '#f0443a', price: 0 },
  { id: 'acc_necklace', name: 'שרשרת חרוזים', slot: 'accessory', color: '#ff6f61', price: 0 },
];

export const HUMANS: HumanDef[] = [
  {
    id: 'maya',
    name: 'מאיה',
    description: 'מעצבת צעירה שממציאה בגדים לכלבים',
    female: true,
    age: 'child',
    skin: '#f6d2b8',
    hairColor: '#7a3f1d',
    hairStyle: 'ponytail',
    eyeColor: '#6b4a2b',
    defaultOutfit: {
      hair: { itemId: 'hair_bow', color: '#ffc93c' },
      top: { itemId: 'top_blouse', color: '#ff5fa2' },
      bottom: { itemId: 'bottom_skirt', color: '#8c4dff' },
      shoes: { itemId: 'shoes_sneakers', color: '#2f9bff' },
      accessory: { itemId: 'acc_bag', color: '#ff8a1f' },
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
      hair: { itemId: 'hair_flower', color: '#ffc93c' },
      top: { itemId: 'top_dress', color: '#2ec4b6' },
      bottom: { itemId: 'bottom_leggings', color: '#ff5fa2' },
      shoes: { itemId: 'shoes_flats', color: '#d6246e' },
      accessory: { itemId: 'acc_necklace', color: '#ff6f61' },
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
      hair: { itemId: 'hair_cap', color: '#ff8a1f' },
      top: { itemId: 'top_hoodie', color: '#2f9bff' },
      bottom: { itemId: 'bottom_shorts', color: '#ffc93c' },
      shoes: { itemId: 'shoes_sneakers', color: '#f0443a' },
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
      hair: { itemId: 'hair_headband', color: '#ffc93c' },
      top: { itemId: 'top_polo', color: '#2ec4b6' },
      bottom: { itemId: 'bottom_jeans', color: '#3d5afe' },
      shoes: { itemId: 'shoes_clogs', color: '#ff8a1f' },
      accessory: { itemId: 'acc_apron', color: '#ff5fa2' },
    },
  },
  {
    id: 'shira',
    name: 'שירה',
    description: 'מאמנת התעמלות וריקוד שמלמדת כלבים טריקים',
    female: true,
    age: 'adult',
    skin: '#f1c9a5',
    hairColor: '#e8a33d',
    hairStyle: 'braids',
    eyeColor: '#4f8a6e',
    defaultOutfit: {
      hair: { itemId: 'hair_clips', color: '#ffc93c' },
      top: { itemId: 'top_leotard', color: '#8c4dff' },
      bottom: { itemId: 'bottom_leggings', color: '#d6246e' },
      shoes: { itemId: 'shoes_sneakers', color: '#ffffff' },
      accessory: { itemId: 'acc_whistle', color: '#f0443a' },
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
      top: { itemId: 'top_cardigan', color: '#22a95b' },
      bottom: { itemId: 'bottom_jeans', color: '#3c3f52' },
      shoes: { itemId: 'shoes_boots', color: '#8a5232' },
      accessory: { itemId: 'acc_glasses', color: '#33203f' },
    },
  },
];

export function humanById(id: string): HumanDef | undefined {
  return HUMANS.find((h) => h.id === id);
}

export function humanWearableById(id: string): HumanWearable | undefined {
  return HUMAN_WEARABLES.find((w) => w.id === id);
}
