import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SAVE_KEY, validateSave, type StorageLike, writeSave } from './save';
import type { SaveData } from './types';

interface StoreValue {
  save: SaveData;
  update: (fn: (s: SaveData) => SaveData) => void;
  /** replace the whole save (import / reset) */
  replace: (s: SaveData) => void;
  storage: StorageLike | null;
  /** false when saving to this browser failed or is unavailable */
  persistent: boolean;
  flush: () => boolean;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ initial, storage, children, libraryPersistent=true }: { initial: SaveData; storage: StorageLike | null; children: ReactNode; libraryPersistent?:boolean }) {
  // If the provider ever remounts (e.g. during development hot reload), continue from the
  // latest stored save rather than the snapshot taken when the page loaded.
  const [save, setSave] = useState<SaveData>(() => {
    try {
      const raw = storage?.getItem(SAVE_KEY);
      if (raw) {
        const v = validateSave(JSON.parse(raw), Date.now());
        if (v.ok && v.data.updatedAt >= initial.updatedAt) return v.data;
      }
    } catch {
      // unreadable: keep the data we were given
    }
    return initial;
  });
  const [persistent, setPersistent] = useState(storage !== null);
  const latest = useRef(save);
  latest.current = save;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (storage) setPersistent(writeSave(storage, save));
      return;
    }
    if (!storage) return;
    setPersistent(writeSave(storage, save));
  }, [save, storage]);

  const update = useCallback((fn: (s: SaveData) => SaveData) => {
    setSave((s) => {
      const next = fn(s);
      return next === s ? s : { ...next, updatedAt: Date.now() };
    });
  }, []);
  const replace = useCallback((s: SaveData) => setSave({ ...s, updatedAt: Date.now() }), []);
  const flush = useCallback(() => {
    const ok = storage ? writeSave(storage, latest.current) : false;
    setPersistent(ok);
    return ok;
  }, [storage]);

  const value = useMemo(() => ({ save, update, replace, storage, persistent:persistent&&libraryPersistent, flush }), [save, update, replace, storage, persistent, libraryPersistent, flush]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}
