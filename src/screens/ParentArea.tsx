import { useEffect, useRef, useState } from 'react';
import { emptyDaily } from '../learning/data';
import { ALL_KEYS, factKey, keysInRange, parseKey } from '../learning/facts';
import { addDays, dayKey, emptyStats, INTERVAL_DAYS, STATE_LABEL, type FactStats, type LearningState } from '../learning/scheduler';
import { PRACTICE_MILESTONES } from '../state/economy';
import { backupRaw, defaultSave, exportText, parseImport, SAVE_KEY } from '../state/save';
import { useStore } from '../state/store';
import type { SaveData } from '../state/types';
import { Eq, Modal } from '../ui/common';
import { downloadText, readFileText } from '../ui/files';
import { storageProtected } from '../ui/device';
import { Icon } from '../ui/icons';
import { useToast } from '../ui/toast';

type Tab = 'progress' | 'settings' | 'backup';

const SERIES = [
  { key: 'independent', label: 'זכרה לבד (לפני שראתה)', color: '#1f9e9a' },
  { key: 'hinted', label: 'פתרה בעזרת חישוב', color: '#8b5cf6' },
  { key: 'helped', label: 'אחרי עזרה (ראתה את התשובה)', color: '#c2417f' },
  { key: 'wrong', label: 'טעות', color: '#d9822b' },
] as const;

/** Chart value per series; "after help" combines correct-after-help and practice with the answer shown. */
function seriesValue(log: ReturnType<typeof emptyDaily>, key: (typeof SERIES)[number]['key']): number {
  return key === 'helped' ? log.afterHelp + log.supported : log[key];
}

const STATE_MARK: Record<LearningState, string> = { new: '', learning: '•', reviewing: '✓', mastered: '★' };

function fmtDate(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
}

export function needsWork(s: FactStats): boolean {
  if (s.attempts === 0) return false;
  return s.state === 'learning' || (s.wrong > 0 && s.streak === 0) || s.hintedCorrect + s.supported > s.independentCorrect;
}

