import type { Screen } from '../App';
import { RichText } from '../ui/common';
import { getStats } from '../learning/data';
import { factKey } from '../learning/facts';
import { dayKey } from '../learning/scheduler';
import { recordAnswer } from '../state/game';
import { useStore } from '../state/store';
import type { SaveData } from '../state/types';
import './Tricks.css';

const cards = [
  { title: 'עוגן של 10', text: 'בלוח הכפל שלנו, כפול 10 הוא המספר עם אפס בסוף: [[7 × 10 = 70]]. אפשר להתחיל מכאן כדי לחשב עובדות קרובות.' },
  { title: 'עוגן של 5', text: 'כפול 5 הוא חצי מכפול 10. כדי לחשב [[6 × 5]], מתחילים משש עשרות ולוקחים חצי: [[60 ÷ 2 = 30]], ולכן [[6 × 5 = 30]]. מכאן אפשר להוסיף קבוצות כדי לחשב עובדות קרובות.' },
  { title: '9 הוא כמעט 10', text: 'מחשבים כפול 10 ומורידים קבוצה אחת: [[7 × 9 = 70 − 7 = 63]]. מורידים את המספר שהכפלנו, כי נשארות תשע קבוצות.' },
  { title: '4: להכפיל פעמיים', text: 'כדי לחשב [[7 × 4]], מכפילים ב־2 ואז שוב ב־2: [[7 → 14 → 28]]. לכן [[7 × 4 = 28]]. בכל צעד מכפילים את התוצאה הקודמת.' },
  { title: '8: להכפיל שלוש פעמים', text: 'כדי לחשב [[7 × 8]], מכפילים ב־2 שלוש פעמים: [[7 → 14 → 28 → 56]]. לכן [[7 × 8 = 56]]. בכל צעד מכפילים את התוצאה הקודמת.' },
  { title: 'אותה עובדה, סדר אחר', text: 'אפשר להחליף את סדר הגורמים: [[6 × 7 = 7 × 6 = 42]]. אם אחת העובדות מוכרת לך, היא יכולה לעזור גם בכיוון השני. כפל וחילוק קשורים: אם [[6 × 7 = 42]], אז [[42 ÷ 6 = 7]].' },
];

export function Tricks({ onGo }: { onGo: (screen: Screen) => void }) {
  const { update } = useStore();
  return <TricksContent onGo={onGo} onExpose={(a, b) => {
    const now = Date.now();
    update((save) => recordTrickExposure(save, a, b, now));
  }} />;
}

/** Existing same-day help marker survives navigation, reloads and reversed factors.
 * If help was already recorded today, another example adds no practice count. */
export function recordTrickExposure(save: SaveData, a: number, b: number, now: number): SaveData {
  const key=factKey(a,b),prev=getStats(save.learning,key);
  if (prev.lastMissDay === dayKey(now)) return save;
  const next=recordAnswer(save, { a, b, outcome: 'supported', usedHint: false, exposureOnly: true }, now);
  if(prev.attempts===0)return next;
  // Browsing an explanation reveals an answer, but is not evidence of forgetting.
  return {...next,learning:{...next.learning,facts:{...next.learning.facts,[key]:{...next.learning.facts[key],streak:prev.streak,cleanDays:[...prev.cleanDays],stage:prev.stage,nextDue:prev.nextDue,state:prev.state}}}};
}

const targets = [[7, 10], [6, 5], [7, 9], [7, 4], [7, 8], [6, 7]] as const;
const intermediateTargets:readonly (readonly (readonly [number,number])[])[]=[[],[[6,10]],[[7,10]],[[7,2]],[[7,2],[7,4]],[]];
const descriptions = [
  'כפול 10: בלוח הכפל שלנו מוסיפים אפס בסוף המספר.',
  'כפול 5 הוא חצי מכפול 10. אפשר להוסיף קבוצות לעוגן מוכר.',
  'מחשבים כפול 10 ומורידים קבוצה אחת.',
  'כפול 4: מכפילים ב־2 פעמיים.',
  'כפול 8: מכפילים ב־2 שלוש פעמים.',
  'סדר הגורמים יכול להתחלף בלי לשנות את התוצאה. כפל וחילוק קשורים.',
];

export function TricksContent({ onGo, onExpose }: {
  onGo: (screen: Screen) => void;
  onExpose: (a: number, b: number) => void;
}) {
  return (
    <section className="tricks" dir="rtl" aria-labelledby="tricks-title">
      <header>
        <h1 id="tricks-title">טריקים לזכור את לוח הכפל</h1>
        <p>כל הכרטיסים פתוחים לך, בכל זמן וללא מטבעות.</p>
        <p>טריק עוזר לחשב כשלא זוכרות. שליפה עצמאית היא לענות מהזיכרון בלי רמז ובלי לחשב. אפשר לתרגל את שתיהן; חישוב בעזרת טריק עדיין אינו שליפה עצמאית.</p>
      </header>
      <div className="tricks-grid">
        {cards.map((card, i) => (
          <article className="card tricks-card" key={card.title} aria-labelledby={`trick-${i}`}>
            <h2 id={`trick-${i}`}>{card.title}</h2>
            <p>{descriptions[i]}</p>
            <details onToggle={(event) => {
              if (event.currentTarget.open) {
                const [a, b] = targets[i];
                onExpose(a, b);
                for(const [x,y] of intermediateTargets[i])onExpose(x,y);
              }
            }}>
              <summary>לפתיחת דוגמה מוסברת</summary>
              <p><RichText text={card.text} /></p>
              <p className="muted">ראית כאן תשובה בעזרת הסבר. ניסיון נוסף היום באותה עובדה ייחשב כתשובה אחרי עזרה, ולא כשליפה עצמאית.</p>
            </details>
          </article>
        ))}
        <article className="card tricks-card" aria-labelledby="recall-title">
          <h2 id="recall-title">לראות · לומר · להסתיר · לחזור</h2>
          <ol>
            <li>ראי עובדה אחת ואת התשובה, והביני איך מחשבים אותה.</li>
            <li>אמרי בקול את התרגיל ואת התשובה.</li>
            <li>הסתירי את התשובה ונסי לומר אותה מהזיכרון. אם לא נזכרת, הציצי ובדקי שוב.</li>
            <li>חזרי לאותה עובדה אחרי תרגילים אחרים, וגם בפעם הבאה שתשחקי.</li>
          </ol>
          <p>כל אחת לומדת בקצב שלה. אם נעזרת בחישוב או ברמז, זה תרגול מועיל; בהמשך אפשר לנסות שוב בלי העזרה.</p>
        </article>
      </div>
      <button className="primary" onClick={() => onGo('learn')}>לתרגול בלומדות</button>
    </section>
  );
}
