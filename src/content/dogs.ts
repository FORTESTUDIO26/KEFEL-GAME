export type Build = 'small' | 'medium' | 'large' | 'long';
export type EarType = 'floppy' | 'pointy' | 'long' | 'puff' | 'fold' | 'curly' | 'triangle' | 'bat' | 'hound' | 'feathered';
export type Pattern = 'none' | 'spots' | 'patch' | 'mask' | 'chest' | 'saddle' | 'urajiro' | 'pugmask' | 'tricolor' | 'blenheim';
export type TailType = 'wag' | 'curl' | 'fluffy' | 'stub' | 'pom' | 'twist' | 'flag' | 'plume';
/** Muzzle shape: 'flat' = short, wide, wrinkled snout (pug, french bulldog). */
export type MuzzleType = 'normal' | 'flat';

export interface DogDef {
  id: string;
  name: string;
  breed: string;
  personality: string;
  build: Build;
  ears: EarType;
  pattern: Pattern;
  tail: TailType;
  fur: string;
  furDark: string;
  light: string;
  eye: string;
  female: boolean;
  /** puffy topknot (poodle-like) */
  topknot?: boolean;
  /** curly coat all over (toy poodle) */
  curly?: boolean;
  /** muzzle shape (default 'normal') */
  muzzle?: MuzzleType;
  /** thick fluffy coat: a ruff around the face and chest (samoyed) */
  fluffy?: boolean;
}

