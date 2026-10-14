// All shop/wardrobe/studio content. Prices are in coins earned in the game only.

export type Slot = 'head' | 'eyes' | 'neck' | 'body' | 'feet' | 'back' | 'prop';
export type StyleTag =
  | 'party' | 'sport' | 'stage' | 'cozy' | 'elegant' | 'rain' | 'beach' | 'winter' | 'fun' | 'classic' | 'sparkle';

export const SLOT_LABEL: Record<Slot, string> = {
  head: 'ראש',
  eyes: 'משקפיים',
  neck: 'צוואר',
  body: 'בגדים',
  feet: 'רגליים',
  back: 'גב',
  prop: 'ביד',
};
export const SLOT_ORDER: Slot[] = ['body', 'neck', 'head', 'eyes', 'feet', 'back', 'prop'];

export interface Wearable {
  rare?: boolean;
  baseId?: string;
  id: string;
  name: string;
  slot: Slot;
  price: number;
  tags: StyleTag[];
  color: string;
  /** rhythmic-gymnastics collection */
  rg?: boolean;
}

export const SWATCHES: { id: string; name: string; hex: string }[] = [
  { id: 'lilac', name: 'לילך', hex: '#b48ef0' },
  { id: 'turq', name: 'טורקיז', hex: '#2ec4c0' },
  { id: 'pink', name: 'ורוד', hex: '#ff7eb6' },
  { id: 'peach', name: 'אפרסק', hex: '#ffab7a' },
  { id: 'mint', name: 'מנטה', hex: '#7fdcaa' },
  { id: 'gold', name: 'זהב', hex: '#f2c14e' },
  { id: 'navy', name: 'כחול לילה', hex: '#34407a' },
  { id: 'red', name: 'אדום', hex: '#ef4f5f' },
  { id: 'white', name: 'לבן', hex: '#fbf8ff' },
  { id: 'black', name: 'שחור', hex: '#2c2433' },
];

