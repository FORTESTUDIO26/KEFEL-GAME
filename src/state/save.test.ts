import { describe, expect, it } from 'vitest';
import { applyOutcome } from '../learning/data';
import {
  BACKUP_PREFIX,
  defaultSave,
  exportText,
  loadSave,
  parseImport,
  repairFromRaw,
  SAVE_KEY,
  validateSave,
  writeSave,
  type StorageLike,
} from './save';
import { SCHEMA_VERSION } from './types';

const NOW = new Date(2026, 9, 13, 10, 0).getTime();

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

function richSave() {
  const s = defaultSave(NOW);
  s.profile = { studioName: 'בוטיק הכלבים', paletteId: 'turq', ownDogId: 'lola', onboarded: true };
  s.coins = 42;
  s.owned.wearables.push('crown');
  s.outfits.lola = { head: { itemId: 'crown', color: '#f2c14e' } };
  s.album.push({
    id: 'a1', dogId: 'lola', outfit: s.outfits.lola, backdrop: 'stage', title: 'מלכת הבמה',
    requestId: 'rg_show', directionId: 'shine', stars: 2, createdAt: NOW,
  });
  s.learning = applyOutcome(s.learning, { a: 7, b: 8, outcome: 'hinted', usedHint: true }, NOW);
  return s;
}

describe('save & load', () => {
  it('starts fresh when nothing is stored', () => {
    const r = loadSave(memoryStorage(), NOW);
    expect(r.status).toBe('new');
  });

  it('round-trips a full save through storage', () => {
    const st = memoryStorage();
    const s = richSave();
    expect(writeSave(st, s)).toBe(true);
    const r = loadSave(st, NOW);
    expect(r.status).toBe('ok');
    if (r.status === 'ok') {
      expect(r.data.profile.studioName).toBe('בוטיק הכלבים');
      expect(r.data.coins).toBe(42);
      expect(r.data.outfits.lola.head?.itemId).toBe('crown');
      expect(r.data.album[0].title).toBe('מלכת הבמה');
      expect(r.data.learning.facts['7x8'].hintedCorrect).toBe(1);
      expect(r.data.learning.facts['7x8'].independentCorrect).toBe(0);
      expect(r.data.version).toBe(SCHEMA_VERSION);
    }
  });

  it('keeps a backup of a damaged save instead of deleting it', () => {
    const st = memoryStorage({ [SAVE_KEY]: '{"version":1, "coins": 5, oops' });
    const r = loadSave(st, NOW);
    expect(r.status).toBe('corrupt');
    if (r.status === 'corrupt') {
      expect(r.backupKey?.startsWith(BACKUP_PREFIX)).toBe(true);
      expect(st.data[r.backupKey!]).toBe('{"version":1, "coins": 5, oops');
      expect(st.data[SAVE_KEY]).toBe('{"version":1, "coins": 5, oops'); // untouched
    }
  });

  it('flags a structurally broken save as corrupt', () => {
    const st = memoryStorage({ [SAVE_KEY]: JSON.stringify({ version: 1, coins: 'lots' }) });
    expect(loadSave(st, NOW).status).toBe('corrupt');
  });

  it('refuses a save from a newer version rather than guessing', () => {
    const s = { ...richSave(), version: SCHEMA_VERSION + 1 };
    const v = validateSave(s, NOW);
    expect(v.ok).toBe(false);
  });

  it('repairs what it can from a partly damaged save', () => {
    const s = richSave() as unknown as Record<string, unknown>;
    (s as { coins: unknown }).coins = -50;
    (s as { owned: { wearables: unknown[] } }).owned.wearables.push('not-a-real-item', 7);
    const repaired = repairFromRaw(JSON.stringify(s), NOW);
    expect(repaired.coins).toBe(0);
    expect(repaired.owned.wearables).toContain('crown');
    expect(repaired.owned.wearables).not.toContain('not-a-real-item');
    expect(repaired.album).toHaveLength(1);
  });

  it('cleans unknown values but keeps valid progress', () => {
    const s = richSave() as unknown as Record<string, any>;
    s.learning.facts['99x99'] = { attempts: 3 };
    s.learning.facts['7x8'].attempts = 'many';
    s.settings.tables = [6, 7, 42];
    const v = validateSave(s, NOW);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.data.learning.facts['99x99']).toBeUndefined();
      expect(v.data.learning.facts['7x8'].attempts).toBe(0);
      expect(v.data.learning.facts['7x8'].hintedCorrect).toBe(1);
      expect(v.data.settings.tables).toEqual([6, 7]);
    }
  });
});

describe('import & export', () => {
  it('exports and imports the same progress', () => {
    const s = richSave();
    const text = exportText(s, NOW);
    const r = parseImport(text, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.coins).toBe(42);
      expect(r.data.learning.facts['7x8'].hintUses).toBe(1);
      expect(r.data.album[0].title).toBe('מלכת הבמה');
    }
  });

  it('accepts a raw save object as well', () => {
    expect(parseImport(JSON.stringify(richSave()), NOW).ok).toBe(true);
  });

  it('rejects files that are not saves', () => {
    expect(parseImport('hello', NOW).ok).toBe(false);
    expect(parseImport(JSON.stringify({ some: 'thing' }), NOW).ok).toBe(false);
    expect(parseImport(JSON.stringify({ app: 'liori-studio', save: { version: 1 } }), NOW).ok).toBe(false);
  });
});
