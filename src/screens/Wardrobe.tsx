import { useRef, useState } from 'react';
import { DogFigure } from '../art/Dog';
import { BACKDROPS, type BackdropId } from '../content/catalog';
import { DOGS, dogById } from '../content/dogs';
import type { Screen } from '../App';
import { addPhoto, setOwnOutfit } from '../state/game';
import { useStore } from '../state/store';
import { Modal } from '../ui/common';
import { DressingRoom } from '../ui/DressingRoom';
import { Icon } from '../ui/icons';
import { LookCard } from '../ui/LookCard';
import { sfx } from '../ui/sound';
import { useToast } from '../ui/toast';

/** Free dressing for the studio dog and every client met so far — no practice needed. */
export function Wardrobe({ onGo }: { onGo: (s: Screen) => void }) {
  const { save, update } = useStore();
  const ids = [save.profile.ownDogId, ...save.metDogs.filter((d) => d !== save.profile.ownDogId)];
  const [dogId, setDogId] = useState(ids[0]);
  const [photoOpen, setPhotoOpen] = useState(false);
  const dog = dogById(dogId);
  const outfit = save.outfits[dogId] ?? {};
  const unmet = DOGS.length - ids.length;

  return (
    <div className="wardrobe">
      <div className="row between wrap">
        <h1 className="h-inline">המלתחה</h1>
        <button className="primary" onClick={() => setPhotoOpen(true)}>
          <Icon name="camera" /> לצלם לאלבום
        </button>
      </div>
      <div className="dog-strip" role="tablist" aria-label="בחירת כלב">
        {ids.map((id) => {
          const d = dogById(id);
          return (
            <button key={id} role="tab" aria-selected={dogId === id} className={`dog-chip ${dogId === id ? 'on' : ''}`} onClick={() => setDogId(id)}>
              <DogFigure dog={d} outfit={save.outfits[id]} />
              <span>{d.name}</span>
              {id === save.profile.ownDogId && <span className="tag">של הסטודיו</span>}
            </button>
          );
        })}
        {unmet > 0 && (
          <button className="dog-chip more" onClick={() => onGo('client')}>
            <Icon name="paw" size={32} />
            <span>עוד {unmet} כלבים יגיעו כלקוחות</span>
          </button>
        )}
      </div>
      <DressingRoom key={dogId} dog={dog} outfit={outfit} onChange={(o) => update((s) => setOwnOutfit(s, dogId, o))} />
      {photoOpen && <PhotoDialog dogId={dogId} onClose={() => setPhotoOpen(false)} />}
    </div>
  );
}

function PhotoDialog({ dogId, onClose }: { dogId: string; onClose: () => void }) {
  const { save, update } = useStore();
  const notify = useToast();
  const dog = dogById(dogId);
  const [title, setTitle] = useState(`הלוק של ${dog.name}`);
  const [backdrop, setBackdrop] = useState<BackdropId>('studio');
  const ref = useRef<SVGSVGElement>(null);
  const outfit = save.outfits[dogId] ?? {};
  return (
    <Modal title="צילום לאלבום" onClose={onClose} wide>
      <div className="photo-layout compact">
        <div className="polaroid-wrap">
          <LookCard ref={ref} dogId={dogId} outfit={outfit} backdrop={backdrop} title={title || ' '} paletteId={save.profile.paletteId} />
        </div>
        <div className="stack">
          <label className="field">
            <span>שם ללוק</span>
            <input value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <div className="chips">
            {BACKDROPS.map((b) => (
              <button key={b.id} className={`chip ${backdrop === b.id ? 'on' : ''}`} onClick={() => setBackdrop(b.id)} aria-pressed={backdrop === b.id}>
                {b.name}
              </button>
            ))}
          </div>
          <button
            className="primary big"
            onClick={() => {
              sfx.camera();
              const now = Date.now();
              update((s) => addPhoto(s, { dogId, outfit, backdrop, title, request: null, directionId: null, stars: 0 }, now, false).save);
              notify('התמונה נשמרה באלבום!');
              onClose();
            }}
          >
            <Icon name="camera" /> לצלם!
          </button>
        </div>
      </div>
    </Modal>
  );
}