export function ParentArea({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>('progress');
  return (
    <div className="parent">
      <div className="row between wrap">
        <h1 className="h-inline">ההתקדמות של ליאורי</h1>
        <button className="secondary" onClick={onExit}>
          <Icon name="arrowR" /> חזרה למשחק
        </button>
      </div>
      <div className="tabs" role="tablist">
        {(
          [
            ['progress', 'התקדמות'],
            ['settings', 'הגדרות'],
            ['backup', 'שמירה וגיבוי'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'progress' && <Progress />}
      {tab === 'settings' && <SettingsPanel />}
      {tab === 'backup' && <BackupPanel />}
    </div>
  );
}

function Progress() {
  const { save } = useStore();
  const L = save.learning;
  const st = (k: string) => L.facts[k] ?? emptyStats(k);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const totals = Object.values(L.daily).reduce(
    (a, d) => ({ q: a.q + d.questions, i: a.i + d.independent, h: a.h + d.hinted, w: a.w + d.wrong }),
    { q: 0, i: 0, h: 0, w: 0 }
  );
  const days = Object.keys(L.daily).filter((d) => L.daily[d].questions > 0).length;
  const learnSessions = Object.values(L.daily).reduce((n, d) => n + d.learnSessions, 0);
  const range = keysInRange(save.settings.tables);
  const mastered = ALL_KEYS.filter((k) => st(k).state === 'mastered');
  const weak = ALL_KEYS.filter((k) => needsWork(st(k))).sort((a, b) => st(b).wrong + st(b).hintUses - (st(a).wrong + st(a).hintUses));
  const reviewing = ALL_KEYS.filter((k) => st(k).state === 'reviewing');
  const hasData = totals.q > 0;

  return (
    <div className="stack">
      <div className="tiles">
        <div className="tile card">
          <span className="tile-num">{days}</span>
          <span>ימים עם תרגול</span>
        </div>
        <div className="tile card">
          <span className="tile-num">{totals.q}</span>
          <span>תשובות ותרגולים בסך הכול</span>
        </div>
        <div className="tile card">
          <span className="tile-num">{learnSessions}</span>
          <span>שיעורי ״לומדות וזוכרות״</span>
        </div>
        <div className="tile card">
          <span className="tile-num">{mastered.length}</span>
          <span>תרגילים שנזכרים היטב (מתוך 55)</span>
        </div>
        <div className="tile card">
          <span className="tile-num">{weak.length}</span>
          <span>תרגילים שדורשים חיזוק</span>
        </div>
      </div>

      {!hasData && (
        <div className="card">
          <p>עדיין אין נתוני תרגול. הנתונים יופיעו כאן אחרי הלקוח הראשון. אנחנו לא מציגים הערכות או אבחנות — רק את מה שנענה בפועל.</p>
        </div>
      )}

      {hasData && (
        <>
          {L.learnSet.length > 0 && (
            <section className="card stack">
              <h2>העובדות שבתרגול ב״לומדות וזוכרות״</h2>
              <p className="muted small">
                עובדה עוזבת את הקבוצה כשהיא נזכרה לבד בשני ימים שונים. אם בשיעור האחרון רוב התשובות היו בעזרה, הקבוצה נשארת והתמיכה גדלה.
                {L.learnSession ? ' יש שיעור שנעצר באמצע ונשמר.' : ''}
              </p>
              <FactTable keys={L.learnSet} st={st} empty="" />
            </section>
          )}

          <section className="card stack">
            <h2>מפת לוח הכפל</h2>
            <p className="muted small">
              כל משבצת היא תרגיל (7×8 ו־8×7 נספרים יחד). הקישו על משבצת לפרטים.
              {save.settings.tables.length < 10 && ' משבצות מחוץ לטווח התרגול שנבחר מוצגות בהיר.'}
            </p>
            <div className="fact-legend">
              {(['mastered', 'reviewing', 'learning', 'new'] as LearningState[]).map((s) => (
                <span key={s} className={`legend-item st-${s}`}>
                  <span className="legend-swatch">{STATE_MARK[s] || ' '}</span> {STATE_LABEL[s]}
                </span>
              ))}
            </div>
            <div className="fact-grid" dir="ltr" role="grid" aria-label="מפת התרגילים">
              <span className="fg-corner">×</span>
              {Array.from({ length: 10 }, (_, i) => (
                <span key={`h${i}`} className="fg-head">
                  {i + 1}
                </span>
              ))}
              {Array.from({ length: 10 }, (_, r) => (
                <FactRow key={r} r={r + 1} st={st} inRange={(k) => range.includes(k)} onOpen={setOpenKey} />
              ))}
            </div>
          </section>

          <section className="card stack">
            <h2>פעילות ב־14 הימים האחרונים</h2>
            <ActivityChart daily={L.daily} />
          </section>

          <div className="two-col">
            <section className="card stack">
              <h2>נזכרים היטב</h2>
              <p className="muted small">הצלחות עצמאיות (בלי רמז) ב־3 ימים שונים לפחות, ו־3 תשובות עצמאיות אחרונות ברצף.</p>
              <FactTable keys={mastered} st={st} empty="עדיין אין — זה דורש תרגול בכמה ימים שונים." />
              {reviewing.length > 0 && (
                <p className="small">
                  מתחזקים (הצלחה עצמאית לפחות ביום אחד): {reviewing.map((k) => <Eq key={k}>{k.replace('x', '×')} </Eq>)}
                </p>
              )}
            </section>
            <section className="card stack">
              <h2>דורשים חיזוק</h2>
              <p className="muted small">תרגילים עם טעות שעוד לא תוקנה בשליפה עצמאית, או שנפתרו יותר פעמים בעזרת רמז מאשר לבד.</p>
              <FactTable keys={weak} st={st} empty="אין כרגע תרגילים שדורשים חיזוק." />
            </section>
          </div>
        </>
      )}

      <section className="card stack explain">
        <h2>איך מחושבת ההתקדמות?</h2>
        <ul>
          <li>
            <strong>הדרגות:</strong> ״זכרה לבד״ = תשובה נכונה לפני שראתה את התשובה באותו יום, בלי רמז. ״פתרה בעזרת חישוב״ = תשובה נכונה אחרי רמז. ״ענתה נכון
            אחרי עזרה״ = תשובה נכונה באותו יום שבו כבר ראתה את התשובה או קיבלה עזרה. ״ראתה את התשובה״ = כרטיס לימוד, תרגול עם תשובה גלויה או ״עוד לא זוכרת״. רק
            ״זכרה לבד״ נחשבת כזכירה.
          </li>
          <li>
            ב״לומדות וזוכרות״ מתרגלים שש עובדות בשלושה זוגות. כל מפגש מתחיל בבדיקת זיכרון קצרה לכל עובדה שתורגלה ביום קודם — גם אם אז נלמדה עם עזרה —
            לפני שמוצגת תשובה כלשהי. עובדה שנזכרה לא נלמדת שוב היום; עובדה שלא נזכרה, וכל עובדה חדשה, עוברות למידה נתמכת: רואים ואומרים בקול, מתרגלים עם
            התשובה, עושים משהו קטן בעיצוב, ואז מנסים לזכור.
          </li>
          <li>אחרי עזרה, התרגיל חוזר מאוחר יותר באותו שיעור (אחרי פעילות אחרת, עד פעמיים). תשובה נכונה באותו יום שבו הוצגה התשובה לא נחשבת עדיין ליום של זכירה.</li>
          <li>הלקוחות שואלים בעיקר עובדות שכבר נלמדו. עובדה חדשה מוצגת קודם עם התשובה, ורק אחר כך נשאלת.</li>
          <li>
            <strong>שליפה עצמאית</strong> = תשובה נכונה בניסיון הראשון בלי רמז. <strong>תשובה עם רמז</strong> נחשבת נכונה, אבל לא כזיכרון עצמאי.
          </li>
          <li>תרגיל חדש, תרגיל שנפתר עם רמז או תרגיל עם טעות חוזר כמה שאלות אחר כך באותו מקבץ.</li>
          <li>
            הצלחה עצמאית מזיזה את התרגיל שלב אחד קדימה (פעם אחת ביום לכל היותר). המרווחים: {INTERVAL_DAYS.slice(1).join(', ')} ימים. רמז מחזיר שלב אחד אחורה
            ומחזיר את התרגיל למחרת; טעות מחזירה להתחלה.
          </li>
          <li>תשובה נכונה באותו יום אחרי טעות או רמז מחזירה את התרגיל למחר, אבל עוד לא נחשבת כשליפה עצמאית.</li>
          <li>״נזכר היטב״ דורש הצלחות עצמאיות ב־3 ימים שונים לפחות. תשובה נכונה אחת לא מספיקה.</li>
          <li>כל מקבץ משלב תרגילים מוכרים, חזרות ומעט תרגילים חדשים (עד 6 חדשים ביום), ונמנע מכמה תרגילים קשים ברצף.</li>
          <li>כשאין חזרות מתוכננות, המשחק מציע תרגול חופשי שלא מזיז את לוח החזרות קדימה.</li>
          <li>משחק ההתאמות הוא גיוון בלבד ואינו נספר כשליפה עצמאית.</li>
          <li>יום בלי משחק לא מוחק שום התקדמות. בונוס ההתמדה סופר ימי תרגול בסך הכול ({PRACTICE_MILESTONES.slice(0, 3).map((m) => m.days).join(', ')}…), לא רצף ימים.</li>
        </ul>
      </section>

      {openKey && <FactDetail k={openKey} s={st(openKey)} onClose={() => setOpenKey(null)} />}
    </div>
  );
}

function FactRow({ r, st, inRange, onOpen }: { r: number; st: (k: string) => FactStats; inRange: (k: string) => boolean; onOpen: (k: string) => void }) {
  return (
    <>
      <span className="fg-head">{r}</span>
      {Array.from({ length: 10 }, (_, c) => {
        const k = factKey(r, c + 1);
        const s = st(k);
        return (
          <button
            key={c}
            className={`fg-cell st-${s.state} ${inRange(k) ? '' : 'out'}`}
            onClick={() => onOpen(k)}
            aria-label={`${r} כפול ${c + 1}: ${STATE_LABEL[s.state]}`}
            title={`${r}×${c + 1} — ${STATE_LABEL[s.state]}`}
          >
            {STATE_MARK[s.state]}
          </button>
        );
      })}
    </>
  );
}

function FactTable({ keys, st, empty }: { keys: string[]; st: (k: string) => FactStats; empty: string }) {
  if (!keys.length) return <p className="muted">{empty}</p>;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>תרגיל</th>
            <th>זכרה לבד</th>
            <th>פתרה בעזרת חישוב</th>
            <th>ענתה נכון אחרי עזרה</th>
            <th>ראתה את התשובה</th>
            <th>טעויות</th>
            <th>ימים שבהם זכרה לבד</th>
            <th>חזרה הבאה</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const s = st(k);
            const [a, b] = parseKey(k);
            return (
              <tr key={k}>
                <td>
                  <Eq>
                    {a} × {b}
                  </Eq>
                </td>
                <td>{s.independentCorrect}</td>
                <td>{s.hintedCorrect}</td>
                <td>{s.afterHelpCorrect}</td>
                <td>{s.supported}</td>
                <td>{s.wrong}</td>
                <td>{s.independentDays.length}</td>
                <td>{fmtDate(s.nextDue)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FactDetail({ k, s, onClose }: { k: string; s: FactStats; onClose: () => void }) {
  const [a, b] = parseKey(k);
  const rows: [string, string | number][] = [
    ['מצב', STATE_LABEL[s.state]],
    ['ניסיונות', s.attempts],
    ['זכרה לבד (בלי לראות את התשובה ובלי רמז)', s.independentCorrect],
    ['פתרה בעזרת חישוב (אחרי רמז)', s.hintedCorrect],
    ['ענתה נכון אחרי עזרה (באותו יום שבו ראתה את התשובה)', s.afterHelpCorrect],
    ['תרגלה עם עזרה (התשובה הוצגה: כרטיס לימוד, העתקה, ״עוד לא זוכרת״)', s.supported],
    ['טעויות', s.wrong],
    ['פעמים שנעזרה ברמז', s.hintUses],
    ['רצף הצלחות עצמאיות', s.streak],
    ['ימים שונים עם הצלחה עצמאית', s.independentDays.length],
    ['תרגול אחרון', fmtDate(s.lastPracticed)],
    ['חזרה הבאה', fmtDate(s.nextDue)],
    ['נשאל כ־' + `${a}×${b}` + ' / ' + `${b}×${a}`, `${s.seenAB} / ${s.seenBA}`],
    ['משחק התאמות (לא נספר כזיכרון)', s.recognition],
  ];
  return (
    <Modal title={`${a} × ${b} = ${a * b}`} onClose={onClose}>
      <table className="data-table">
        <tbody>
          {rows.map(([label, v]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

function ActivityChart({ daily }: { daily: SaveData['learning']['daily'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const today = Date.now();
  const days = Array.from({ length: 14 }, (_, i) => {
    const t = addDays(today, i - 13);
    const key = dayKey(t);
    return { key, t, log: daily[key] ?? emptyDaily() };
  });
  const max = Math.max(4, ...days.map((d) => d.log.questions));
  const W = 560;
  const H = 200;
  const pad = { l: 34, r: 8, t: 10, b: 28 };
  const bw = (W - pad.l - pad.r) / 14;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, Math.round(max / 2), max];
  const anyActivity = days.some((d) => d.log.questions > 0);

  return (
    <div className="stack">
      <div className="chart-legend">
        {SERIES.map((s) => (
          <span key={s.key} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} /> {s.label}
          </span>
        ))}
        <button className="ghost small" onClick={() => setAsTable((v) => !v)}>
          {asTable ? 'תצוגת גרף' : 'תצוגת טבלה'}
        </button>
      </div>
      {!anyActivity && <p className="muted">לא היה תרגול ב־14 הימים האחרונים. ההתקדמות הקודמת נשמרת.</p>}
      {!asTable ? (
        <div className="chart-wrap" dir="ltr">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="מספר תשובות ביום, לפי סוג">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e7e1ef" strokeWidth={1} />
                <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#7a6b8f">
                  {t}
                </text>
              </g>
            ))}
            {days.map((d, i) => {
              let acc = 0;
              const x = pad.l + i * bw + 3;
              const w = bw - 6;
              return (
                <g key={d.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
                  <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill={hover === i ? '#f3eefb' : 'transparent'} />
                  {SERIES.map((s) => {
                    const v = seriesValue(d.log, s.key);
                    if (!v) return null;
                    const y0 = y(acc);
                    acc += v;
                    const y1 = y(acc);
                    return <rect key={s.key} x={x} y={y1 + 1} width={w} height={Math.max(0, y0 - y1 - 2)} rx={3} fill={s.color} />;
                  })}
                  <text x={x + w / 2} y={H - 10} textAnchor="middle" fontSize={10} fill="#7a6b8f">
                    {new Date(d.t).getDate()}
                  </text>
                </g>
              );
            })}
            <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke="#b9aecb" strokeWidth={1} />
          </svg>
          {hover !== null && (
            <div
              className="chart-tip"
              dir="rtl"
              style={{
                left: `${((pad.l + hover * bw + bw / 2) / W) * 100}%`,
                // keep the tooltip inside the chart near the edges
                transform: `translateX(${hover < 3 ? '-10%' : hover > 10 ? '-90%' : '-50%'})`,
              }}
            >
              <strong>{new Date(days[hover].t).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' })}</strong>
              {days[hover].log.questions === 0 ? (
                <span>אין תרגול</span>
              ) : (
                <>
                  {SERIES.map((s) => (
                    <span key={s.key}>
                      {s.label}: {seriesValue(days[hover].log, s.key)}
                    </span>
                  ))}
                  <span>
                    שליפה עצמאית: {Math.round((days[hover].log.independent / days[hover].log.questions) * 100)}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>יום</th>
                <th>תשובות</th>
                {SERIES.map((s) => (
                  <th key={s.key}>{s.label}</th>
                ))}
                <th>% עצמאי</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.key}>
                  <td>{new Date(d.t).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}</td>
                  <td>{d.log.questions}</td>
                  {SERIES.map((s) => (
                    <td key={s.key}>{seriesValue(d.log, s.key)}</td>
                  ))}
                  <td>{d.log.questions ? `${Math.round((d.log.independent / d.log.questions) * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingsPanel() {
  const { save, update } = useStore();
  const tables = save.settings.tables;
  const toggle = (t: number) => {
    const next = tables.includes(t) ? tables.filter((x) => x !== t) : [...tables, t].sort((a, b) => a - b);
    if (next.length === 0) return;
    update((s) => ({ ...s, settings: { ...s.settings, tables: next } }));
  };
  return (
    <div className="stack">
      <section className="card stack">
        <h2>טווח הכפולות לתרגול</h2>
        <p className="muted small">תרגיל נכלל אם אחד המספרים בו נמצא בטווח שנבחר (לפחות כפולה אחת). השינוי חל מהלקוח הבא.</p>
        <div className="table-picker" dir="ltr">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
            <label key={t} className={`tp ${tables.includes(t) ? 'on' : ''}`}>
              <input type="checkbox" checked={tables.includes(t)} onChange={() => toggle(t)} disabled={tables.length === 1 && tables.includes(t)} />
              ×{t}
            </label>
          ))}
        </div>
        <div className="row wrap">
          <button className="ghost small" onClick={() => update((s) => ({ ...s, settings: { ...s.settings, tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] } }))}>
            כל הלוח
          </button>
          <button className="ghost small" onClick={() => update((s) => ({ ...s, settings: { ...s.settings, tables: [6, 7, 8, 9] } }))}>
            רק 6–9
          </button>
        </div>
      </section>
      <section className="card stack">
        <h2>חוויה</h2>
        <label className="check">
          <input type="checkbox" checked={save.settings.sound} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, sound: e.target.checked } }))} />
          צלילים
        </label>
        <label className="check">
          <input type="checkbox" checked={save.settings.reduceMotion} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, reduceMotion: e.target.checked } }))} />
          הפחתת אנימציות (גם הגדרת ״הפחתת תנועה״ של המכשיר נשמרת תמיד)
        </label>
        <p className="muted small">אין במשחק מגבלת זמן, הורדת מטבעות על טעויות, פרסומות או רכישות בכסף אמיתי.</p>
      </section>
    </div>
  );
}

function BackupPanel() {
  const { save, replace, storage, persistent } = useStore();
  const notify = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<SaveData | null>(null);
  const [importError, setImportError] = useState<string[] | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');
  const [protectedState, setProtectedState] = useState<boolean | null>(null);
  useEffect(() => {
    void storageProtected().then(setProtectedState);
  }, []);

  const backupCurrent = () => {
    if (storage) backupRaw(storage, JSON.stringify(save), Date.now());
  };

  return (
    <div className="stack">
      <section className="card stack">
        <h2>איפה נשמרת ההתקדמות?</h2>
        <p>
          כל ההתקדמות (הסטודיו, המלתחה, המטבעות, האלבום ונתוני הלמידה) נשמרת <strong>רק בדפדפן הזה ובמכשיר הזה</strong>. אין חשבון ואין שרת. ניקוי נתוני
          הדפדפן או מעבר למכשיר אחר לא יעבירו את ההתקדמות — לכן כדאי לייצא קובץ גיבוי מדי פעם.
        </p>
        <ul className="small">
          <li>בכל טלפון ההתקדמות נפרדת: מה שליאורי משחקת באייפון שלה לא מתערבב עם מה שנועה משחקת בסמסונג.</li>
          <li>באייפון, משחק שנפתח מאייקון במסך הבית שומר בנפרד מספארי. כדאי לבחור דרך אחת — עדיף האייקון — ולשחק תמיד ממנה.</li>
          <li>כתובת אחרת (למשל המחשב לעומת האתר) = שמירה אחרת. להעברה: ייצוא כאן וייבוא בכתובת החדשה.</li>
          <li>מומלץ לייצא גיבוי פעם בשבוע — ספארי עלול למחוק נתוני אתרים שלא נפתחו זמן רב.</li>
        </ul>
        {protectedState !== null && (
          <p className={protectedState ? 'muted small' : 'warn-box small'}>
            {protectedState
              ? 'הדפדפן אישר לשמור את נתוני המשחק לאורך זמן.'
              : 'הדפדפן לא אישר שמירה קבועה. בטלפון, הוספה למסך הבית וגיבוי קבוע עוזרים לשמור על ההתקדמות.'}
          </p>
        )}
        {!persistent && <p className="warn-box">כרגע השמירה בדפדפן לא זמינה, וההתקדמות תישמר רק עד סגירת הדף. מומלץ לייצא קובץ עכשיו.</p>}
        <div className="row wrap">
          <button
            className="primary"
            onClick={async () => {
              const r = await downloadText(exportText(save, Date.now()), `liori-studio-${dayKey(Date.now())}.json`);
              if (r === 'downloaded') notify('קובץ הגיבוי נשמר בתיקיית ההורדות');
              else if (r === 'shared') notify('קובץ הגיבוי מוכן — שמרו אותו בקבצים או שלחו לעצמכם');
              else if (r === 'failed') notify('לא הצלחנו ליצור קובץ גיבוי בדפדפן הזה');
            }}
          >
            <Icon name="download" /> ייצוא קובץ גיבוי
          </button>
          <button className="secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" /> ייבוא מקובץ
          </button>
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              const text = await readFileText(f).catch(() => '');
              const r = parseImport(text, Date.now());
              if (r.ok) {
                setImportError(null);
                setPending(r.data);
              } else setImportError(r.errors);
            }}
          />
        </div>
        {importError && (
          <div className="warn-box" role="alert">
            <p>
              <strong>לא ניתן לייבא את הקובץ:</strong>
            </p>
            <ul>
              {importError.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p>ההתקדמות הנוכחית לא השתנתה.</p>
          </div>
        )}
      </section>

      <section className="card stack">
        <h2>איפוס</h2>
        <p className="muted">מוחק את הסטודיו, האלבום, המטבעות ונתוני הלמידה ומתחיל מההתחלה. עותק של המצב הנוכחי נשמר בדפדפן לפני האיפוס, אבל כדאי לייצא קובץ קודם.</p>
        <button className="danger" onClick={() => setResetOpen(true)}>
          <Icon name="trash" /> איפוס כל ההתקדמות
        </button>
      </section>

      {pending && (
        <Modal title="להחליף את ההתקדמות?" onClose={() => setPending(null)}>
          <div className="stack">
            <p>
              הקובץ תקין: סטודיו ״{pending.profile.studioName}״, <bdi dir="ltr">{pending.coins}</bdi> מטבעות, <bdi dir="ltr">{pending.album.length}</bdi> תמונות באלבום ו־
              <bdi dir="ltr">{Object.keys(pending.learning.facts).length}</bdi> תרגילים עם נתונים.
            </p>
            <p>ההתקדמות הנוכחית תוחלף. עותק שלה יישמר בדפדפן לפני ההחלפה.</p>
            <div className="row">
              <button
                className="primary"
                onClick={() => {
                  backupCurrent();
                  replace(pending);
                  setPending(null);
                  notify('ההתקדמות יובאה בהצלחה');
                }}
              >
                כן, לייבא
              </button>
              <button className="ghost" onClick={() => setPending(null)}>
                ביטול
              </button>
            </div>
          </div>
        </Modal>
      )}

      {resetOpen && (
        <Modal title="איפוס כל ההתקדמות" onClose={() => setResetOpen(false)}>
          <div className="stack">
            <p>
              כדי לאשר, כתבו את המילה <strong>איפוס</strong>:
            </p>
            <input value={resetText} onChange={(e) => setResetText(e.target.value)} aria-label="אישור איפוס" />
            <div className="row">
              <button
                className="danger"
                disabled={resetText.trim() !== 'איפוס'}
                onClick={() => {
                  backupCurrent();
                  storage?.removeItem(SAVE_KEY);
                  replace(defaultSave(Date.now()));
                  setResetOpen(false);
                }}
              >
                לאפס עכשיו
              </button>
              <button className="ghost" onClick={() => setResetOpen(false)}>
                ביטול
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
