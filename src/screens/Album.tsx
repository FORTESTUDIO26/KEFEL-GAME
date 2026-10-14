import { useRef, useState } from 'react';
import { requestById } from '../content/catalog';
import { dogById } from '../content/dogs';
import type { Screen } from '../App';
import { deletePhoto, renamePhoto } from '../state/game';
import { useStore } from '../state/store';
import type { AlbumEntry } from '../state/types';
import { Modal, Stars } from '../ui/common';
import { Icon } from '../ui/icons';
import { downloadLook, LookCard, safeFileName, saveMessage, usePreparedPng } from '../ui/LookCard';
import { useToast } from '../ui/toast';

export function Album({ onGo }: { onGo: (s: Screen) => void }) {
  const { save } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const photos = [...save.album].reverse();
  const open = save.album.find((e) => e.id === openId) ?? null;

  return (
    <div className="album">
      <div className="row between wrap">
        <h1 className="h-inline">האלבום</h1>
        <span className="muted">
          <bdi dir="ltr">{save.album.length}</bdi> לוקים
        </span>
      </div>
      {photos.length === 0 ? (
        <div className="card empty stack center">
          <Icon name="camera" size={48} />
          <h2>האלבום מחכה ללוק הראשון</h2>
          <p className="muted">אחרי כל לקוח מצלמים את הלוק. אפשר גם לצלם את הכלב של הסטודיו מהמלתחה.</p>
          <div className="row wrap center">
            <button className="primary" onClick={() => onGo('client')}>
              <Icon name="paw" /> לקבל לקוח
            </button>
            <button className="secondary" onClick={() => onGo('wardrobe')}>
              <Icon name="hanger" /> למלתחה
            </button>
          </div>
        </div>
      ) : (
        <div className="album-grid">
          {photos.map((e) => (
            <button key={e.id} className="album-item" onClick={() => setOpenId(e.id)} aria-label={`לפתוח: ${e.title}`}>
              <LookCard dogId={e.dogId} outfit={e.outfit} backdrop={e.backdrop} title={e.title} paletteId={save.profile.paletteId} />
            </button>
          ))}
        </div>
      )}
      {open && <PhotoView entry={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function PhotoView({ entry, onClose }: { entry: AlbumEntry; onClose: () => void }) {
  const { save, update } = useStore();
  const notify = useToast();
  const [title, setTitle] = useState(entry.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  const png = usePreparedPng(ref, [title, entry.id]);
  const dog = dogById(entry.dogId);
  const req = entry.requestId ? requestById(entry.requestId) : null;
  const dir = req?.directions.find((d) => d.id === entry.directionId);

  return (
    <Modal title={entry.title} onClose={onClose} wide>
      <div className="photo-layout compact">
        <div className="polaroid-wrap">
          <LookCard ref={ref} dogId={entry.dogId} outfit={entry.outfit} backdrop={entry.backdrop} title={title || ' '} paletteId={save.profile.paletteId} />
        </div>
        <div className="stack">
          <p className="muted">
            {dog.name}
            {req ? ` · ${req.title}` : ''}
            {dir ? ` · ${dir.name}` : ''} · {new Date(entry.createdAt).toLocaleDateString('he-IL')}
          </p>
          {entry.stars > 0 && <Stars n={entry.stars} />}
          <label className="field">
            <span>שם הלוק</span>
            <input value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <button
            className="primary"
            disabled={!title.trim() || title.trim() === entry.title}
            onClick={() => {
              update((s) => renamePhoto(s, entry.id, title));
              notify('השם עודכן');
            }}
          >
            <Icon name="edit" /> לשמור שם
          </button>
          <button
            className="secondary"
            onClick={async () => {
              const r = ref.current ? await downloadLook(ref.current, safeFileName(title || entry.title), title || entry.title, png.current) : 'failed';
              const msg = saveMessage(r);
              if (msg) notify(msg);
            }}
          >
            <Icon name="download" /> לשמור תמונה במכשיר
          </button>
          {!confirmDelete ? (
            <button className="ghost" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" /> למחוק מהאלבום
            </button>
          ) : (
            <div className="warn-box stack">
              <p>למחוק את התמונה מהאלבום?</p>
              <div className="row">
                <button
                  className="danger"
                  onClick={() => {
                    update((s) => deletePhoto(s, entry.id));
                    onClose();
                  }}
                >
                  כן, למחוק
                </button>
                <button className="ghost" onClick={() => setConfirmDelete(false)}>
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
