// Home: Lola's house. Every times table opens the next room — the one idea the whole game follows:
// learn the current table → its challenge opens a room → design it (10 minutes per lesson).
import type { Screen } from '../App';
import { chooseLearnSet, currentTable, tableOrder, tableProgress } from '../learning/learnPath';
import { startLearnSession } from '../state/game';
import { playStatus } from '../state/playTime';
import { useStore } from '../state/store';
import type { SaveData } from '../state/types';
import { challengeReady, HOUSE_ORDER, ROOMS, startOpening } from '../state/world';
import { CoinAmount } from '../ui/common';
import { Icon } from '../ui/icons';

export function minutesLabel(ms: number): string {
  const m = Math.ceil(ms / 60_000);
  return m <= 1 ? 'דקה' : `${m} דקות`;
}

const roomName = (id: string | null | undefined) => ROOMS.find((r) => r.id === id)?.name ?? null;

/** Each table with the room it opens (finished tables are done; the rest follow the closed rooms in order). */
export function houseMap(s: SaveData): { table: number; room: string | null; state: 'done' | 'current' | 'later' }[] {
  const order = tableOrder(s.settings.tables);
  const cur = currentTable(s.learning, s.settings.tables);
  const locked = HOUSE_ORDER.filter((r) => !s.world.unlocked.includes(r));
  const done = s.learning.tablesDone ?? [];
  return order.map((t) => {
    if (done.includes(t) || cur === null) return { table: t, room: null, state: 'done' as const };
    const i = order.indexOf(t) - order.indexOf(cur);
    return { table: t, room: roomName(locked[i]), state: t === cur ? ('current' as const) : ('later' as const) };
  });
}

export function Home({ onGo, playerName, onSwitchPlayer }: { onGo: (s: Screen) => void; playerName: string; onSwitchPlayer?: () => void }) {
  const { save, update } = useStore();
  const now = Date.now();
  const L = save.learning;
  const table = currentTable(L, save.settings.tables);
  const tp = table !== null ? tableProgress(L, table, save.settings.tables) : null;
  const inLesson = !!L.learnSession;
  const ready = challengeReady(save);
  const canLearn = inLesson || chooseLearnSet(L, save.settings.tables, now).length > 0;
  const play = playStatus(save.playTime);
  const limit = save.playTime.limitMin;
  const map = houseMap(save);
  const opens = map.find((m) => m.state === 'current')?.room ?? null;

  const startLesson = () => {
    if (!inLesson && canLearn) update((s) => (s.learning.learnSession ? s : startLearnSession(s, Date.now())));
    onGo('learn');
  };
  const startChallenge = () => {
    update((s) => startOpening(s));
    onGo('studio');
  };

  return (
    <div className="home" dir="rtl">
      <header className="home-top">
        <div className="home-hello">
          <button className="home-avatar" onClick={onSwitchPlayer} disabled={!onSwitchPlayer} aria-label={`${playerName} · החלפת שחקנית`}>
            {playerName.slice(0, 1)}
          </button>
          <strong>היי {playerName}!</strong>
        </div>
        <div className="home-top-end">
          <span className="coins-pill" aria-label={`${save.coins} מטבעות`}>
            <CoinAmount value={save.coins} />
          </span>
          <button className="icon-round" onClick={() => onGo('parent')} aria-label="להורים (לחיצה ארוכה)" title="להורים">
            <Icon name="lock" size={22} />
          </button>
        </div>
      </header>

      <div className="home-body">
        <section className="home-mission card" aria-labelledby="home-mission-title">
          <span className="home-eyebrow">הבית של לולה</span>
          <h1 id="home-mission-title">
            {table === null ? 'כל הבית פתוח!' : ready ? `כפולת ${table} בזיכרון!` : `כפולת ${table}`}
          </h1>
          {table !== null && (
            <p className="home-sub">
              {ready ? (opens ? `עכשיו אתגר — והחדר "${opens}" נפתח` : 'עכשיו אתגר — והכפולה מושלמת') : opens ? `כשכל כפולת ${table} בזיכרון — נפתח "${opens}"` : `לומדות את כפולת ${table} עד שכולה בזיכרון`}
            </p>
          )}
          {tp && (
            <div className="home-progress" aria-label={`${tp.memorised} מתוך ${tp.total} בזיכרון`}>
              <span className="table-meter" aria-hidden="true">
                <span style={{ width: `${(tp.memorised / tp.total) * 100}%` }} />
              </span>
              <bdi dir="ltr">{tp.memorised}/{tp.total}</bdi>
            </div>
          )}
          <div className="home-actions">
            {ready ? (
              <button className="primary big home-cta" onClick={startChallenge}>
                <Icon name="star" /> {`אתגר כפולת ${table}`}
              </button>
            ) : canLearn ? (
              <button className="primary big home-cta" onClick={startLesson}>
                <Icon name="sparkle" /> {inLesson ? 'ממשיכות את השיעור' : 'מתחילות ללמוד'}
              </button>
            ) : (
              <p className="home-rest">כל התרגילים נחים עכשיו. נחזור לשיעור מחר.</p>
            )}
            <button className="secondary big home-design" onClick={() => onGo('studio')} aria-label={play.limited ? (play.locked ? 'לעצב: הזמן נגמר' : `לעצב: נשארו ${minutesLabel(play.remainingMs)}`) : 'לעצב'}>
              <Icon name="brush" />
              {!play.limited ? 'לעצב' : play.locked ? `שיעור = עוד ${limit} דק׳` : `לעצב · ${minutesLabel(play.remainingMs)}`}
            </button>
          </div>
        </section>

        <aside className="home-house card" aria-label="הבית של לולה: כל כפולה פותחת חדר">
          <ol>
            {map.map((m) => (
              <li key={m.table} className={`house-step ${m.state}`}>
                <span className="house-mark" aria-hidden="true">
                  {m.state === 'done' ? <Icon name="check" size={16} /> : m.state === 'current' ? <Icon name="star" size={16} /> : <Icon name="lock" size={14} />}
                </span>
                <b>×{m.table}</b>
                <span className="house-room">{m.state === 'done' ? 'הושלמה' : m.room ?? (m.table === 10 ? 'מסיבת הבית' : '')}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