export const WEARABLES: Wearable[] = [
  // head
  { id: 'party_hat', name: 'כובע מסיבה', slot: 'head', price: 10, tags: ['party', 'fun'], color: '#ff7eb6' },
  { id: 'bow', name: 'פפיון שיער', slot: 'head', price: 0, tags: ['elegant', 'stage', 'fun'], color: '#b48ef0' },
  { id: 'beret', name: 'כומתה', slot: 'head', price: 15, tags: ['elegant', 'classic'], color: '#ef4f5f' },
  { id: 'crown', name: 'כתר קטן', slot: 'head', price: 30, tags: ['party', 'sparkle', 'stage'], color: '#f2c14e' },
  { id: 'cap', name: 'כובע מצחייה', slot: 'head', price: 15, tags: ['sport', 'fun', 'beach'], color: '#2ec4c0' },
  { id: 'flower_crown', name: 'זר פרחים', slot: 'head', price: 20, tags: ['elegant', 'beach', 'party'], color: '#ff7eb6' },
  { id: 'beanie', name: 'כובע צמר', slot: 'head', price: 15, tags: ['winter', 'cozy'], color: '#ffab7a' },
  { id: 'headphones', name: 'אוזניות', slot: 'head', price: 20, tags: ['fun', 'sport', 'cozy'], color: '#34407a' },
  { id: 'stage_bun', name: 'סרט במה מנצנץ', slot: 'head', price: 30, tags: ['stage', 'sparkle', 'sport'], color: '#2ec4c0', rg: true },
  // eyes
  { id: 'heart_glasses', name: 'משקפי לב', slot: 'eyes', price: 10, tags: ['fun', 'party', 'beach'], color: '#ff7eb6' },
  { id: 'round_glasses', name: 'משקפיים עגולים', slot: 'eyes', price: 15, tags: ['classic', 'cozy'], color: '#2c2433' },
  { id: 'star_glasses', name: 'משקפי כוכב', slot: 'eyes', price: 20, tags: ['party', 'stage', 'sparkle'], color: '#f2c14e' },
  // neck
  { id: 'collar_classic', name: 'קולר קלאסי', slot: 'neck', price: 0, tags: ['classic', 'sport'], color: '#2ec4c0' },
  { id: 'bandana', name: 'בנדנה', slot: 'neck', price: 10, tags: ['sport', 'fun', 'beach'], color: '#ef4f5f' },
  { id: 'pearls', name: 'קולר פנינים', slot: 'neck', price: 20, tags: ['elegant', 'sparkle', 'party'], color: '#fbf8ff' },
  { id: 'bowtie', name: 'עניבת פרפר', slot: 'neck', price: 15, tags: ['elegant', 'party', 'classic'], color: '#34407a' },
  { id: 'scarf', name: 'צעיף', slot: 'neck', price: 20, tags: ['winter', 'cozy'], color: '#b48ef0' },
  { id: 'heart_collar', name: 'קולר עם תליון לב', slot: 'neck', price: 20, tags: ['fun', 'elegant'], color: '#ff7eb6' },
  // body
  { id: 'tee_stripes', name: 'חולצת פסים', slot: 'body', price: 0, tags: ['fun', 'classic', 'beach'], color: '#2ec4c0' },
  { id: 'sport_tank', name: 'גופייה ספורטיבית', slot: 'body', price: 0, tags: ['sport'], color: '#ffab7a' },
  { id: 'tutu', name: 'שמלת טוטו', slot: 'body', price: 20, tags: ['party', 'stage', 'elegant'], color: '#ff7eb6' },
  { id: 'denim', name: 'ז׳קט ג׳ינס', slot: 'body', price: 20, tags: ['fun', 'classic'], color: '#5b7fc7' },
  { id: 'sweater', name: 'סוודר חורף', slot: 'body', price: 20, tags: ['winter', 'cozy'], color: '#ffab7a' },
  { id: 'raincoat', name: 'מעיל גשם', slot: 'body', price: 20, tags: ['rain'], color: '#f2c14e' },
  { id: 'pajama', name: 'פיג׳מה מנוקדת', slot: 'body', price: 20, tags: ['cozy', 'fun'], color: '#b48ef0' },
  { id: 'evening_jacket', name: 'ז׳קט ערב', slot: 'body', price: 35, tags: ['elegant', 'party', 'stage'], color: '#34407a' },
  { id: 'leotard', name: 'בגד גוף מנצנץ', slot: 'body', price: 30, tags: ['stage', 'sport', 'sparkle'], color: '#b48ef0', rg: true },
  // feet
  { id: 'socks', name: 'גרביים עם לבבות', slot: 'feet', price: 0, tags: ['cozy', 'fun'], color: '#ff7eb6' },
  { id: 'sneakers', name: 'נעלי ספורט', slot: 'feet', price: 20, tags: ['sport', 'fun'], color: '#fbf8ff' },
  { id: 'boots', name: 'מגפיים', slot: 'feet', price: 15, tags: ['rain', 'winter'], color: '#f2c14e' },
  { id: 'legwarmers', name: 'מחממי רגליים', slot: 'feet', price: 15, tags: ['sport', 'stage', 'cozy'], color: '#2ec4c0', rg: true },
  // back
  { id: 'wings', name: 'כנפי פרפר', slot: 'back', price: 35, tags: ['stage', 'party', 'sparkle'], color: '#b48ef0' },
  { id: 'cape', name: 'גלימה', slot: 'back', price: 20, tags: ['stage', 'elegant'], color: '#ef4f5f' },
  { id: 'backpack', name: 'תיק גב קטן', slot: 'back', price: 15, tags: ['fun', 'sport', 'beach'], color: '#7fdcaa' },
  // props
  { id: 'ribbon', name: 'סרט התעמלות', slot: 'prop', price: 0, tags: ['stage', 'sport'], color: '#ff7eb6', rg: true },
  { id: 'hoop', name: 'חישוק', slot: 'prop', price: 30, tags: ['stage', 'sport'], color: '#2ec4c0', rg: true },
  { id: 'gym_ball', name: 'כדור התעמלות', slot: 'prop', price: 30, tags: ['stage', 'sport'], color: '#b48ef0', rg: true },
  { id: 'clubs', name: 'אלות', slot: 'prop', price: 30, tags: ['stage', 'sport'], color: '#ffab7a', rg: true },
  { id: 'rope', name: 'חבל', slot: 'prop', price: 30, tags: ['sport', 'stage'], color: '#7fdcaa', rg: true },
  { id: 'umbrella', name: 'מטרייה', slot: 'prop', price: 20, tags: ['rain'], color: '#2ec4c0' },
  // collection added in version 2 (formerly free)
  { id: 'flower_clip', name: 'סיכת פרח', slot: 'head', price: 10, tags: ['elegant', 'beach'], color: '#ff7eb6' },
  { id: 'sun_hat', name: 'כובע קש', slot: 'head', price: 10, tags: ['beach', 'classic'], color: '#f2c14e' },
  { id: 'headband', name: 'קשת לשיער', slot: 'head', price: 10, tags: ['fun', 'elegant'], color: '#b48ef0' },
  { id: 'sunglasses', name: 'משקפי שמש', slot: 'eyes', price: 10, tags: ['beach', 'fun'], color: '#2c2433' },
  { id: 'bell_ribbon', name: 'סרט צוואר עם פעמון', slot: 'neck', price: 10, tags: ['elegant', 'party'], color: '#2ec4c0' },
  { id: 'polka_bandana', name: 'בנדנה מנוקדת', slot: 'neck', price: 10, tags: ['fun', 'cozy'], color: '#b48ef0' },
  { id: 'hoodie', name: 'קפוצ׳ון', slot: 'body', price: 15, tags: ['cozy', 'sport'], color: '#7fdcaa' },
  { id: 'flowy_dress', name: 'שמלה מתנפנפת', slot: 'body', price: 15, tags: ['elegant', 'party', 'beach'], color: '#ffab7a' },
  { id: 'knit_vest', name: 'וסט סריג', slot: 'body', price: 15, tags: ['classic', 'cozy'], color: '#ef4f5f' },
  { id: 'ballet_shoes', name: 'נעלי בלט', slot: 'feet', price: 15, tags: ['stage', 'elegant'], color: '#ff7eb6' },
  { id: 'big_bow', name: 'פפיון גב גדול', slot: 'back', price: 15, tags: ['party', 'elegant'], color: '#ff7eb6' },
  { id: 'handbag', name: 'תיק יד', slot: 'prop', price: 10, tags: ['elegant', 'fun'], color: '#b48ef0' },
  { id: 'bouquet', name: 'זר פרחים ביד', slot: 'prop', price: 10, tags: ['elegant', 'party'], color: '#ff7eb6' },
];

export type FurnitureKind = 'floor' | 'wall' | 'rug' | 'ceiling';

export interface Furniture {
  rare?: boolean;
  baseId?: string;
  color?: string;
  id: string;
  name: string;
  kind: FurnitureKind;
  /** size in room units (room is 800×500) */
  w: number;
  h: number;
  price: number;
  rg?: boolean;
}

