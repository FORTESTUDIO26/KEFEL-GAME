// Design / learning balance: counts active design time, shows a gentle note 2 minutes before the
// stop, and after the limit asks for a short "לומדות וזוכרות" session. Exiting, saving and the parent
// area always stay available. The design itself is saved continuously, so nothing is lost.
import { useEffect, useRef } from 'react';
import type { Screen } from '../App';
import { chooseLearnSet } from '../learning/learnPath';
import { startLearnSession } from '../state/game';
import { grantPlay, markWarned, playStatus, tickPlay } from '../state/playTime';
import { useStore } from '../state/store';
import { Icon } from './icons';

const TICK_MS = 5000;
/** screens that count as design and free room play */
const DESIGN_SCREENS: Screen[] = ['studio', 'wardrobe'];

export function usePlayClock(screen: Screen) {
  const { update } = useStore();
  const lastInput = useRef(Date.now());
  const lastTick = useRef(performance.now());
  const screenRef = useRef(screen);
  screenRef.current = screen;

  useEffect(() => {
    const mark = () => {
      lastInput.current = Date.now();
    };
    const opts = { passive: true, capture: true } as const;
    window.addEventListener('pointerdown', mark, opts);
    window.addEventListener('keydown', mark, opts);
    window.addEventListener('wheel', mark, opts);
    const onVisible = () => {
      // never count the time the page was hidden
      lastTick.current = performance.now();
    };
    document.addEventListener('visibilitychange', onVisible);
    const t = window.setInterval(() => {
      const nowPerf = performance.now();
      const elapsed = nowPerf - lastTick.current;
      lastTick.current = nowPerf;
      const ctx = {
        visible: document.visibilityState === 'visible',
        designing: DESIGN_SCREENS.includes(screenRef.current),
        idleMs: Date.now() - lastInput.current,
      };
      if (!ctx.visible || !ctx.designing) return;
      update((s) => tickPlay(s, elapsed, ctx));
    }, TICK_MS);
    return () => {
      window.removeEventListener('pointerdown', mark, opts);
      window.removeEventListener('keydown', mark, opts);
      window.removeEventListener('wheel', mark, opts);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(t);
    };
  }, [update]);
}

export function PlayBalance({ screen, onGo }: { screen: Screen; onGo: (s: Screen) => void }) {
  const { save, update } = useStore();
  const st = playStatus(save.playTime);
  if (!DESIGN_SCREENS.includes(screen) || !st.limited) return null;

  if (st.locked) {
    // The room is saved continuously; this layer stops editing until a lesson adds more time.
    const inLesson = !!save.learning.learnSession;
    const canLearn = inLesson || chooseLearnSet(save.learning, save.settings.tables).length > 0;
    const limit = save.playTime.limitMin;
    return (
      <div className="play-lock" role="dialog" aria-modal="true" aria-labelledby="play-lock-title">
        <div className="card stack center play-lock-card">
          <h2 id="play-lock-title">איזה חדר יפה! העיצוב נשמר.</h2>
          <p className="muted">נגמר זמן העיצוב. שיעור קצר אחד (גם עם רמזים ועזרה) מוסיף עוד {limit} דקות, ואז חוזרות בדיוק לאותו חדר.</p>
          {canLearn ? (
            <button
              className="primary big play-lock-cta"
              onClick={() => {
                if (!inLesson) update((s) => (s.learning.learnSession ? s : startLearnSession(s, Date.now())));
                onGo('learn');
              }}
            >
              <Icon name="sparkle" /> {limit === 10 ? 'לומדות ומקבלות עוד 10 דקות' : `לומדות ומקבלות עוד ${limit} דקות`}
            </button>
          ) : (
            <button className="primary big play-lock-cta" onClick={() => update(grantPlay)}>
              <Icon name="sparkle" /> כל העובדות נחות עכשיו — ממשיכות לעצב
            </button>
          )}
          <div className="row wrap center">
            <button className="secondary" onClick={() => onGo('home')}>
              <Icon name="home" /> למסך הבית
            </button>
            <button className="ghost" onClick={() => onGo('parent')}>
              להורים
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (st.warn && !save.playTime.warned) {
    const min = Math.max(1, Math.round(st.remainingMs / 60_000));
    return (
      <div className="play-warn" role="status">
        <span>
          {min === 1 ? 'עוד כדקה' : <>עוד כ־<bdi dir="ltr">{min}</bdi> דקות</>} של עיצוב, ואז הפסקה קצרה ללומדות וזוכרות.
        </span>
        <button className="ghost small" onClick={() => update(markWarned)}>
          הבנתי
        </button>
      </div>
    );
  }
  return null;
}
