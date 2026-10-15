import { useEffect, useMemo, useRef, useState } from 'react';
import { DogFigure } from '../art/Dog';
import { gx, type DogDef } from '../content/dogs';
import { sayAloud } from '../learning/learnPath';
import { getStats, wouldCountAlone } from '../learning/data';
import { factKey, type FactKey } from '../learning/facts';
import { buildHints, buildMissingHints, workedWay, type Hint } from '../learning/hints';
import { isKnown, type Outcome } from '../learning/scheduler';
import { answerFor, type MatchStep, type QuestionStep, type Round } from '../learning/session';
import { useStore } from '../state/store';
import type { Outfit } from '../state/types';
import { ArrayPicture, Eq, Keypad, RichText } from '../ui/common';
import { Coin, Icon } from '../ui/icons';
import { sfx } from '../ui/sound';
import { MathCoach } from '../ui/MathCoach';

const CHEERS = ['איזה כיף, אני כבר רואה את הלוק!', 'עוד קצת ונתחיל להתלבש!', 'החוטים כבר מוכנים!', 'אני כל כך {מתרגש|מתרגשת} מהבגד החדש!'];

interface Props {
  round: Round;
  index: number;
  dog: DogDef;
  outfit: Outfit;
  onAnswer: (index: number, outcome: Outcome, usedHint: boolean) => void;
  onMatchDone: (index: number, keys: FactKey[]) => void;
  onNext: () => void;
}

export function Practice({ round, index, dog, outfit, onAnswer, onMatchDone, onNext }: Props) {
  const step = round.steps[index];
  const total = round.steps.length;
  const modeLabel = round.mode === 'free' ? 'תרגול חופשי' : 'תפירת הלוק';

  return (
    <div className="practice">
      <div className="practice-top">
        <div className="client-mini" aria-hidden="true">
          <DogFigure dog={dog} outfit={outfit} />
        </div>
        <div className="grow stack-sm">
          <div className="row between">
            <strong>{modeLabel}</strong>
            <span className="muted small">
              <bdi dir="ltr">
                {Math.min(index + 1, total)}/{total}
              </bdi>
            </span>
          </div>
          <div className="sew-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index} aria-label="התקדמות במקבץ">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`stitch ${i < index ? 'done' : i === index ? 'now' : ''}`} />
            ))}
          </div>
          <p className="speech small">
            {dog.name}: {gx(CHEERS[index % CHEERS.length], dog.female)}
          </p>
        </div>
      </div>
      {step?.type === 'question' && <QuestionCard key={step.id} step={step} index={index} onAnswer={onAnswer} onNext={onNext} />}
      {step?.type === 'match' && <MatchGame key={step.id} step={step} onDone={() => onMatchDone(index, step.pairs.map((p) => p.key))} />}
    </div>
  );
}

type Status = 'ask' | 'right' | 'wrongGuide' | 'guidedRight';

const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