export const FURNITURE: Furniture[] = [
  { id: 'sofa', name: 'ספה רכה', kind: 'floor', w: 210, h: 120, price: 0 },
  { id: 'mirror_tall', name: 'מראה גדולה', kind: 'floor', w: 90, h: 200, price: 0 },
  { id: 'floor_lamp', name: 'מנורת עמידה', kind: 'floor', w: 70, h: 210, price: 15 },
  { id: 'rug_round', name: 'שטיח עגול', kind: 'rug', w: 260, h: 70, price: 0 },
  { id: 'plant_monstera', name: 'עציץ מונסטרה', kind: 'floor', w: 90, h: 140, price: 0 },
  { id: 'clothes_rack', name: 'מתלה בגדים', kind: 'floor', w: 170, h: 180, price: 15 },
  { id: 'dog_bed', name: 'מיטת כלב', kind: 'floor', w: 130, h: 60, price: 0 },
  { id: 'frame', name: 'מסגרת תמונה', kind: 'wall', w: 80, h: 95, price: 0 },
  { id: 'armchair', name: 'כורסה', kind: 'floor', w: 120, h: 125, price: 20 },
  { id: 'vanity', name: 'שולחן איפור', kind: 'floor', w: 140, h: 190, price: 30 },
  { id: 'mirror_round', name: 'מראה עגולה', kind: 'wall', w: 100, h: 100, price: 20 },
  { id: 'chandelier', name: 'נברשת', kind: 'ceiling', w: 130, h: 120, price: 35 },
  { id: 'string_lights', name: 'שרשרת אורות', kind: 'wall', w: 260, h: 60, price: 15 },
  { id: 'rug_stripes', name: 'שטיח פסים', kind: 'rug', w: 280, h: 70, price: 20 },
  { id: 'plant_cactus', name: 'קקטוס בעציץ', kind: 'floor', w: 55, h: 90, price: 10 },
  { id: 'shelf', name: 'מדף בדים', kind: 'wall', w: 170, h: 90, price: 20 },
  { id: 'mannequin', name: 'בובת תצוגה', kind: 'floor', w: 80, h: 190, price: 20 },
  { id: 'bowl', name: 'קערת אוכל', kind: 'floor', w: 60, h: 30, price: 10 },
  { id: 'bathtub', name: 'אמבטיית פינוק', kind: 'floor', w: 150, h: 110, price: 35 },
  { id: 'runway', name: 'מסלול תצוגה', kind: 'rug', w: 320, h: 60, price: 40 },
  { id: 'poster', name: 'פוסטר כלב', kind: 'wall', w: 90, h: 120, price: 15 },
  { id: 'clock', name: 'שעון קיר', kind: 'wall', w: 70, h: 70, price: 15 },
  { id: 'balloons', name: 'בלונים', kind: 'floor', w: 90, h: 200, price: 15 },
  { id: 'sewing', name: 'שולחן תפירה', kind: 'floor', w: 150, h: 130, price: 20 },
  { id: 'window', name: 'חלון קשת', kind: 'wall', w: 140, h: 170, price: 20 },
  { id: 'neon', name: 'שלט מואר', kind: 'wall', w: 180, h: 70, price: 30 },
  { id: 'gym_mat', name: 'מזרן התעמלות', kind: 'rug', w: 260, h: 60, price: 30, rg: true },
  { id: 'ribbon_stand', name: 'מעמד סרטים וחישוקים', kind: 'floor', w: 110, h: 170, price: 30, rg: true },
  // collection added in version 2 (formerly free)
  { id: 'loveseat', name: 'ספה קטנה', kind: 'floor', w: 170, h: 110, price: 15 },
  { id: 'cozy_chair', name: 'כורסה עגולה', kind: 'floor', w: 110, h: 110, price: 15 },
  { id: 'pouf', name: 'פוף', kind: 'floor', w: 74, h: 56, price: 10 },
  { id: 'cushions', name: 'ערמת כריות', kind: 'floor', w: 110, h: 70, price: 10 },
  { id: 'dressing_table', name: 'שולחן הלבשה', kind: 'floor', w: 130, h: 170, price: 15 },
  { id: 'arch_mirror', name: 'מראה קשתית', kind: 'wall', w: 80, h: 120, price: 15 },
  { id: 'wall_shelves', name: 'מדפי קיר', kind: 'wall', w: 150, h: 110, price: 10 },
  { id: 'hat_rack', name: 'מתלה כובעים', kind: 'floor', w: 74, h: 170, price: 10 },
  { id: 'rug_fluffy', name: 'שטיח פרוותי', kind: 'rug', w: 220, h: 60, price: 10 },
  { id: 'rug_rect', name: 'שטיח מלבני', kind: 'rug', w: 260, h: 60, price: 10 },
  { id: 'side_lamp', name: 'שולחן צד עם מנורה', kind: 'floor', w: 74, h: 130, price: 10 },
  { id: 'wall_lamp', name: 'מנורת קיר', kind: 'wall', w: 56, h: 80, price: 10 },
  { id: 'hanging_plant', name: 'עציץ תלוי', kind: 'wall', w: 76, h: 130, price: 10 },
  { id: 'flower_pot', name: 'עציץ פרחים', kind: 'floor', w: 60, h: 92, price: 10 },
  { id: 'star_garland', name: 'שרשרת כוכבים', kind: 'wall', w: 240, h: 60, price: 10 },
  { id: 'heart_wall', name: 'קישוט לבבות לקיר', kind: 'wall', w: 120, h: 90, price: 10 },
  { id: 'round_dog_bed', name: 'מיטת כלב עגולה', kind: 'floor', w: 120, h: 62, price: 10 },
  { id: 'paw_poster', name: 'פוסטר כף רגל', kind: 'wall', w: 80, h: 100, price: 10 },
];

export interface Palette {
  id: string;
  name: string;
  wall: string;
  wallAccent: string;
  floor: string;
  floorAccent: string;
  accent: string;
  accent2: string;
  soft: string;
}

