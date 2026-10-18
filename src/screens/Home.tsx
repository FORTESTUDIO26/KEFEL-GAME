// The home screen: one daily loop — learn, get the reward (coins + design time), design, learn again.
// Everything shown comes from the player's real data.
import type { Screen } from '../App';
import { RoomThumbnail } from '../art/WorldRooms';
import { paletteById } from '../content/catalog';
import { chooseLearnSet, currentTable, LEARN_REWARD, tableProgress } from '../learning/learnPath';
import { startLearnSession } from '../state/game';
import { playStatus } from '../state/playTime';
import { useStore } from '../state/store';
import { ROOMS, roomReadiness } from '../state/world';
import { CoinAmount } from '../ui/common';
import { Icon } from '../ui/icons';

export function minutesLabel(ms: number): string {
  const m = Math.ceil(ms / 60_000);
  return m <= 1 ? 'דקה' : `${m} דקות`;
}

export function Home({ onGo, playerName, onSwitchPlayer }: { onGo: (s: Screen) => void; playerName: string; onSwitchPlayer?: () => void }) {
  const { save, update } = useStore();
  const now = Date.now();
  const L = save.learning;
  const table = currentTable(L, save.settings.tables);
  const tp = table !== null ? tableProgress(L, table, save.settings.tables) : null;
  const inLesson = !!L.learnSession;
  const canLearn = inLesson || chooseLearnSet(L, save.settings.tables, now).length > 0;
  const play = playStatus(save.playTime);
  const limit = save.playTime.limitMin;
  const nextRoom = ROOMS.find((r) => !save.world.unlocked.includes(r.id));
  const ready = nextRoom ? roomReadiness(save, nextRoom.id) : null;

  const startLesson = () => {
    if (!inLesson && canLearn) update((s) => (s.learning.learnSession ? s : startLearnSession(s, Date.now())));
    onGo('learn');
  };

  return (
    <div className="home" dir="rtl">
      <header className="home-top">
        <div className="home-hello">
          <span className="home-avatar" aria-hidden="true">{playerName.slice(0, 1)}</span>
          <div>
            <strong>היי {playerName}!</strong>
            <span className="muted small">{save.profile.studioName}</span>
          </div>
        </div>
        <div className="home-top-end">
          <span className="coins-pill" aria-label={`${save.coins} מטבעות`}>
            <CoinAmount value={save.coins} />
          </span>
          {onSwitchPlayer && (
            <button className="ghost home-small" onClick={onSwitchPlayer}>
              מי משחקת?
            </button>
          )}
          <button className="secondary home-small" onClick={() => onGo('parent')} aria-label="להורים (לחיצה ארוכה)">
            <Icon name="lock" size={18} /> להורים
          </button>
        </div>
      </header>

      <div className="home-body">
        <section className="home-mission card" aria-labelledby="home-mission-title">
          <span className="home-eyebrow">המשימה של היום</span>
          <h1 id="home-mission-title">
            {inLesson ? 'יש שיעור שעצרנו באמצע' : table !== null ? `כפולת ${table} — שיעור קצר` : 'חזרה קצרה על מה שכבר בזיכרון'}
          </h1>
          {tp && (
            <div className="home-progress">
              <span className="table-meter" aria-hidden="true">
                <span style={{ width: `${(tp.memorised / tp.total) * 100}%` }} />
              </span>
              <span>
                <bdi dir="ltr">{tp.memorised}/{tp.total}</bdi> בזיכרון
              </span>
            </div>
          )}
          <ol className="home-steps">
            <li className="step-learn">
              <b>1 · לומדות</b>
              <span>שיעור קצר עם עזרה בכל שלב</span>
            </li>
            <li className="step-reward">
              <b>2 · פרס</b>
              <span>
                {LEARN_REWARD} מטבעות{limit > 0 ? ` + ${limit} דקות עיצוב` : ''}
              </span>
            </li>
            <li className="step-design">
              <b>3 · מעצבות</b>
              <span>{limit > 0 ? `${limit} דקות חופשיות בחדר` : 'כמה שרוצים'}</span>
            </li>
          </ol>
          {canLearn ? (
            <button className="primary big home-cta" onClick={startLesson}>
              <Icon name="sparkle" /> {inLesson ? 'ממשיכות את השיעור' : 'מתחילות ללמוד'}
            </button>
          ) : (
            <p className="home-rest">כל העובדות נחות עכשיו — הן צריכות הפסקה לפני שחוזרים עליהן. נחזור לשיעור מחר.</p>
          )}
        </section>

        <aside className="home-side">
          <button className="home-card home-design" onClick={() => onGo('studio')}>
            <span className="home-eyebrow">לעצב את החדר</span>
            {!play.limited ? (
              <strong>זמן עיצוב חופשי</strong>
            ) : play.locked ? (
              <>
                <strong>זמן העיצוב נגמר</strong>
                <span className="muted small">שיעור אחד מוסיף עוד {limit} דקות</span>
              </>
            ) : (
              <>
                <strong>נשארו {minutesLabel(play.remainingMs)}</strong>
                <span className="muted small">העיצוב שמור בדיוק איפה שעצרת</span>
              </>
            )}
          </button>
          {nextRoom && ready && (
            <div className="home-card home-next">
              <span className="home-eyebrow">מה נפתח הבא</span>
              <strong>{nextRoom.name}</strong>
              <span className="muted small">
                {ready.ready ? 'אפשר לנסות את אתגר הפתיחה בחדרים' : `עוד ${ready.needed - ready.learned} ${ready.needed - ready.learned === 1 ? 'עובדה' : 'עובדות'} שנזכרות לבד`}
              </span>
              <span className="home-room-thumb" aria-hidden="true">
                <RoomThumbnail id={nextRoom.id} p={paletteById(save.profile.paletteId)} />
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
