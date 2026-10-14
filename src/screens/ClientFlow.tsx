import { useEffect, useRef, useState } from 'react';
import { MissionCelebration } from '../ui/MissionCelebration';
import type { GiftRecord } from '../state/types';
import { DogFigure } from '../art/Dog';
import { BACKDROPS, requestById, type BackdropId, type StyleTag } from '../content/catalog';
import { dogById, gx } from '../content/dogs';
import type { FactKey } from '../learning/facts';
import type { Outcome } from '../learning/scheduler';
import { afterAnswer, planRound, type QuestionStep, type Round } from '../learning/session';
import type { Screen } from '../App';
import { STYLE_COIN_PER_STAR, styleStars } from '../state/economy';
import { addPhoto, completeRound, noteClientArrived, pickClient, recordAnswer, recordMatch, serveClient, type Client } from '../state/game';
import { useStore } from '../state/store';
import type { Outfit } from '../state/types';
import { CoinAmount, Stars } from '../ui/common';
import { DressingRoom } from '../ui/DressingRoom';
import { Icon } from '../ui/icons';
import { downloadLook, LookCard, safeFileName, saveMessage, usePreparedPng } from '../ui/LookCard';
import { useToast } from '../ui/toast';
import { sfx } from '../ui/sound';
import { Practice } from './Practice';

export interface ClientSession {
  client: Client;
  phase: 'arrive' | 'direction' | 'practice' | 'reward' | 'dress' | 'photo' | 'done';
  directionId: string | null;
  round: Round | null;
  index: number;
  outcomes: Outcome[];
  reward: { gift:GiftRecord|null; base: number; bonus: number; milestone: { days: number; coins: number } | null } | null;
  outfit: Outfit;
  photo: { title: string; backdrop: BackdropId; stars: number; bonus: number } | null;
}

const TAG_LABEL: Record<StyleTag, string> = {
  party: 'מסיבה', sport: 'ספורט', stage: 'במה', cozy: 'נוח', elegant: 'אלגנטי', rain: 'גשם', beach: 'קיץ', winter: 'חורף', fun: 'שובב', classic: 'קלאסי', sparkle: 'נצנצים',
};

interface Props {
  session: ClientSession | null;
  setSession: (s: ClientSession | null) => void;
  onGo: (s: Screen) => void;
}