export const DOGS: DogDef[] = [
  {
    id: 'bosko', female: false, name: 'בוסקו', breed: 'רטריבר זהוב', personality: 'חברותי, מתלהב מכל דבר ואוהב לרוץ בפארק.',
    build: 'large', ears: 'floppy', pattern: 'chest', tail: 'fluffy',
    fur: '#e2a65b', furDark: '#b97b37', light: '#f7d9a8', eye: '#3a2618',
  },
  {
    id: 'mika', female: true, name: 'מיקה', breed: 'פודל', personality: 'אוהבת נצנצים, מראות ובמה גדולה.',
    build: 'medium', ears: 'puff', pattern: 'none', tail: 'stub', topknot: true,
    fur: '#f6eef6', furDark: '#d9c6dc', light: '#ffffff', eye: '#2e2338',
  },
  {
    id: 'pitzi', female: true, name: 'פיצי', breed: 'צ׳יוואווה', personality: 'קטנה עם ביטחון עצמי ענק. אוהבת שמשגיחים עליה.',
    build: 'small', ears: 'pointy', pattern: 'chest', tail: 'wag',
    fur: '#d9a37a', furDark: '#a8724c', light: '#f5dcc4', eye: '#2b1d14',
  },
  {
    id: 'lola', female: true, name: 'לולה', breed: 'דלמטית', personality: 'מתעמלת נלהבת שאוהבת לקפוץ ולהסתובב.',
    build: 'medium', ears: 'floppy', pattern: 'spots', tail: 'wag',
    fur: '#fbfbfb', furDark: '#2f2f3a', light: '#ffffff', eye: '#2b2b33',
  },
  {
    id: 'ginji', female: false, name: 'ג׳ינג׳י', breed: 'קורגי', personality: 'מצחיק, תמיד רעב ותמיד מחייך.',
    build: 'long', ears: 'pointy', pattern: 'chest', tail: 'stub',
    fur: '#e88f45', furDark: '#b9622a', light: '#fff4e6', eye: '#2b1a10',
  },
  {
    id: 'shoko', female: false, name: 'שוקו', breed: 'לברדור', personality: 'רגוע, נעים ואוהב פינוקים וספה רכה.',
    build: 'large', ears: 'fold', pattern: 'none', tail: 'wag',
    fur: '#7a4e33', furDark: '#56351f', light: '#a77556', eye: '#22140c',
  },
  {
    id: 'nela', female: true, name: 'נלה', breed: 'האסקי', personality: 'הרפתקנית שאוהבת שלג ורוח בפנים.',
    build: 'large', ears: 'pointy', pattern: 'mask', tail: 'curl',
    fur: '#8e97a8', furDark: '#5f6778', light: '#f4f6fa', eye: '#3c7fc4',
  },
  {
    id: 'beigel', female: false, name: 'בייגל', breed: 'תחש', personality: 'סקרן, חוקר כל פינה ומת על חטיפים.',
    build: 'long', ears: 'long', pattern: 'none', tail: 'wag',
    fur: '#9b4f2c', furDark: '#6e341b', light: '#c27a52', eye: '#22120a',
  },
  {
    id: 'paprika', female: true, name: 'פפריקה', breed: 'שיצו', personality: 'דוגמנית מלידה. יודעת בדיוק מה מחמיא לה.',
    build: 'small', ears: 'puff', pattern: 'patch', tail: 'fluffy', topknot: true,
    fur: '#fff6ec', furDark: '#c88d5b', light: '#ffffff', eye: '#2a1a12',
  },
  {
    id: 'zaza', female: true, name: 'זאזא', breed: 'בורדר קולי', personality: 'חכמה, מסודרת ואוהבת לתכנן כל פרט.',
    build: 'medium', ears: 'fold', pattern: 'saddle', tail: 'fluffy',
    fur: '#2f2a35', furDark: '#1c1920', light: '#f7f4f0', eye: '#4a2e1b',
  },
  {
    id: 'kakao', female: false, name: 'קקאו', breed: 'פודל טוי', personality: 'פודל טוי קטנטן ומתולתל. אוהב לרקוד, להסתובב מול המראה ולקבל ליטופים.',
    build: 'small', ears: 'curly', pattern: 'none', tail: 'pom', topknot: true, curly: true,
    fur: '#8a5636', furDark: '#6a3f26', light: '#a26c4a', eye: '#1c120c',
  },
  {
    id: 'mochi', female: true, name: 'מוצ׳י', breed: 'שיבה אינו', personality: 'עצמאית ושובבה, עם זנב מסולסל וחיוך של שועל.',
    build: 'medium', ears: 'triangle', pattern: 'urajiro', tail: 'curl',
    fur: '#d9853c', furDark: '#a65a20', light: '#fff3e2', eye: '#2a170c',
  },
  {
    id: 'mufi', female: false, name: 'מופי', breed: 'פאג', personality: 'מתוק ומקומט, נוחר קצת ומת על חיבוקים.',
    build: 'small', ears: 'fold', pattern: 'pugmask', tail: 'twist', muzzle: 'flat',
    fur: '#e8cc98', furDark: '#3b3230', light: '#f6e7c9', eye: '#1e1612',
  },
  {
    id: 'chips', female: false, name: 'צ׳יפס', breed: 'ביגל', personality: 'אף מעולה וזנב שתמיד למעלה. מוצא כל הפתעה.',
    build: 'medium', ears: 'hound', pattern: 'tricolor', tail: 'flag',
    fur: '#c98a4b', furDark: '#3a2c25', light: '#fffaf2', eye: '#2b1a10',
  },
  {
    id: 'shalgit', female: true, name: 'שלגית', breed: 'סמויד', personality: 'ענן לבן ורך שתמיד מחייך. אוהבת לשמח את כולם.',
    build: 'large', ears: 'triangle', pattern: 'none', tail: 'plume', fluffy: true,
    fur: '#fbfaf6', furDark: '#d9dde6', light: '#ffffff', eye: '#2a2430',
  },
  {
    id: 'pierre', female: false, name: 'פייר', breed: 'בולדוג צרפתי', personality: 'אוזני עטלף ולב ענק. רגוע, מצחיק ואוהב תנומות.',
    build: 'small', ears: 'bat', pattern: 'chest', tail: 'stub', muzzle: 'flat',
    fur: '#6f6874', furDark: '#4a4450', light: '#f4ede6', eye: '#241d22',
  },
  {
    id: 'rosie', female: true, name: 'רוזי', breed: 'קבליר קינג צ׳ארלס', personality: 'עדינה ומנומסת, עם אוזניים גליות ועיניים גדולות.',
    build: 'small', ears: 'feathered', pattern: 'blenheim', tail: 'fluffy',
    fur: '#fffaf3', furDark: '#b8652e', light: '#ffffff', eye: '#2a1810',
  },
];

export function dogById(id: string): DogDef {
  return DOGS.find((d) => d.id === id) ?? DOGS[0];
}

/** Dogs that can be the studio dog (free, also later from the studio screen). */
export const STARTER_DOG_IDS = ['bosko', 'mika', 'lola', 'ginji', 'nela', 'paprika', 'kakao', 'mochi', 'mufi', 'chips', 'shalgit', 'pierre', 'rosie'];

/** Pick the masculine/feminine form: "אני {מופיע|מופיעה}" → the right word for this dog. */
export function gx(text: string, female: boolean): string {
  return text.replace(/\{([^|{}]*)\|([^|{}]*)\}/g, (_, m: string, f: string) => (female ? f : m));
}
