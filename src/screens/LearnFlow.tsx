// "לומדות וזוכרות": see the facts with their answers, say them aloud, practise with the answer
// visible, do a little design, then try to remember. Help is always one tap away and never punished.

import { useEffect, useMemo, useRef, useState } from 'react';
import { MissionCelebration } from '../ui/MissionCelebration';
import type { GiftRecord } from '../state/types';
import { DogFigure } from '../art/Dog';
import { SLOT_LABEL, WEARABLES } from '../content/catalog';
import { dogById, gx } from '../content/dogs';
import type { Screen } from '../App';
import { getStats, wouldCountAlone } from '../learning/data';
import { factKey, parseKey } from '../learning/facts';
import { buildHints, workedWay } from '../learning/hints';
import {
  afterLearnAnswer,
  chooseLearnSet,
  factsToTeach,
  lastResultStruggling,
  needsDayCheck,
  currentTable,
  nextActiveIndex,
  sayAloud,
  tableProgress,
  sessionGoal,
  type LearnSession,
  type LearnStep,
} from '../learning/learnPath';
import { dayKey } from '../learning/scheduler';
import { isKnown, type Outcome } from '../learning/scheduler';
import { addPhoto, completeLearnSession, lookToOutfit, recordAnswer, saveLearnSession, setOwnOutfit, startLearnSession } from '../state/game';
import { useStore } from '../state/store';
import type { SaveData } from '../state/types';
import { ArrayPicture, CoinAmount, Eq, Keypad, RichText } from '../ui/common';
import { Icon } from '../ui/icons';
import { sfx } from '../ui/sound';
import { useToast } from '../ui/toast';
import { MathCoach } from '../ui/MathCoach';
import { SpeakButton } from '../ui/SpeakButton';
import { learningDesignOptions } from '../learning/designOptions';
import type { DesignSlot } from '../learning/learnPath';

const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

function useHints(save: SaveData, a: number, b: number) {
  return useMemo(
    () => buildHints(a, b, (x, y) => x >= 1 && y >= 1 && x <= 10 && y <= 10 && isKnown(getStats(save.learning, factKey(x, y)))),
    // the hint is fixed for the question
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, b]
  );
}

interface Finished {
  gift:GiftRecord|null;
  coins: number;
  facts: number;
  alone: number;
  afterHelp: number;
  helped: number;
  look: LearnSession['look'];
  milestone: { days: number; coins: number } | null;
  photographed: boolean;
  /** design minutes this lesson added (0 when the limit is off or the lesson was already counted) */
  minutes: number;
}