export function ClientFlow({ session, setSession, onGo }: Props) {
  const { save, update } = useStore();
  const created = useRef(false);

  // A new client arrives when there is none (or the last one is done and she asks for the next).
  useEffect(() => {
    if (session || created.current) return;
    created.current = true;
    const client = pickClient(save);
    update((s) => noteClientArrived(s, client));
    setSession({
      client,
      phase: 'arrive',
      directionId: null,
      round: null,
      index: 0,
      outcomes: [],
      reward: null,
      outfit: save.outfits[client.dogId] ?? {},
      photo: null,
    });
  }, [session, save, setSession, update]);

  if (!session) return <div className="card center-page muted">הלקוח בדרך...</div>;

  const dog = dogById(session.client.dogId);
  const request = requestById(session.client.requestId)!;
  const direction = request.directions.find((d) => d.id === session.directionId) ?? null;
  const set = (patch: Partial<ClientSession>) => setSession({ ...session, ...patch });

  const nextClient = () => {
    created.current = false;
    setSession(null);
  };

  if (session.phase === 'arrive') {
    return (
      <div className="client-screen">
        <div className="arrive card">
          <div className="arrive-dog">
            <DogFigure dog={dog} outfit={session.outfit} />
          </div>
          <div className="stack">
            <p className="eyebrow">לקוח חדש בסטודיו</p>
            <h1>
              {dog.name} <span className="muted small">· {dog.breed}</span>
            </h1>
            <p className="muted">{dog.personality}</p>
            <div className="bubble">
              <strong>{request.title}</strong>
              <p>{gx(request.text, dog.female)}</p>
            </div>
            <button className="primary big" onClick={() => set({ phase: 'direction' })}>
              בואי נעצב! <Icon name="arrowL" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (session.phase === 'direction') {
    return (
      <div className="client-screen">
        <div className="card stack">
          <h1>איזה כיוון עיצובי מתאים ל{dog.name}?</h1>
          <p className="muted">{request.title} — בחרי את הסגנון. אחר כך נתפור את הלוק בעזרת כמה תרגילים קצרים.</p>
          <div className="direction-grid">
            {request.directions.map((d) => (
              <button
                key={d.id}
                className="direction-card"
                onClick={() => {
                  sfx.tap();
                  const round = planRound(save.learning, save.settings.tables, Date.now());
                  set({ phase: 'practice', directionId: d.id, round, index: 0, outcomes: [] });
                }}
              >
                <span className="direction-name">{d.name}</span>
                <span className="direction-tags">{d.tags.map((t) => TAG_LABEL[t]).join(' · ')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (session.phase === 'practice' && session.round) {
    const round = session.round;
    const intro =
      round.mode === 'free'
        ? 'כל החזרות של היום כבר הושלמו! זה סבב תרגול חופשי, בלי לחץ.'
        : round.steps.some((s) => s.type === 'question' && s.form === 'study')
          ? 'יש כאן תרגיל חדש: קודם נראה אותו יחד עם התשובה, ורק אחר כך ננסה לזכור.'
          : 'אם תרגיל עוד לא נזכר — אפשר תמיד ללחוץ ״עוד לא זוכרת״.';

    const finish = (outcomes: Outcome[], r: Round) => {
      const now = Date.now();
      // completeRound is pure: the stored result and the numbers shown here are the same.
      update((s) => completeRound(s, r, outcomes, now).save);
      const res = completeRound(save, r, outcomes, now);
      sfx.done();
      setSession({ ...session, round: r, outcomes, phase: 'reward', reward: { gift:res.gift,base: res.reward.base, bonus: res.reward.independentBonus, milestone: res.milestone } });
    };

    return (
      <div className="client-screen">
        {intro && session.index === 0 && <p className="intro-note">{intro}</p>}
        <Practice
          round={round}
          index={session.index}
          dog={dog}
          outfit={session.outfit}
          onAnswer={(i, outcome, usedHint) => {
            const step = round.steps[i] as QuestionStep;
            update((s) => recordAnswer(s, { a: step.a, b: step.b, outcome, usedHint, free: round.mode === 'free' }, Date.now()));
            set({ round: afterAnswer(round, i, outcome), outcomes: [...session.outcomes, outcome] });
          }}
          onMatchDone={(i, keys: FactKey[]) => {
            update((s) => recordMatch(s, keys));
            const next = i + 1;
            if (next >= round.steps.length) finish(session.outcomes, round);
            else set({ index: next });
          }}
          onNext={() => {
            const next = session.index + 1;
            if (next >= round.steps.length) finish(session.outcomes, round);
            else set({ index: next });
          }}
        />
      </div>
    );
  }

  if (session.phase === 'reward' && session.reward) {
    const r = session.reward;
    return (
      <div className="client-screen">
        <div className="card reward stack center">
          <div className="reward-dog">
            <DogFigure dog={dog} outfit={session.outfit} />
          </div>
          <h1>הבדים מוכנים!</h1>
          <p>סיימת את המקבץ — עכשיו אפשר לבחור את הלוק של {dog.name}.</p>
          <ul className="reward-list">
            <li>
              על סיום המקבץ <CoinAmount value={r.base} />
            </li>
            {r.bonus > 0 && (
              <li>
                על תשובות שנזכרת בהן לבד <CoinAmount value={r.bonus} />
              </li>
            )}
            {r.milestone && (
              <li className="milestone">
                בונוס התמדה: תרגלת ב־{r.milestone.days} ימים שונים! <CoinAmount value={r.milestone.coins} />
              </li>
            )}
          </ul>
          <MissionCelebration gift={r.gift}/>
          <button className="primary big" onClick={() => set({ phase: 'dress' })} autoFocus>
            <Icon name="hanger" /> לחדר ההלבשה
          </button>
        </div>
      </div>
    );
  }

  if (session.phase === 'dress') {
    return (
      <div className="client-screen">
        <div className="row between wrap">
          <h1 className="h-inline">
            הלוק של {dog.name}: {request.title}
          </h1>
          <button className="primary big" onClick={() => set({ phase: 'photo' })}>
            <Icon name="camera" /> סיימתי, לצילום!
          </button>
        </div>
        <DressingRoom dog={dog} outfit={session.outfit} onChange={(o) => set({ outfit: o })} direction={direction} />
      </div>
    );
  }

  if (session.phase === 'photo') {
    return <PhotoStep session={session} onBack={() => set({ phase: 'dress' })} onTaken={(photo) => set({ phase: 'done', photo })} />;
  }

  if (session.phase === 'done' && session.photo) {
    return (
      <div className="client-screen">
        <div className="card done stack center">
          <div className="polaroid-wrap">
            <LookCard dogId={dog.id} outfit={session.outfit} backdrop={session.photo.backdrop} title={session.photo.title} paletteId={save.profile.paletteId} />
          </div>
          <h1>{gx(`${dog.name} {מאושר|מאושרת} מהלוק!`, dog.female)}</h1>
          <p className="muted">התמונה נשמרה באלבום.</p>
          {session.photo.stars > 0 && (
            <p>
              <Stars n={session.photo.stars} /> התאמה לבקשה {session.photo.bonus > 0 && <CoinAmount value={session.photo.bonus} />}
            </p>
          )}
          <div className="row wrap center">
            <button className="primary big" onClick={nextClient}>
              <Icon name="paw" /> ללקוח הבא
            </button>
            <button className="secondary" onClick={() => onGo('studio')}>
              <Icon name="home" /> לעצב את הסטודיו
            </button>
            <button className="secondary" onClick={() => onGo('album')}>
              <Icon name="album" /> לאלבום
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function PhotoStep({ session, onBack, onTaken }: { session: ClientSession; onBack: () => void; onTaken: (p: NonNullable<ClientSession['photo']>) => void }) {
  const { save, update } = useStore();
  const dog = dogById(session.client.dogId);
  const request = requestById(session.client.requestId)!;
  const direction = request.directions.find((d) => d.id === session.directionId) ?? null;
  const [backdrop, setBackdrop] = useState<BackdropId>(request.backdrop);
  const [title, setTitle] = useState(`${request.title} של ${dog.name}`);
  const [shooting, setShooting] = useState(false);
  const cardRef = useRef<SVGSVGElement>(null);
  const png = usePreparedPng(cardRef, [title, backdrop]);
  const notify = useToast();
  const stars = styleStars(session.outfit, direction);

  const shoot = () => {
    if (shooting) return;
    setShooting(true);
    sfx.camera();
    const now = Date.now();
    update(
      (s) =>
        addPhoto(
          serveClient(s, session.client, session.outfit),
          { dogId: dog.id, outfit: session.outfit, backdrop, title, request, directionId: session.directionId, stars },
          now,
          true
        ).save
    );
    setTimeout(() => onTaken({ title: title.trim() || 'לוק בלי שם', backdrop, stars, bonus: stars * STYLE_COIN_PER_STAR }), 450);
  };

  return (
    <div className="client-screen">
      <div className="photo-layout">
        <div className={`card polaroid-wrap ${shooting ? 'shooting' : ''}`}>
          <LookCard ref={cardRef} dogId={dog.id} outfit={session.outfit} backdrop={backdrop} title={title || ' '} paletteId={save.profile.paletteId} />
        </div>
        <div className="card stack">
          <h2>צילום לאלבום</h2>
          <label className="field">
            <span>שם ללוק</span>
            <input value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <span className="muted small">רקע:</span>
          <div className="chips">
            {BACKDROPS.map((b) => (
              <button key={b.id} className={`chip ${backdrop === b.id ? 'on' : ''}`} onClick={() => setBackdrop(b.id)} aria-pressed={backdrop === b.id}>
                {b.name}
              </button>
            ))}
          </div>
          <button className="primary big" onClick={shoot} disabled={shooting}>
            <Icon name="camera" /> לצלם!
          </button>
          <button className="ghost" onClick={onBack}>
            <Icon name="arrowR" /> חזרה להלבשה
          </button>
          <button
            className="ghost"
            onClick={async () => {
              if (cardRef.current) {
                const msg = saveMessage(await downloadLook(cardRef.current, safeFileName(title), title, png.current));
                if (msg) notify(msg);
              }
            }}
          >
            <Icon name="download" /> לשמור תמונה במכשיר
          </button>
        </div>
      </div>
    </div>
  );
}