export const PALETTES: Palette[] = [
  { id: 'lilac', name: 'חלום לילך', wall: '#ece2ff', wallAccent: '#d9c8ff', floor: '#e9cfb5', floorAccent: '#dcbb9b', accent: '#8b5cf6', accent2: '#2ec4c0', soft: '#f6f0ff' },
  { id: 'turq', name: 'גל טורקיז', wall: '#d8f6f3', wallAccent: '#b5ece7', floor: '#efdcc6', floorAccent: '#e2c8ab', accent: '#0f9d9a', accent2: '#ff7eb6', soft: '#effbfa' },
  { id: 'pink', name: 'ורוד פודרה', wall: '#ffe3ef', wallAccent: '#ffcde2', floor: '#ead6c9', floorAccent: '#dcc0ae', accent: '#e0468c', accent2: '#8b5cf6', soft: '#fff2f8' },
  { id: 'peach', name: 'שקיעת אפרסק', wall: '#ffe9dc', wallAccent: '#ffd5bd', floor: '#d8c3b3', floorAccent: '#c9ae9a', accent: '#e8703a', accent2: '#2ec4c0', soft: '#fff5ef' },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export interface Background {
  rare?: boolean;
  baseId?: string;
  color?: string;
  id: string;
  name: string;
  type: 'wall' | 'floor';
  price: number;
}

export const BACKGROUNDS: Background[] = [
  { id: 'wall_plain', name: 'קיר חלק', type: 'wall', price: 0 },
  { id: 'wall_stripes', name: 'קיר פסים', type: 'wall', price: 0 },
  { id: 'wall_dots', name: 'קיר נקודות', type: 'wall', price: 15 },
  { id: 'wall_hearts', name: 'קיר לבבות', type: 'wall', price: 20 },
  { id: 'wall_stars', name: 'קיר כוכבים', type: 'wall', price: 20 },
  { id: 'wall_ribbons', name: 'קיר סרטי התעמלות', type: 'wall', price: 20 },
  { id: 'floor_wood', name: 'פרקט עץ', type: 'floor', price: 0 },
  { id: 'floor_tiles', name: 'אריחים', type: 'floor', price: 15 },
  { id: 'floor_checker', name: 'משבצות', type: 'floor', price: 15 },
  { id: 'floor_carpet', name: 'שטיח מקיר לקיר', type: 'floor', price: 15 },
];

export type BackdropId = 'studio' | 'party' | 'stage' | 'park' | 'rain' | 'beach' | 'snow' | 'night';

export const BACKDROPS: { id: BackdropId; name: string }[] = [
  { id: 'studio', name: 'סטודיו' },
  { id: 'party', name: 'מסיבה' },
  { id: 'stage', name: 'במה' },
  { id: 'park', name: 'פארק' },
  { id: 'rain', name: 'גשם' },
  { id: 'beach', name: 'ים' },
  { id: 'snow', name: 'שלג' },
  { id: 'night', name: 'לילה' },
];

export interface Direction {
  id: string;
  name: string;
  tags: StyleTag[];
}

export interface ClientRequest {
  id: string;
  title: string;
  text: string;
  backdrop: BackdropId;
  directions: Direction[];
}

export const REQUESTS: ClientRequest[] = [
  {
    id: 'birthday', title: 'מסיבת יום הולדת', text: 'מחר יום ההולדת שלי! אני רוצה להיות {הכי חגיגי|הכי חגיגית} במסיבה.', backdrop: 'party',
    directions: [
      { id: 'sparkle', name: 'נוצץ ומלכותי', tags: ['sparkle', 'party'] },
      { id: 'playful', name: 'צבעוני ושובב', tags: ['fun', 'party'] },
      { id: 'classy', name: 'אלגנטי ועדין', tags: ['elegant', 'classic'] },
    ],
  },
  {
    id: 'sportday', title: 'יום ספורט', text: 'יש לי יום ספורט בפארק. צריך משהו נוח שאפשר לרוץ בו!', backdrop: 'park',
    directions: [
      { id: 'pro', name: 'ספורטיבי מקצועי', tags: ['sport'] },
      { id: 'bright', name: 'בהיר ושמח', tags: ['fun', 'sport'] },
      { id: 'cool', name: 'קליל וקול', tags: ['classic', 'fun'] },
    ],
  },
  {
    id: 'rg_show', title: 'הופעת התעמלות אומנותית', text: 'אני {מופיע|מופיעה} בתחרות התעמלות אומנותית! אני {צריך|צריכה} מראה במה מושלם.', backdrop: 'stage',
    directions: [
      { id: 'shine', name: 'מנצנץ לבמה', tags: ['sparkle', 'stage'] },
      { id: 'flow', name: 'זורם ואלגנטי', tags: ['elegant', 'stage'] },
      { id: 'energy', name: 'אנרגטי וספורטיבי', tags: ['sport', 'stage'] },
    ],
  },
  {
    id: 'rainwalk', title: 'טיול בגשם', text: 'בחוץ יורד גשם ואני רוצה לקפוץ בשלוליות בלי להירטב!', backdrop: 'rain',
    directions: [
      { id: 'dry', name: 'יבש ומוגן', tags: ['rain'] },
      { id: 'sunny', name: 'צבעוני ביום אפור', tags: ['rain', 'fun'] },
      { id: 'warm', name: 'חם ונעים', tags: ['cozy', 'winter'] },
    ],
  },
  {
    id: 'magazine', title: 'צילומים למגזין', text: 'מגזין אופנה רוצה לצלם אותי לשער! תעזרי לי להיראות כמו {כוכב|כוכבת}?', backdrop: 'studio',
    directions: [
      { id: 'glam', name: 'זוהר הוליוודי', tags: ['sparkle', 'elegant'] },
      { id: 'street', name: 'אופנת רחוב', tags: ['fun', 'classic'] },
      { id: 'soft', name: 'רך ופסטלי', tags: ['cozy', 'elegant'] },
    ],
  },
  {
    id: 'wedding', title: 'חתונה של חברים', text: 'החברים הכי טובים שלי מתחתנים! אני {מביא|מביאה} את הטבעות.', backdrop: 'party',
    directions: [
      { id: 'formal', name: 'חגיגי ורשמי', tags: ['elegant', 'classic'] },
      { id: 'garden', name: 'חתונת גן', tags: ['elegant', 'beach'] },
      { id: 'dance', name: 'מוכן לרחבה', tags: ['party', 'sparkle'] },
    ],
  },
  {
    id: 'movie', title: 'ערב סרט בבית', text: 'הערב ערב סרט עם פופקורן. אני רוצה להרגיש בנוח, אבל גם להיראות {מסוגנן|מסוגננת}.', backdrop: 'night',
    directions: [
      { id: 'comfy', name: 'הכי נוח שיש', tags: ['cozy'] },
      { id: 'cute', name: 'חמוד ומצחיק', tags: ['fun', 'cozy'] },
      { id: 'chic', name: 'שיק ביתי', tags: ['classic', 'elegant'] },
    ],
  },
  {
    id: 'picnic', title: 'פיקניק בפארק', text: 'יוצאים לפיקניק על הדשא! אני רוצה מראה של יום שמש.', backdrop: 'park',
    directions: [
      { id: 'flowers', name: 'פרחוני ורומנטי', tags: ['elegant', 'beach'] },
      { id: 'sporty', name: 'מוכן למשחקי כדור', tags: ['sport', 'fun'] },
      { id: 'classic', name: 'קלאסי ונקי', tags: ['classic'] },
    ],
  },
  {
    id: 'winter', title: 'יום חורף קר', text: 'ברררר! קר בחוץ ואני {חייב|חייבת} להתחמם, אבל להישאר {אופנתי|אופנתית}.', backdrop: 'snow',
    directions: [
      { id: 'snug', name: 'עטוף וחמים', tags: ['winter', 'cozy'] },
      { id: 'snowqueen', name: 'מלכת השלג', tags: ['winter', 'sparkle'] },
      { id: 'colorful', name: 'צבעוני בשלג', tags: ['winter', 'fun'] },
    ],
  },
  {
    id: 'talent', title: 'תחרות כישרונות', text: 'אני {מופיע|מופיעה} בתחרות כישרונות עם ריקוד! צריך משהו שבולט מרחוק.', backdrop: 'stage',
    directions: [
      { id: 'star', name: 'כוכב הערב', tags: ['sparkle', 'stage'] },
      { id: 'funny', name: 'מצחיק ובלתי נשכח', tags: ['fun', 'party'] },
      { id: 'magic', name: 'קסום ומסתורי', tags: ['stage', 'elegant'] },
    ],
  },
  {
    id: 'school', title: 'יום ראשון בבית ספר לכלבים', text: 'מחר אני {מתחיל|מתחילה} בית ספר לכלבים. אני רוצה להיראות {מוכן וחכם|מוכנה וחכמה}!', backdrop: 'park',
    directions: [
      { id: 'smart', name: 'חכם ומסודר', tags: ['classic', 'cozy'] },
      { id: 'friendly', name: 'חברותי ושמח', tags: ['fun'] },
      { id: 'ready', name: 'מוכן לכל פעילות', tags: ['sport', 'fun'] },
    ],
  },
  {
    id: 'pajama', title: 'מסיבת פיג׳מות', text: 'כל החברים באים לישון אצלי! צריך מראה פיג׳מות שווה.', backdrop: 'night',
    directions: [
      { id: 'dreamy', name: 'חלומי ורך', tags: ['cozy', 'elegant'] },
      { id: 'party', name: 'מסיבה עד הבוקר', tags: ['party', 'fun'] },
      { id: 'stars', name: 'כוכבים ונצנצים', tags: ['sparkle', 'cozy'] },
    ],
  },
  {
    id: 'beach', title: 'יום בים', text: 'נוסעים לים! אני רוצה מראה קיצי, וגם לא להישרף בשמש.', backdrop: 'beach',
    directions: [
      { id: 'surf', name: 'גלישה וחול', tags: ['beach', 'sport'] },
      { id: 'tropical', name: 'טרופי וצבעוני', tags: ['beach', 'fun'] },
      { id: 'resort', name: 'נופש יוקרתי', tags: ['beach', 'elegant'] },
    ],
  },
  {
    id: 'grandma', title: 'ביקור אצל סבתא', text: 'סבתא שלי אוהבת כשאני {מתלבש|מתלבשת} יפה. אולי משהו מסודר וחמוד?', backdrop: 'studio',
    directions: [
      { id: 'neat', name: 'מסודר ומנומס', tags: ['classic', 'elegant'] },
      { id: 'sweet', name: 'מתוק ונעים', tags: ['cozy', 'fun'] },
      { id: 'fancy', name: 'חגיגי במיוחד', tags: ['party', 'elegant'] },
    ],
  },
];

export function wearableById(id: string): Wearable | undefined {
  return WEARABLES.find((w) => w.id === id);
}
export function furnitureById(id: string): Furniture | undefined {
  return FURNITURE.find((f) => f.id === id);
}
export function backgroundById(id: string): Background | undefined {
  return BACKGROUNDS.find((b) => b.id === id);
}
export function requestById(id: string): ClientRequest | undefined {
  return REQUESTS.find((r) => r.id === id);
}


// Local SVG family variants; originals remain unchanged for saved ownership.
export const EXTRA_FREE_WEARABLES: string[] = [];
{ const base = wearableById('bow')!; WEARABLES.push({ ...base, id: 'atelier_wearables_head_1', baseId: base.id, name: base.name + ' · ורוד פריז', slot: 'head', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_head_1'); }
{ const base = wearableById('beret')!; WEARABLES.push({ ...base, id: 'atelier_wearables_head_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', slot: 'head', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_head_2'); }
{ const base = wearableById('cap')!; WEARABLES.push({ ...base, id: 'atelier_wearables_head_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', slot: 'head', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_head_3'); }
{ const base = wearableById('beanie')!; WEARABLES.push({ ...base, id: 'atelier_wearables_head_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', slot: 'head', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_head_4'); }
{ const base = wearableById('flower_crown')!; WEARABLES.push({ ...base, id: 'atelier_wearables_head_5', baseId: base.id, name: base.name + ' · לילך חלומי', slot: 'head', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_head_5'); }
{ const base = wearableById('bow')!; WEARABLES.push({ ...base, id: 'rare_wearables_head_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', slot: 'head', price: 0, color: '#d5a640', rare: true });  }
{ const base = wearableById('beret')!; WEARABLES.push({ ...base, id: 'rare_wearables_head_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', slot: 'head', price: 0, color: '#8973ba', rare: true });  }
{ const base = wearableById('heart_glasses')!; WEARABLES.push({ ...base, id: 'atelier_wearables_eyes_1', baseId: base.id, name: base.name + ' · ורוד פריז', slot: 'eyes', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_eyes_1'); }
{ const base = wearableById('round_glasses')!; WEARABLES.push({ ...base, id: 'atelier_wearables_eyes_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', slot: 'eyes', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_eyes_2'); }
{ const base = wearableById('star_glasses')!; WEARABLES.push({ ...base, id: 'atelier_wearables_eyes_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', slot: 'eyes', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_eyes_3'); }
{ const base = wearableById('sunglasses')!; WEARABLES.push({ ...base, id: 'atelier_wearables_eyes_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', slot: 'eyes', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_eyes_4'); }
{ const base = wearableById('heart_glasses')!; WEARABLES.push({ ...base, id: 'atelier_wearables_eyes_5', baseId: base.id, name: base.name + ' · לילך חלומי', slot: 'eyes', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_eyes_5'); }
{ const base = wearableById('heart_glasses')!; WEARABLES.push({ ...base, id: 'rare_wearables_eyes_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', slot: 'eyes', price: 0, color: '#d5a640', rare: true });  }
{ const base = wearableById('round_glasses')!; WEARABLES.push({ ...base, id: 'rare_wearables_eyes_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', slot: 'eyes', price: 0, color: '#8973ba', rare: true });  }
{ const base = wearableById('bandana')!; WEARABLES.push({ ...base, id: 'atelier_wearables_neck_1', baseId: base.id, name: base.name + ' · ורוד פריז', slot: 'neck', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_neck_1'); }
{ const base = wearableById('bowtie')!; WEARABLES.push({ ...base, id: 'atelier_wearables_neck_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', slot: 'neck', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_neck_2'); }
{ const base = wearableById('scarf')!; WEARABLES.push({ ...base, id: 'atelier_wearables_neck_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', slot: 'neck', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_neck_3'); }
{ const base = wearableById('heart_collar')!; WEARABLES.push({ ...base, id: 'atelier_wearables_neck_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', slot: 'neck', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_neck_4'); }
{ const base = wearableById('polka_bandana')!; WEARABLES.push({ ...base, id: 'atelier_wearables_neck_5', baseId: base.id, name: base.name + ' · לילך חלומי', slot: 'neck', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_neck_5'); }
{ const base = wearableById('bandana')!; WEARABLES.push({ ...base, id: 'rare_wearables_neck_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', slot: 'neck', price: 0, color: '#d5a640', rare: true });  }
{ const base = wearableById('bowtie')!; WEARABLES.push({ ...base, id: 'rare_wearables_neck_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', slot: 'neck', price: 0, color: '#8973ba', rare: true });  }
{ const base = wearableById('tee_stripes')!; WEARABLES.push({ ...base, id: 'atelier_wearables_body_1', baseId: base.id, name: base.name + ' · ורוד פריז', slot: 'body', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_body_1'); }
{ const base = wearableById('hoodie')!; WEARABLES.push({ ...base, id: 'atelier_wearables_body_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', slot: 'body', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_body_2'); }
{ const base = wearableById('flowy_dress')!; WEARABLES.push({ ...base, id: 'atelier_wearables_body_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', slot: 'body', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_body_3'); }
{ const base = wearableById('pajama')!; WEARABLES.push({ ...base, id: 'atelier_wearables_body_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', slot: 'body', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_body_4'); }
{ const base = wearableById('knit_vest')!; WEARABLES.push({ ...base, id: 'atelier_wearables_body_5', baseId: base.id, name: base.name + ' · לילך חלומי', slot: 'body', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_body_5'); }
{ const base = wearableById('tee_stripes')!; WEARABLES.push({ ...base, id: 'rare_wearables_body_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', slot: 'body', price: 0, color: '#d5a640', rare: true });  }
{ const base = wearableById('hoodie')!; WEARABLES.push({ ...base, id: 'rare_wearables_body_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', slot: 'body', price: 0, color: '#8973ba', rare: true });  }
{ const base = wearableById('socks')!; WEARABLES.push({ ...base, id: 'atelier_wearables_feet_1', baseId: base.id, name: base.name + ' · ורוד פריז', slot: 'feet', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_feet_1'); }
{ const base = wearableById('sneakers')!; WEARABLES.push({ ...base, id: 'atelier_wearables_feet_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', slot: 'feet', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_feet_2'); }
{ const base = wearableById('boots')!; WEARABLES.push({ ...base, id: 'atelier_wearables_feet_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', slot: 'feet', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_feet_3'); }
{ const base = wearableById('legwarmers')!; WEARABLES.push({ ...base, id: 'atelier_wearables_feet_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', slot: 'feet', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_feet_4'); }
{ const base = wearableById('ballet_shoes')!; WEARABLES.push({ ...base, id: 'atelier_wearables_feet_5', baseId: base.id, name: base.name + ' · לילך חלומי', slot: 'feet', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_feet_5'); }
{ const base = wearableById('socks')!; WEARABLES.push({ ...base, id: 'rare_wearables_feet_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', slot: 'feet', price: 0, color: '#d5a640', rare: true });  }
{ const base = wearableById('sneakers')!; WEARABLES.push({ ...base, id: 'rare_wearables_feet_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', slot: 'feet', price: 0, color: '#8973ba', rare: true });  }
{ const base = wearableById('wings')!; WEARABLES.push({ ...base, id: 'atelier_wearables_back_1', baseId: base.id, name: base.name + ' · ורוד פריז', slot: 'back', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_back_1'); }
{ const base = wearableById('cape')!; WEARABLES.push({ ...base, id: 'atelier_wearables_back_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', slot: 'back', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_back_2'); }
{ const base = wearableById('backpack')!; WEARABLES.push({ ...base, id: 'atelier_wearables_back_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', slot: 'back', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_back_3'); }
{ const base = wearableById('big_bow')!; WEARABLES.push({ ...base, id: 'atelier_wearables_back_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', slot: 'back', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_back_4'); }
{ const base = wearableById('wings')!; WEARABLES.push({ ...base, id: 'atelier_wearables_back_5', baseId: base.id, name: base.name + ' · לילך חלומי', slot: 'back', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_back_5'); }
{ const base = wearableById('wings')!; WEARABLES.push({ ...base, id: 'rare_wearables_back_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', slot: 'back', price: 0, color: '#d5a640', rare: true });  }
{ const base = wearableById('cape')!; WEARABLES.push({ ...base, id: 'rare_wearables_back_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', slot: 'back', price: 0, color: '#8973ba', rare: true });  }
{ const base = wearableById('ribbon')!; WEARABLES.push({ ...base, id: 'atelier_wearables_prop_1', baseId: base.id, name: base.name + ' · ורוד פריז', slot: 'prop', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_prop_1'); }
{ const base = wearableById('hoop')!; WEARABLES.push({ ...base, id: 'atelier_wearables_prop_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', slot: 'prop', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_prop_2'); }
{ const base = wearableById('gym_ball')!; WEARABLES.push({ ...base, id: 'atelier_wearables_prop_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', slot: 'prop', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_prop_3'); }
{ const base = wearableById('handbag')!; WEARABLES.push({ ...base, id: 'atelier_wearables_prop_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', slot: 'prop', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_prop_4'); }
{ const base = wearableById('umbrella')!; WEARABLES.push({ ...base, id: 'atelier_wearables_prop_5', baseId: base.id, name: base.name + ' · לילך חלומי', slot: 'prop', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_WEARABLES.push('atelier_wearables_prop_5'); }
{ const base = wearableById('ribbon')!; WEARABLES.push({ ...base, id: 'rare_wearables_prop_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', slot: 'prop', price: 0, color: '#d5a640', rare: true });  }
{ const base = wearableById('hoop')!; WEARABLES.push({ ...base, id: 'rare_wearables_prop_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', slot: 'prop', price: 0, color: '#8973ba', rare: true });  }
export const EXTRA_FREE_FURNITURE: string[] = [];
{ const base = furnitureById('sofa')!; FURNITURE.push({ ...base, id: 'atelier_furniture_floor_1', baseId: base.id, name: base.name + ' · ורוד פריז', kind: 'floor', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_floor_1'); }
{ const base = furnitureById('pouf')!; FURNITURE.push({ ...base, id: 'atelier_furniture_floor_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', kind: 'floor', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_floor_2'); }
{ const base = furnitureById('cozy_chair')!; FURNITURE.push({ ...base, id: 'atelier_furniture_floor_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', kind: 'floor', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_floor_3'); }
{ const base = furnitureById('dog_bed')!; FURNITURE.push({ ...base, id: 'atelier_furniture_floor_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', kind: 'floor', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_floor_4'); }
{ const base = furnitureById('flower_pot')!; FURNITURE.push({ ...base, id: 'atelier_furniture_floor_5', baseId: base.id, name: base.name + ' · לילך חלומי', kind: 'floor', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_floor_5'); }
{ const base = furnitureById('sofa')!; FURNITURE.push({ ...base, id: 'rare_furniture_floor_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', kind: 'floor', price: 0, color: '#d5a640', rare: true });  }
{ const base = furnitureById('pouf')!; FURNITURE.push({ ...base, id: 'rare_furniture_floor_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', kind: 'floor', price: 0, color: '#8973ba', rare: true });  }
{ const base = furnitureById('frame')!; FURNITURE.push({ ...base, id: 'atelier_furniture_wall_1', baseId: base.id, name: base.name + ' · ורוד פריז', kind: 'wall', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_wall_1'); }
{ const base = furnitureById('shelf')!; FURNITURE.push({ ...base, id: 'atelier_furniture_wall_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', kind: 'wall', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_wall_2'); }
{ const base = furnitureById('wall_lamp')!; FURNITURE.push({ ...base, id: 'atelier_furniture_wall_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', kind: 'wall', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_wall_3'); }
{ const base = furnitureById('heart_wall')!; FURNITURE.push({ ...base, id: 'atelier_furniture_wall_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', kind: 'wall', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_wall_4'); }
{ const base = furnitureById('paw_poster')!; FURNITURE.push({ ...base, id: 'atelier_furniture_wall_5', baseId: base.id, name: base.name + ' · לילך חלומי', kind: 'wall', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_wall_5'); }
{ const base = furnitureById('frame')!; FURNITURE.push({ ...base, id: 'rare_furniture_wall_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', kind: 'wall', price: 0, color: '#d5a640', rare: true });  }
{ const base = furnitureById('shelf')!; FURNITURE.push({ ...base, id: 'rare_furniture_wall_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', kind: 'wall', price: 0, color: '#8973ba', rare: true });  }
{ const base = furnitureById('rug_round')!; FURNITURE.push({ ...base, id: 'atelier_furniture_rug_1', baseId: base.id, name: base.name + ' · ורוד פריז', kind: 'rug', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_rug_1'); }
{ const base = furnitureById('rug_stripes')!; FURNITURE.push({ ...base, id: 'atelier_furniture_rug_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', kind: 'rug', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_rug_2'); }
{ const base = furnitureById('rug_rect')!; FURNITURE.push({ ...base, id: 'atelier_furniture_rug_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', kind: 'rug', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_rug_3'); }
{ const base = furnitureById('rug_fluffy')!; FURNITURE.push({ ...base, id: 'atelier_furniture_rug_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', kind: 'rug', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_rug_4'); }
{ const base = furnitureById('gym_mat')!; FURNITURE.push({ ...base, id: 'atelier_furniture_rug_5', baseId: base.id, name: base.name + ' · לילך חלומי', kind: 'rug', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_rug_5'); }
{ const base = furnitureById('rug_round')!; FURNITURE.push({ ...base, id: 'rare_furniture_rug_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', kind: 'rug', price: 0, color: '#d5a640', rare: true });  }
{ const base = furnitureById('rug_stripes')!; FURNITURE.push({ ...base, id: 'rare_furniture_rug_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', kind: 'rug', price: 0, color: '#8973ba', rare: true });  }
{ const base = furnitureById('chandelier')!; FURNITURE.push({ ...base, id: 'atelier_furniture_ceiling_1', baseId: base.id, name: base.name + ' · ורוד פריז', kind: 'ceiling', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_ceiling_1'); }
{ const base = furnitureById('chandelier')!; FURNITURE.push({ ...base, id: 'atelier_furniture_ceiling_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', kind: 'ceiling', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_ceiling_2'); }
{ const base = furnitureById('chandelier')!; FURNITURE.push({ ...base, id: 'atelier_furniture_ceiling_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', kind: 'ceiling', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_ceiling_3'); }
{ const base = furnitureById('chandelier')!; FURNITURE.push({ ...base, id: 'atelier_furniture_ceiling_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', kind: 'ceiling', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_ceiling_4'); }
{ const base = furnitureById('chandelier')!; FURNITURE.push({ ...base, id: 'atelier_furniture_ceiling_5', baseId: base.id, name: base.name + ' · לילך חלומי', kind: 'ceiling', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_FURNITURE.push('atelier_furniture_ceiling_5'); }
{ const base = furnitureById('chandelier')!; FURNITURE.push({ ...base, id: 'rare_furniture_ceiling_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', kind: 'ceiling', price: 0, color: '#d5a640', rare: true });  }
{ const base = furnitureById('chandelier')!; FURNITURE.push({ ...base, id: 'rare_furniture_ceiling_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', kind: 'ceiling', price: 0, color: '#8973ba', rare: true });  }
export const EXTRA_FREE_BACKGROUNDS: string[] = [];
{ const base = backgroundById('wall_stripes')!; BACKGROUNDS.push({ ...base, id: 'atelier_backgrounds_wall_1', baseId: base.id, name: base.name + ' · ורוד פריז', type: 'wall', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_BACKGROUNDS.push('atelier_backgrounds_wall_1'); }
{ const base = backgroundById('wall_dots')!; BACKGROUNDS.push({ ...base, id: 'atelier_backgrounds_wall_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', type: 'wall', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_BACKGROUNDS.push('atelier_backgrounds_wall_2'); }
{ const base = backgroundById('wall_hearts')!; BACKGROUNDS.push({ ...base, id: 'atelier_backgrounds_wall_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', type: 'wall', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_BACKGROUNDS.push('atelier_backgrounds_wall_3'); }
{ const base = backgroundById('wall_stars')!; BACKGROUNDS.push({ ...base, id: 'atelier_backgrounds_wall_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', type: 'wall', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_BACKGROUNDS.push('atelier_backgrounds_wall_4'); }
{ const base = backgroundById('wall_ribbons')!; BACKGROUNDS.push({ ...base, id: 'atelier_backgrounds_wall_5', baseId: base.id, name: base.name + ' · לילך חלומי', type: 'wall', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_BACKGROUNDS.push('atelier_backgrounds_wall_5'); }
{ const base = backgroundById('wall_stripes')!; BACKGROUNDS.push({ ...base, id: 'rare_backgrounds_wall_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', type: 'wall', price: 0, color: '#d5a640', rare: true });  }
{ const base = backgroundById('wall_dots')!; BACKGROUNDS.push({ ...base, id: 'rare_backgrounds_wall_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', type: 'wall', price: 0, color: '#8973ba', rare: true });  }
{ const base = backgroundById('floor_wood')!; BACKGROUNDS.push({ ...base, id: 'atelier_backgrounds_floor_1', baseId: base.id, name: base.name + ' · ורוד פריז', type: 'floor', price: 0, color: '#d970aa', rare: false }); EXTRA_FREE_BACKGROUNDS.push('atelier_backgrounds_floor_1'); }
{ const base = backgroundById('floor_tiles')!; BACKGROUNDS.push({ ...base, id: 'atelier_backgrounds_floor_2', baseId: base.id, name: base.name + ' · כחול ג׳ינס', type: 'floor', price: 0, color: '#5296cf', rare: false }); EXTRA_FREE_BACKGROUNDS.push('atelier_backgrounds_floor_2'); }
{ const base = backgroundById('floor_checker')!; BACKGROUNDS.push({ ...base, id: 'atelier_backgrounds_floor_3', baseId: base.id, name: base.name + ' · מנטה בוטיק', type: 'floor', price: 0, color: '#57b995', rare: false }); EXTRA_FREE_BACKGROUNDS.push('atelier_backgrounds_floor_3'); }
{ const base = backgroundById('floor_carpet')!; BACKGROUNDS.push({ ...base, id: 'atelier_backgrounds_floor_4', baseId: base.id, name: base.name + ' · אפרסק שקיעה', type: 'floor', price: 0, color: '#db985d', rare: false }); EXTRA_FREE_BACKGROUNDS.push('atelier_backgrounds_floor_4'); }
{ const base = backgroundById('floor_wood')!; BACKGROUNDS.push({ ...base, id: 'atelier_backgrounds_floor_5', baseId: base.id, name: base.name + ' · לילך חלומי', type: 'floor', price: 0, color: '#9572ce', rare: false }); EXTRA_FREE_BACKGROUNDS.push('atelier_backgrounds_floor_5'); }
{ const base = backgroundById('floor_wood')!; BACKGROUNDS.push({ ...base, id: 'rare_backgrounds_floor_1', baseId: base.id, name: base.name + ' · אוסף זהב מלכותי', type: 'floor', price: 0, color: '#d5a640', rare: true });  }
{ const base = backgroundById('floor_tiles')!; BACKGROUNDS.push({ ...base, id: 'rare_backgrounds_floor_2', baseId: base.id, name: base.name + ' · אוסף פנינה מנצנצת', type: 'floor', price: 0, color: '#8973ba', rare: true });  }
export const RARE_ITEMS: { kind: ShopKind; id: string; category: string }[] = [
 ...WEARABLES.filter(x=>x.rare).map(x=>({kind: 'wearable' as const,id:x.id,category: 'wearable:'+x.slot})),
 ...FURNITURE.filter(x=>x.rare).map(x=>({kind: 'furniture' as const,id:x.id,category:'furniture:'+x.kind})),
 ...BACKGROUNDS.filter(x=>x.rare).map(x=>({kind:'background' as const,id:x.id,category:'background:'+x.type})),
];

export const FREE_WEARABLES = WEARABLES.filter((w) => w.price === 0 && !w.rare).map((w) => w.id);
export const FREE_FURNITURE = FURNITURE.filter((f) => f.price === 0 && !f.rare).map((f) => f.id);
export const FREE_BACKGROUNDS = BACKGROUNDS.filter((b) => b.price === 0 && !b.rare).map((b) => b.id);

export type ShopKind = 'wearable' | 'furniture' | 'background';

export function priceOf(kind: ShopKind, id: string): number | undefined {
  if (kind === 'wearable') return wearableById(id)?.price;
  if (kind === 'furniture') return furnitureById(id)?.price;
  return backgroundById(id)?.price;
}

// Frozen version-2 ownership grants for the v2 → v3 save migration.
// Keep these independent of current prices so existing players retain every free item.
export const LEGACY_FREE_WEARABLES: string[] = [
  'party_hat',
  'bow',
  'heart_glasses',
  'collar_classic',
  'bandana',
  'tee_stripes',
  'sport_tank',
  'socks',
  'ribbon',
  'flower_clip',
  'sun_hat',
  'headband',
  'sunglasses',
  'bell_ribbon',
  'polka_bandana',
  'hoodie',
  'flowy_dress',
  'knit_vest',
  'ballet_shoes',
  'big_bow',
  'handbag',
  'bouquet',
];

export const LEGACY_FREE_FURNITURE: string[] = [
  'sofa',
  'mirror_tall',
  'floor_lamp',
  'rug_round',
  'plant_monstera',
  'clothes_rack',
  'dog_bed',
  'frame',
  'loveseat',
  'cozy_chair',
  'pouf',
  'cushions',
  'dressing_table',
  'arch_mirror',
  'wall_shelves',
  'hat_rack',
  'rug_fluffy',
  'rug_rect',
  'side_lamp',
  'wall_lamp',
  'hanging_plant',
  'flower_pot',
  'star_garland',
  'heart_wall',
  'round_dog_bed',
  'paw_poster',
];