export function LearnFlow({ onGo }: { onGo: (s: Screen) => void }) {
  const { save, update } = useStore();
  const notify = useToast();
  const session = save.learning.learnSession;
  const [finished, setFinished] = useState<Finished | null>(null);
  const dog = dogById(save.profile.ownDogId);

  const setSession = (s: LearnSession) => update((sv) => saveLearnSession(sv, s));
  const answeredHere = useRef<string | null>(null);

  /** Move on; reaching the last step completes the session (coins for taking part). */
  const advance = (s: LearnSession) => {
    const next = { ...s, index: nextActiveIndex(s, s.index + 1, save.learning) };
    if (next.steps[next.index]?.type === 'finish' || next.index >= next.steps.length) {
      const now = Date.now();
      const res = completeLearnSession(save, next, now);
      update((sv) => completeLearnSession(sv, next, now).save);
      sfx.done();
      const minutes = Math.max(0, Math.round((save.playTime.usedMs - res.save.playTime.usedMs) / 60_000));
      setFinished({ gift:res.gift,coins: res.coins, facts: next.keys.length, alone: next.alone, afterHelp: next.afterHelp, helped: next.helped, look: next.look, milestone: res.milestone, photographed: false, minutes });
      return;
    }
    setSession(next);
  };

  if (finished) {
    const outfit = lookToOutfit(finished.look);
    return (
      <div className="learn">
        <div className="card reward stack center lesson-done">
          <div className="reward-dog">
            <DogFigure dog={dog} outfit={outfit} />
          </div>
          <h1>כל הכבוד, סיימנו שיעור!</h1>
          <div className="reward-chips">
            <span className="reward-chip coins"><CoinAmount value={finished.coins} /> מטבעות</span>
            {finished.minutes > 0 && <span className="reward-chip time"><Icon name="brush" size={18} /> עוד {finished.minutes} דקות עיצוב</span>}
          </div>
          <div className="row wrap center lesson-done-cta">
            <button className="primary big" onClick={() => onGo('studio')}>
              <Icon name="brush" /> לעצב את החדר
            </button>
            <button
              className="secondary big"
              onClick={() => {
                setFinished(null);
                update((s) => (s.learning.learnSession ? s : startLearnSession(s, Date.now())));
              }}
            >
              <Icon name="sparkle" /> עוד שיעור
            </button>
          </div>
          <p>
            תרגלת <bdi dir="ltr">{finished.facts}</bdi> עובדות כפל. {finished.alone > 0 && <>נזכרת לבד ב־<bdi dir="ltr">{finished.alone}</bdi> תשובות. </>}
            {finished.afterHelp > 0 && <>ענית נכון אחרי עזרה ב־<bdi dir="ltr">{finished.afterHelp}</bdi> תשובות. </>}
            {finished.helped > 0 && <>וכשהיה צריך — ביקשת עזרה, וזה בדיוק מה שעוזר לזכור.</>}
          </p>
          <ul className="reward-list">
            {finished.milestone && (
              <li className="milestone">
                בונוס התמדה: תרגלת ב־{finished.milestone.days} ימים שונים! <CoinAmount value={finished.milestone.coins} />
              </li>
            )}
          </ul>
          <MissionCelebration gift={finished.gift}/>{save.birthday.active&&save.birthday.stage==='party'&&<button className="primary" onClick={()=>onGo('studio')}>בחזרה ליום ההולדת של לולה</button>}
          <p className="muted small">עובדה שנזכרת לבד היום תיבדק שוב מחר — ככה בודקים שהיא באמת נשארת בזיכרון. עובדות חדשות מצטרפות בהדרגה.</p>
          <div className="row wrap center">
            {Object.keys(outfit).length > 0 && (
              <button
                className="primary"
                onClick={() => {
                  update((s) => setOwnOutfit(s, dog.id, { ...s.outfits[dog.id], ...outfit }));
                  notify(gx(`${dog.name} {לבוש|לבושה} בלוק החדש!`, dog.female));
                }}
              >
                <Icon name="hanger" /> להלביש את {dog.name} בלוק
              </button>
            )}
            <button
              className="secondary"
              disabled={finished.photographed}
              onClick={() => {
                const now = Date.now();
                update((s) => addPhoto(s, { dogId: dog.id, outfit, backdrop: 'studio', title: `הלוק מהשיעור של ${dog.name}`, request: null, directionId: null, stars: 0 }, now, false).save);
                setFinished({ ...finished, photographed: true });
                sfx.camera();
                notify('התמונה נשמרה באלבום');
              }}
            >
              <Icon name="camera" /> {finished.photographed ? 'צולם!' : 'לצלם לאלבום'}
            </button>
            <button className="ghost" onClick={() => onGo('home')}>
              <Icon name="home" /> למסך הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return <LearnIntro onStart={() => update((s) => startLearnSession(s, Date.now()))} onBack={() => onGo('home')} />;

  const step = session.steps[session.index];
  const look = lookToOutfit(session.look);
  // Resumed right after answering (before pressing הבא): move past that question instead of asking again.
  const resumedOnAnswered = step?.type === 'recall' && session.answeredStepId === step.id && answeredHere.current !== step.id;
  const total = session.steps.length - 1;

  return (
    <div className="learn">
      <div className="learn-top">
        <div className="client-mini" aria-hidden="true">
          <DogFigure dog={dog} outfit={look} />
        </div>
        <div className="grow stack-sm">
          <div className="row between">
            <strong>לומדות וזוכרות</strong>
            <button className="ghost small" onClick={() => onGo('home')}>
              לעצור ולשמור
            </button>
          </div>
          <GoalStrip session={session} />
          <div className="sew-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={session.index} aria-label="התקדמות בשיעור">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`stitch ${i < session.index ? 'done' : i === session.index ? 'now' : ''}`} />
            ))}
          </div>
        </div>
      </div>
      {step?.type === 'study' && <StudyCard key={step.id} step={step} session={session} onDone={() => advance(session)} />}
      {step?.type === 'design' && (
        <DesignCard
          key={step.id}
          step={step}
          session={session}
          onPick={(itemId) => {
            sfx.tap();
            const picked=WEARABLES.find(w=>w.id===itemId);
            advance(picked?{ ...session, look: { ...session.look, [picked.slot as DesignSlot]: picked.id } }:session);
          }}
        />
      )}
      {resumedOnAnswered && <ResumeSkip onSkip={() => advance(session)} />}
      {step?.type === 'recall' && !resumedOnAnswered && (
        <RecallCard
          key={step.id}
          step={step}
          extraSupport={session.extraSupport}
          onAnswer={(outcome, afterHelp) => {
            answeredHere.current = step.id;
            update((s) => recordAnswer(s, { a: step.a, b: step.b, outcome, usedHint: outcome === 'hinted' }, Date.now()));
            setSession(afterLearnAnswer(session, session.index, outcome, afterHelp));
          }}
          onNext={() => advance(save.learning.learnSession ?? session)}
        />
      )}
    </div>
  );
}

