import { useState, type CSSProperties } from 'react';
import { DogFigure } from '../art/Dog';
import { RoomBackground } from '../art/Scenes';
import { PALETTES, paletteById } from '../content/catalog';
import { dogById, STARTER_DOG_IDS } from '../content/dogs';
import { useStore } from '../state/store';
import { Icon } from '../ui/icons';
import { sfx } from '../ui/sound';

const NAME_IDEAS = ['הסטודיו של ליאורי', 'כלבלבים בסטייל', 'בוטיק הזנבות', 'סטודיו כפות קטנות'];

export function Onboarding() {
  const { save, update } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(save.profile.studioName);
  const [paletteId, setPaletteId] = useState(save.profile.paletteId);
  const [dogId, setDogId] = useState(STARTER_DOG_IDS[0]);

  const finish = () => {
    sfx.done();
    update((s) => ({
      ...s,
      profile: { studioName: name.trim() || 'הסטודיו של ליאורי', paletteId, ownDogId: dogId, onboarded: true },
      metDogs: [dogId],
      outfits: { ...s.outfits, [dogId]: { neck: { itemId: 'bandana', color: '#ff7eb6' } } },
    }));
  };

  const pal = paletteById(paletteId);
  const vars = { '--accent': pal.accent, '--accent2': pal.accent2, '--soft': pal.soft } as CSSProperties;

  return (
    <div className="onboarding" style={vars}>
      <div className="onb-hero" aria-hidden="true">
        <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
          <g transform="translate(0 -150)">
            <RoomBackground wall="wall_stripes" floor="floor_wood" p={pal} />
          </g>
        </svg>
      </div>
      <div className="card onb-card stack">
        <p className="eyebrow">ברוכה הבאה!</p>
        <ol className="steps-dots" aria-label={`שלב ${step + 1} מתוך 3`}>
          {[0, 1, 2].map((i) => (
            <li key={i} className={i <= step ? 'on' : ''} />
          ))}
        </ol>

        {step === 0 && (
          <div className="stack">
            <h1>איך יקראו לסטודיו שלך?</h1>
            <p className="muted">כאן מעצבים בגדים ואביזרים לכלבים. כל לקוח מגיע עם בקשה משלו.</p>
            <label className="field">
              <span>שם הסטודיו</span>
              <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setStep(1)} />
            </label>
            <div className="chips">
              {NAME_IDEAS.map((n) => (
                <button key={n} className={`chip ${name === n ? 'on' : ''}`} onClick={() => setName(n)}>
                  {n}
                </button>
              ))}
            </div>
            <button className="primary big" onClick={() => setStep(1)} disabled={!name.trim()}>
              הבא
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="stack">
            <h1>בחרי פלטת צבעים</h1>
            <p className="muted">אפשר להחליף אותה בכל זמן בסטודיו.</p>
            <div className="palette-grid">
              {PALETTES.map((pal) => (
                <button key={pal.id} className={`palette-card ${paletteId === pal.id ? 'on' : ''}`} onClick={() => setPaletteId(pal.id)} aria-pressed={paletteId === pal.id}>
                  <span className="swatches" aria-hidden="true">
                    {[pal.wall, pal.wallAccent, pal.accent, pal.accent2].map((c) => (
                      <span key={c} style={{ background: c }} />
                    ))}
                  </span>
                  {pal.name}
                </button>
              ))}
            </div>
            <div className="row">
              <button className="ghost" onClick={() => setStep(0)}>
                <Icon name="arrowR" /> חזרה
              </button>
              <button className="primary big grow" onClick={() => setStep(2)}>
                הבא
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="stack">
            <h1>מי הכלב של הסטודיו?</h1>
            <p className="muted">הכלב הזה גר בסטודיו ואפשר להלביש אותו מתי שרוצים.</p>
            <div className="dog-pick-grid">
              {STARTER_DOG_IDS.map((id) => {
                const d = dogById(id);
                return (
                  <button key={id} className={`dog-pick ${dogId === id ? 'on' : ''}`} onClick={() => setDogId(id)} aria-pressed={dogId === id}>
                    <DogFigure dog={d} outfit={dogId === id ? { neck: { itemId: 'bandana', color: '#ff7eb6' } } : {}} />
                    <strong>{d.name}</strong>
                    <span className="muted small">{d.breed}</span>
                  </button>
                );
              })}
            </div>
            <p className="dog-blurb">
              <strong>{dogById(dogId).name}:</strong> {dogById(dogId).personality}
            </p>
            <div className="row">
              <button className="ghost" onClick={() => setStep(1)}>
                <Icon name="arrowR" /> חזרה
              </button>
              <button className="primary big grow" onClick={finish}>
                לפתוח את הסטודיו!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