function QuestionCard({ step, index, onAnswer, onNext }: { step: QuestionStep; index: number; onAnswer: Props['onAnswer']; onNext: () => void }) {
  const { save } = useStore();
  const [value, setValue] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [status, setStatus] = useState<Status>('ask');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [lastWrong, setLastWrong] = useState<string>('');
  const [guideMisses, setGuideMisses] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const answer = answerFor(step);
  // Already saw this answer or had help with it today? Then a right answer counts as "after help".
  const [afterHelp] = useState(() => !wouldCountAlone(save.learning, step.key, Date.now()));

  // Hints are built once per question from what the game knows she remembers.
  const hints: Hint[] = useMemo(
    () =>
      step.form === 'missing'
        ? buildMissingHints(step.a, step.b)
        : buildHints(step.a, step.b, (x, y) => x >= 1 && y >= 1 && x <= 10 && y <= 10 && isKnown(getStats(save.learning, factKey(x, y)))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step.id]
  );

  useEffect(() => {
    if (status === 'ask' || status === 'wrongGuide') inputRef.current?.focus({ preventScroll: true });
    else nextRef.current?.focus({ preventScroll: true });
  }, [status]);

  const submit = () => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return;
    const correct = n === answer;
    if (status === 'ask' && step.form === 'study') {
      // copying a new fact from the card: taking part, not remembering
      if (!correct) {
        setValue('');
        return;
      }
      setOutcome('supported');
      onAnswer(index, 'supported', false);
      setStatus('guidedRight');
      sfx.correct();
      return;
    }
    if (status === 'ask') {
      if (correct) {
        const o: Outcome = hintLevel > 0 ? 'hinted' : 'independent';
        setOutcome(o);
        onAnswer(index, o, hintLevel > 0);
        setStatus('right');
        sfx.correct();
      } else {
        setOutcome('wrong');
        onAnswer(index, 'wrong', hintLevel > 0);
        setLastWrong(value);
        setValue('');
        setStatus('wrongGuide');
        sfx.gentle();
      }
    } else if (status === 'wrongGuide') {
      if (correct) {
        setStatus('guidedRight');
        sfx.correct();
      } else {
        setGuideMisses((m) => m + 1);
        setValue('');
        sfx.gentle();
      }
    }
  };

  /** "עוד לא זוכרת": show the answer and a way to work it out — no guessing, no penalty. */
  const notYet = () => {
    setOutcome('supported');
    onAnswer(index, 'supported', false);
    setLastWrong('');
    setValue('');
    setStatus('wrongGuide');
    sfx.gentle();
  };

  const typing = status === 'ask' || status === 'wrongGuide';
  const setDigit = (d: string) => setValue((v) => (v.length >= 3 ? v : (v + d).replace(/^0+(?=\d)/, '')));

  const box = (
    <input
      ref={inputRef}
      className={`answer-box ${status === 'right' || status === 'guidedRight' ? 'ok' : ''}`}
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
  );

  const solution = hints[2];

  return (
    <div className="question card">
      <div className="equation" aria-live="polite">
        {step.form === 'missing' ? (
          <Eq className="big-eq">
            {step.a} × {box} = {step.a * step.b}
          </Eq>
        ) : (
          <Eq className="big-eq">
            {step.a} × {step.b} = {box}
          </Eq>
        )}
      </div>

      {status === 'ask' && step.form === 'study' && (
        <div className="study-box" role="note">
          <p className="strong">תרגיל חדש — קודם רואים אותו עם התשובה:</p>
          <p className="reveal-line">
            <Eq className="study-eq">
              {step.a} × {step.b} = <span className="study-ans">{step.a * step.b}</span>
            </Eq>
          </p>
          <p className="say-aloud">
            <Icon name="sound" /> אמרי בקול: <strong>{sayAloud(step.a, step.b)}</strong>
          </p>
          <p>העתיקי את התשובה לתיבה. עוד כמה שאלות ננסה לזכור אותו בלי לראות.</p>
        </div>
      )}

      {status === 'ask' && hintLevel > 0 && (
        <div className="hint-box" role="note">
          <div className="hint-head">
            <Icon name="bulb" /> רמז {hintLevel}
          </div>
          <MathCoach text={hints[hintLevel-1].text}/>
          {hints[hintLevel - 1].visual && <ArrayPicture v={hints[hintLevel - 1].visual!} />}
          {hints[hintLevel - 1].reveals && <p className="strong">עכשיו כתבי את התשובה בעצמך.</p>}
        </div>
      )}

      {status === 'wrongGuide' && (
        <div className="feedback soft" role="status">
          {outcome === 'supported' ? (
            <p>
              <strong>בסדר גמור!</strong> הנה התרגיל עם התשובה:
            </p>
          ) : (
            <p>
              <strong>כמעט!</strong> <Eq>{lastWrong}</Eq> זו לא התשובה. הנה התשובה:
            </p>
          )}
          <p className="reveal-line">
            <Eq className="study-eq">
              {step.a} × {step.b} = <span className="study-ans">{step.a * step.b}</span>
            </Eq>
          </p>
          <p className="say-aloud">
            <Icon name="sound" /> אמרי בקול: <strong>{sayAloud(step.a, step.b)}</strong>
          </p>
          <p>
            <Icon name="bulb" /> דרך לחשב: <RichText text={step.form === 'missing' ? solution.text : workedWay(hints, step.a * step.b)} />
          </p>
          {solution.visual && <ArrayPicture v={solution.visual} />}
          <p className="strong">
            העתיקי את התשובה{step.form === 'missing' ? ' החסרה' : ''}: <Eq>{answer}</Eq>
            {guideMisses > 0 ? ' (המספר כתוב כאן למעלה)' : ''}
          </p>
        </div>
      )}

      {status === 'right' && (
        <div className="feedback good" role="status">
          {outcome === 'independent' && !afterHelp ? (
            <p>
              <strong>נכון!</strong> זכרת את זה לבד. <span className="coin-pop">+1 <Coin size={18} /></span>
            </p>
          ) : outcome === 'independent' ? (
            <p>
              <strong>נכון!</strong> ענית אחרי שכבר ראית היום את התשובה — בפעם הבאה ננסה לזכור לפני שרואים. <span className="coin-pop">+1 <Coin size={18} /></span>
            </p>
          ) : (
            <p>
              <strong>נכון!</strong> הרמז עזר — נחזור לתרגיל הזה בהמשך, כדי שיהיה קל לזכור אותו גם בלי רמז.
            </p>
          )}
        </div>
      )}
      {status === 'guidedRight' && (
        <div className="feedback good" role="status">
          <p>
            {step.form === 'study' ? (
              <>
                <strong>מצוין!</strong> עוד מעט נשאל את התרגיל הזה — בלי התשובה.
              </>
            ) : (
              <>
                <strong>יופי!</strong> נחזור לתרגיל הזה בהמשך, אחרי כמה שאלות אחרות.
              </>
            )}
          </p>
        </div>
      )}

      {typing ? (
        <div className="answer-area">
          <Keypad onDigit={setDigit} onBack={() => setValue((v) => v.slice(0, -1))} onEnter={submit} />
          <div className="answer-actions">
            <button className="primary big" onClick={submit} disabled={!value}>
              {status === 'wrongGuide' || step.form === 'study' ? 'העתקתי' : 'בדיקה'}
            </button>
            {status === 'ask' && step.form !== 'study' && (
              <>
                <button className="not-yet-btn" onClick={notYet}>
                  עוד לא זוכרת
                </button>
                <button className="hint-btn" onClick={() => setHintLevel((h) => Math.min(3, h + 1))} disabled={hintLevel >= 3}>
                  <Icon name="bulb" /> {hintLevel === 0 ? 'תני לי רמז' : hintLevel < 3 ? 'עוד רמז' : 'זה כל ההסבר'}
                </button>
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MatchGame({ step, onDone }: { step: MatchStep; onDone: () => void }) {
  const answers = useMemo(() => shuffle(step.pairs.map((p) => p.a * p.b)), [step.id]);
  const [pickQ, setPickQ] = useState<number | null>(null);
  const [pickA, setPickA] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [miss, setMiss] = useState(false);
  const done = matched.length === step.pairs.length;

  useEffect(() => {
    if (pickQ === null || pickA === null) return;
    const q = step.pairs[pickQ];
    if (q.a * q.b === answers[pickA]) {
      setMatched((m) => [...m, pickQ]);
      sfx.correct();
      setPickQ(null);
      setPickA(null);
      setMiss(false);
    } else {
      setMiss(true);
      sfx.gentle();
      const t = setTimeout(() => {
        setPickQ(null);
        setPickA(null);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [pickQ, pickA, answers, step.pairs]);

  return (
    <div className="question card match">
      <h2>משחק התאמות</h2>
      <p className="muted">מצאי לכל תרגיל את התוצאה שלו: הקישי על תרגיל ואז על תוצאה.</p>
      <div className="match-cols">
        <div className="match-col" role="group" aria-label="תרגילים">
          {step.pairs.map((p, i) => {
            const isM = matched.includes(i);
            return (
              <button key={p.key} className={`match-btn ${isM ? 'matched' : ''} ${pickQ === i ? 'picked' : ''}`} disabled={isM} onClick={() => setPickQ(i)} aria-pressed={pickQ === i}>
                <Eq>
                  {p.a} × {p.b}
                </Eq>
              </button>
            );
          })}
        </div>
        <div className="match-col" role="group" aria-label="תוצאות">
          {answers.map((v, i) => {
            const isM = matched.some((qi) => step.pairs[qi].a * step.pairs[qi].b === v);
            return (
              <button key={v} className={`match-btn answer ${isM ? 'matched' : ''} ${pickA === i ? 'picked' : ''}`} disabled={isM} onClick={() => setPickA(i)} aria-pressed={pickA === i}>
                <Eq>{v}</Eq>
              </button>
            );
          })}
        </div>
      </div>
      <p className="match-msg" role="status">
        {done ? 'כל הזוגות נמצאו!' : miss ? 'זה לא זוג — נסי שוב.' : ' '}
      </p>
      {done && (
        <div className="row center">
          <button className="primary big" onClick={onDone} autoFocus>
            הבא <Icon name="arrowL" />
          </button>
        </div>
      )}
    </div>
  );
}