/** Today's goal: remember each fact alone once. Shown as chips that fill in. */
function GoalStrip({ session }: { session: LearnSession }) {
  const goal = sessionGoal(session);
  const done = goal.filter((g) => g.done).length;
  return (
    <div className="learn-goal" aria-label={`המטרה: להיזכר לבד ב־${goal.length} עובדות. נזכרת לבד ב־${done}`}>
      <span className="learn-goal-text">
        המטרה: להיזכר לבד · <bdi dir="ltr">{done}/{goal.length}</bdi>
      </span>
      <span className="fact-chips small" dir="ltr">
        {goal.map((g) => {
          const [a, b] = parseKey(g.key);
          return (
            <span key={g.key} className={`fact-chip ${g.done ? 'done' : ''}`}>
              {a}×{b}
              {g.done && <span aria-hidden="true"> ✓</span>}
            </span>
          );
        })}
      </span>
    </div>
  );
}

function ResumeSkip({ onSkip }: { onSkip: () => void }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    onSkip();
    // run once when shown
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function LearnIntro({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const { save } = useStore();
  const now = Date.now();
  const keys = chooseLearnSet(save.learning, save.settings.tables, now);
  const newOnes = keys.filter((k) => getStats(save.learning, k).attempts === 0).length;
  const first = keys.length > 0 && newOnes === keys.length;
  const struggling = lastResultStruggling(save.learning);
  const table = currentTable(save.learning, save.settings.tables);
  const tp = table !== null ? tableProgress(save.learning, table, save.settings.tables) : null;
  const today = dayKey(now);
  const checkCount = keys.filter((k) => needsDayCheck(getStats(save.learning, k), today)).length;
  return (
    <div className="learn">
      <div className="card stack learn-intro">
        <p className="eyebrow">לומדות וזוכרות</p>
        {tp && table !== null && (
          <div className="table-goal" role="status">
            <strong>כפולת {table}</strong>
            <span className="table-meter" aria-hidden="true"><span style={{ width: `${(tp.memorised / tp.total) * 100}%` }} /></span>
            <span>
              <bdi dir="ltr">{tp.memorised}/{tp.total}</bdi> בזיכרון — כשכל הכפולה בזיכרון, עוברות לכפולה הבאה
            </span>
          </div>
        )}
        {table === null && <p className="table-goal">כל הכפולות שנבחרו כבר בזיכרון! עכשיו רק חוזרות כדי שיישארו.</p>}
        {keys.length === 0 ? (
          <>
            <h1>כל העובדות נחות עכשיו</h1>
            <p>נזכרת לבד בכל מה שלמדנו עד עכשיו. עובדות שנזכרות לבד צריכות הפסקה לפני שחוזרים עליהן — זה מה שבונה זיכרון.</p>
            <p className="muted small">אפשר לשחק עם לקוחות בסטודיו, ולחזור לשיעור מחר.</p>
            <button className="primary big" onClick={onBack}>
              <Icon name="home" /> לסטודיו
            </button>
          </>
        ) : (
          <>
        <h1>{keys.length === 6 ? 'שש עובדות כפל להיום' : `${keys.length} עובדות כפל להיום`}</h1>
        <div className="fact-chips" dir="ltr">
          {keys.map((k) => {
            const [a, b] = parseKey(k);
            return (
              <span key={k} className="fact-chip">
                {a} × {b}
              </span>
            );
          })}
        </div>
        {first ? (
          <p>מתחילות! נלמד אותן בזוגות — לאט, עם הרבה עזרה.</p>
        ) : struggling ? (
          <p>נמשיך לחזק את מה שכבר התחלנו, והפעם עם עוד קצת עזרה בכל שלב.</p>
        ) : newOnes > 0 ? (
          <p>{newOnes === 1 ? 'יש כאן עובדה חדשה אחת' : `יש כאן ${newOnes} עובדות חדשות`} — נראה אותן קודם עם התשובה.</p>
        ) : (
          <p>חוזרות על עובדות שהתחלנו — ככה הן נשארות בזיכרון.</p>
        )}
        <ol className="how-list">
          {checkCount > 0 && <li>קודם בדיקת זיכרון קטנה: מה נשאר מפעם קודמת? (״עוד לא זוכרת״ זמין תמיד)</li>}
          <li>רואים את התרגיל ואת התשובה ואומרים אותם בקול.</li>
          <li>מתרגלים כשהתשובה גלויה.</li>
          <li>רגע של עיצוב לכלב הסטודיו.</li>
          <li>מנסים לזכור. לא זוכרת? לוחצים ״עוד לא זוכרת״ ורואים שוב.</li>
          <li>בסוף — עוד ניסיון אחד לכל עובדה, אחרי הפסקה קטנה.</li>
        </ol>
        <p className="muted small">אפשר לעצור בכל רגע — נשמור בדיוק איפה עצרנו.</p>
        <button className="primary big" onClick={onStart}>
          <Icon name="sparkle" /> מתחילות
        </button>
          </>
        )}
      </div>
    </div>
  );
}

function FactLine({ a, b, reveal = true }: { a: number; b: number; reveal?: boolean }) {
  return (
    <Eq className="study-eq">
      {a} × {b} = {reveal ? <span className="study-ans">{a * b}</span> : '?'}
    </Eq>
  );
}

function StudyCard({ step, session, onDone }: { step: Extract<LearnStep, { type: 'study' }>; session: LearnSession; onDone: () => void }) {
  const { save, update } = useStore();
  const [phase, setPhase] = useState<'see' | 'practice' | 'ready'>('see');
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [value, setValue] = useState('');
  const [showWay, setShowWay] = useState(session.extraSupport);
  const facts = factsToTeach(session, step).map((k) => parseKey(k));
  const inputRef = useRef<HTMLInputElement>(null);
  const hintsPerFact = facts.map(([a, b]) => buildHints(a, b, (x, y) => x >= 1 && y >= 1 && x <= 10 && y <= 10 && isKnown(getStats(save.learning, factKey(x, y)))));

  useEffect(() => {
    if (phase === 'practice') inputRef.current?.focus({ preventScroll: true });
  }, [phase, practiceIdx]);

  const [pa, pb] = facts[Math.min(practiceIdx, facts.length - 1)];
  const checkPractice = () => {
    if (parseInt(value, 10) !== pa * pb) {
      setValue('');
      return;
    }
    sfx.correct();
    // practising with the answer in view: taking part, not remembering
    update((s) => recordAnswer(s, { a: pa, b: pb, outcome: 'supported', usedHint: false, exposureOnly: true }, Date.now()));
    setValue('');
    if (practiceIdx + 1 >= facts.length) setPhase('ready');
    else setPracticeIdx(practiceIdx + 1);
  };

  return (
    <div className="card learn-card stack">
      {phase === 'see' && (
        <>
          <h2>{facts.length > 1 ? 'שתי עובדות חדשות לזכור' : 'עובדה לזכור'}</h2>
          {facts.map(([a, b], i) => (
            <div key={i} className="study-fact">
              <FactLine a={a} b={b} />
              {a !== b && (
                <p className="muted small">
                  זו אותה עובדה גם הפוך: <Eq>{`${b} × ${a} = ${a * b}`}</Eq>
                </p>
              )}
              <p className="say-aloud">
                <Icon name="sound" /> אמרי בקול: <strong>{sayAloud(a, b)}</strong> <SpeakButton text={sayAloud(a, b)} />
              </p>
              {showWay && (
                <MathCoach text={workedWay(hintsPerFact[i], a * b)}/>
              )}
            </div>
          ))}
          {!showWay && (
            <button className="hint-btn" onClick={() => setShowWay(true)}>
              <Icon name="bulb" /> איך אפשר לחשב?
            </button>
          )}
          <button className="primary big" onClick={() => setPhase('practice')}>
            אמרתי בקול <Icon name="check" />
          </button>
        </>
      )}
      {phase === 'practice' && (
        <>
          <h2>תרגול עם התשובה מול העיניים</h2>
          <p className="muted">העתיקי את התשובה — זה עוזר לזכור.</p>
          <div className="equation">
            <Eq className="big-eq">
              {pa} × {pb} ={' '}
              <input
                ref={inputRef}
                className="answer-box"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 3))}
                onKeyDown={(e) => e.key === 'Enter' && checkPractice()}
                inputMode={coarse ? 'none' : 'numeric'}
                aria-label="התשובה"
                placeholder="?"
                autoComplete="off"
              />
            </Eq>
          </div>
          <p className="visible-answer">
            התשובה: <Eq>{pa * pb}</Eq>
          </p>
          <div className="answer-area">
            <Keypad onDigit={(d) => setValue((v) => (v + d).slice(0, 3))} onBack={() => setValue((v) => v.slice(0, -1))} onEnter={checkPractice} />
            <div className="answer-actions">
              <button className="primary big" onClick={checkPractice} disabled={!value}>
                בדיקה
              </button>
            </div>
          </div>
        </>
      )}
      {phase === 'ready' && (
        <>
          <h2>מעולה!</h2>
          {facts.map(([a, b], i) => (
            <FactLine key={i} a={a} b={b} />
          ))}
          <p>כשתלחצי, התשובות יוסתרו. קודם רגע של עיצוב — ואז ננסה לזכור.</p>
          <div className="row wrap">
            <button className="primary big grow" onClick={onDone}>
              אני מוכנה לנסות לזכור
            </button>
            <button
              className="ghost"
              onClick={() => {
                setPracticeIdx(0);
                setPhase('practice');
              }}
            >
              עוד תרגול עם התשובה
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DesignCard({ step, session, onPick }: { step: Extract<LearnStep, { type: 'design' }>; session: LearnSession; onPick: (itemId: string|null) => void }) {
  const { save } = useStore();
  const dog = dogById(save.profile.ownDogId);
  // three owned options for this slot, stable for the step
  const options = useMemo(() => {
    return learningDesignOptions(step.slot,save.owned.wearables,step.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id,step.slot,save.owned.wearables]);
  const look = lookToOutfit(session.look);
  return (
    <div className="card learn-card stack">
      <h2>
        רגע של עיצוב: מה {dog.name} {gx('{ילבש|תלבש}', dog.female)} {options.every(w=>w.slot===step.slot)?`(${SLOT_LABEL[step.slot]})`:'מהפריטים שלך'}?
      </h2>
      <div className="design-options">
        {options.map((w) => (
          <button key={w.id} className="item-card" onClick={() => onPick(w.id)}>
            <DogFigure dog={dog} outfit={{ ...look, [w.slot]: { itemId: w.id, color: w.color } }} />
            <span className="item-name">{w.name}</span>
          </button>
        ))}
      </div>
      <button className="secondary" onClick={()=>onPick(null)}>להמשיך עם הלוק הזה</button>
    </div>
  );
}

type RecallStatus = 'ask' | 'right' | 'reveal' | 'copied' | 'checkHelp';

function RecallCard({
  step,
  extraSupport,
  onAnswer,
  onNext,
}: {
  step: Extract<LearnStep, { type: 'recall' }>;
  extraSupport: boolean;
  onAnswer: (o: Outcome, afterHelp: boolean) => void;
  onNext: () => void;
}) {
  const { save } = useStore();
  // Had she already seen this answer or had help with it today? Then a right answer is "after help".
  const [afterHelp] = useState(() => !wouldCountAlone(save.learning, step.key, Date.now()));
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<RecallStatus>('ask');
  const [usedCalc, setUsedCalc] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [lastWrong, setLastWrong] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const answer = step.a * step.b;
  const hints = useHints(save, step.a, step.b);

  useEffect(() => {
    if (status === 'ask' || status === 'reveal') inputRef.current?.focus({ preventScroll: true });
    else nextRef.current?.focus({ preventScroll: true });
  }, [status]);

  const notYet = () => {
    onAnswer('supported', afterHelp);
    setOutcome('supported');
    setValue('');
    // In the day check, the supported learning for this fact follows in a moment.
    setStatus(step.check ? 'checkHelp' : 'reveal');
    sfx.gentle();
  };

  const submit = () => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return;
    if (status === 'reveal') {
      // copying the shown answer: practice only, nothing more is recorded
      if (n === answer) {
        setStatus('copied');
        sfx.correct();
      } else setValue('');
      return;
    }
    if (n === answer) {
      const o: Outcome = usedCalc ? 'hinted' : 'independent';
      onAnswer(o, afterHelp);
      setOutcome(o);
      setStatus('right');
      sfx.correct();
    } else {
      onAnswer('wrong', afterHelp);
      setOutcome('wrong');
      setLastWrong(value);
      setValue('');
      setStatus(step.check ? 'checkHelp' : 'reveal');
      sfx.gentle();
    }
  };

  const typing = status === 'ask' || status === 'reveal';
  return (
    <div className="card learn-card question stack">
      {step.check ? (
        <p className="check-note">
          <Icon name="sparkle" size={18} /> בדיקת זיכרון קטנה מפעם קודמת — לפני שנראה את התשובה. לא זוכרת? זה בסדר גמור, לוחצים ״עוד לא זוכרת״.
        </p>
      ) : (
        <p className="muted center">{step.retry ? 'עוד פעם, אחרי קצת עיצוב:' : 'נסי להיזכר:'}</p>
      )}
      <div className="equation">
        <Eq className="big-eq">
          {step.a} × {step.b} ={' '}
          <input
            ref={inputRef}
            className={`answer-box ${status === 'right' || status === 'copied' ? 'ok' : ''}`}
            value={typing ? value : String(answer)}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            inputMode={coarse ? 'none' : 'numeric'}
            readOnly={!typing}
            aria-label="התשובה שלך"
            placeholder="?"
            autoComplete="off"
          />
        </Eq>
      </div>

      {status === 'ask' && usedCalc && (
        <div className="hint-box" role="note">
          <div className="hint-head">
            <Icon name="bulb" /> דרך לחשב
          </div>
          <MathCoach text={hints[0].text}/>
          {hints[0].visual && <ArrayPicture v={hints[0].visual} />}
        </div>
      )}

      {status === 'checkHelp' && (
        <div className="feedback soft" role="status">
          {outcome === 'wrong' ? (
            <p>
              <Eq>{lastWrong}</Eq> זו לא התשובה. זה בסדר — בשביל זה לומדים:
            </p>
          ) : (
            <p>בסדר גמור! הנה התרגיל עם התשובה:</p>
          )}
          <p className="reveal-line">
            <FactLine a={step.a} b={step.b} />
          </p>
          <p className="strong">עוד רגע נלמד אותו יחד: נגיד בקול, נתרגל, ונחזור אליו אחרי עיצוב.</p>
        </div>
      )}

      {(status === 'reveal' || status === 'copied') && (
        <div className="feedback soft" role="status">
          {outcome === 'wrong' ? (
            <p>
              <Eq>{lastWrong}</Eq> זו לא התשובה — הנה היא:
            </p>
          ) : (
            <p>בסדר גמור! הנה התשובה:</p>
          )}
          <p className="reveal-line">
            <FactLine a={step.a} b={step.b} />
          </p>
          <p className="say-aloud">
            <Icon name="sound" /> אמרי בקול: <strong>{sayAloud(step.a, step.b)}</strong> <SpeakButton text={sayAloud(step.a, step.b)} />
          </p>
          <p className="way">
            <Icon name="bulb" /> דרך לחשב: <RichText text={workedWay(hints, answer)} />
          </p>
          {status === 'reveal' && <p className="strong">העתיקי את התשובה, ונחזור לתרגיל הזה בהמשך.</p>}
        </div>
      )}

      {status === 'right' && (
        <div className="feedback good" role="status">
          {outcome === 'independent' && !afterHelp ? (
            <p>
              <strong>{step.check ? 'זכרת מפעם קודמת — לבד!' : 'זכרת לבד!'}</strong> <Eq>{`${step.a} × ${step.b} = ${answer}`}</Eq>
            </p>
          ) : outcome === 'independent' ? (
            <p>
              <strong>{step.retry ? 'יופי, הפעם זה נכון!' : 'נכון!'}</strong> <Eq>{`${step.a} × ${step.b} = ${answer}`}</Eq> — ענית אחרי שלמדנו. בפעם הבאה ננסה
              שוב לפני שנראה את התשובה.
            </p>
          ) : (
            <p>
              <strong>פתרת בעזרת חישוב!</strong> נחזור לתרגיל הזה, עד שהוא ייזכר לבד.
            </p>
          )}
        </div>
      )}
      {status === 'copied' && (
        <div className="feedback good" role="status">
          <p>
            <strong>נהדר.</strong> נחזור לזה אחרי עוד קצת עיצוב.
          </p>
        </div>
      )}

      {typing ? (
        <div className="answer-area">
          <Keypad onDigit={(d) => setValue((v) => (v + d).replace(/^0+(?=\d)/, '').slice(0, 3))} onBack={() => setValue((v) => v.slice(0, -1))} onEnter={submit} />
          <div className="answer-actions">
            <button className="primary big" onClick={submit} disabled={!value}>
              {status === 'reveal' ? 'העתקתי' : 'בדיקה'}
            </button>
            {status === 'ask' && (
              <>
                <button className="not-yet-btn" onClick={notYet}>
                  עוד לא זוכרת
                </button>
                {!usedCalc && (
                  <button className={`hint-btn ${extraSupport ? 'emph' : ''}`} onClick={() => setUsedCalc(true)}>
                    <Icon name="bulb" /> תני לי רמז
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="row center">
          <button ref={nextRef} className="primary big" onClick={onNext}>
            הבא <Icon name="arrowL" />
          </button>
        </div>
      )}
    </div>
  );
}

