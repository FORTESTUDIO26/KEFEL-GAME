import { describe, expect, it } from 'vitest';
import { requestById } from '../content/catalog';
import { getStats } from '../learning/data';
import { factKey } from '../learning/facts';
import { afterAnswer, answerFor, planRound, type QuestionStep } from '../learning/session';
import type { Outcome } from '../learning/scheduler';
import { buy, styleStars } from './economy';
import {
  addPhoto,
  completeRound,
  noteClientArrived,
  pickClient,
  placeFurniture,
  recordAnswer,
  removePlaced,
  serveClient,
  toggleItem,
  updatePlaced,
} from './game';
import { defaultSave, loadSave, writeSave, type StorageLike } from './save';

const T0 = new Date(2026, 9, 13, 16, 0).getTime();

function memoryStorage(): StorageLike {
  const data: Record<string, string> = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
}

let seed = 7;
const rng = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe('full game path (logic level)', () => {
  it('first visit → warm-up client → mistakes and hints → reward → purchase → photo → reload', () => {
    // first visit: choose name, palette, first dog
    let s = defaultSave(T0);
    s = { ...s, profile: { studioName: 'כלבלבים בסטייל', paletteId: 'pink', ownDogId: 'lola', onboarded: true } };

    // design a little before practising (no coins needed)
    s = placeFurniture(s, 'dog_bed', T0);
    const bed = s.studio.items.find((p) => p.itemId === 'dog_bed')!;
    s = updatePlaced(s, bed.uid, { x: 600, flip: true });
    expect(s.studio.items.find((p) => p.uid === bed.uid)?.x).toBe(600);

    // a client arrives
    const client = pickClient(s, rng);
    expect(client.dogId).not.toBe('lola');
    s = noteClientArrived(s, client);

    // the first client round: new facts are taught first (study cards), then asked later
    let round = planRound(s.learning, s.settings.tables, T0, rng);
    expect(round.mode).toBe('scheduled');
    const outcomes: Outcome[] = [];
    const planned: Outcome[] = ['wrong', 'hinted'];
    const asked: QuestionStep[] = [];
    let i = 0;
    while (i < round.steps.length) {
      const step = round.steps[i] as QuestionStep;
      const outcome: Outcome = step.form === 'study' ? 'supported' : planned.shift() ?? 'independent';
      if (step.form !== 'study') asked.push(step);
      expect(answerFor(step)).toBe(step.a * step.b);
      s = recordAnswer(s, { a: step.a, b: step.b, outcome, usedHint: outcome === 'hinted' }, T0 + i * 1000);
      outcomes.push(outcome);
      round = afterAnswer(round, i, outcome);
      i += 1;
    }
    // every fact that was asked had been taught earlier in the round
    for (const q of asked) {
      const studied = round.steps.findIndex((x) => x.type === 'question' && x.key === q.key && x.form === 'study');
      expect(studied).toBeGreaterThanOrEqual(0);
      expect(studied).toBeLessThan(round.steps.indexOf(q));
    }
    const wrongStep = asked[0];
    expect(getStats(s.learning, wrongStep.key).wrong).toBe(1);
    expect(getStats(s.learning, asked[1].key).hintedCorrect).toBe(1);
    expect(getStats(s.learning, asked[1].key).independentCorrect).toBe(0);

    // reward: finishing pays the same base whatever happened
    const res = completeRound(s, round, outcomes, T0 + 60_000);
    s = res.save;
    expect(res.reward.total).toBe(50);
    expect(res.gift).not.toBeNull();
    const coins = s.coins;

    // One completed mission affords either regular item.
    expect(buy(s, 'wearable', 'crown').check.ok).toBe(true);
    s = buy(s, 'wearable', 'beret').save;
    expect(s.owned.wearables).toContain('beret');
    expect(s.coins).toBe(coins - 15);

    // dress the client, remove an item, choose the look
    const request = requestById(client.requestId)!;
    let outfit = toggleItem({}, 'party_hat');
    outfit = toggleItem(outfit, 'bandana');
    outfit = toggleItem(outfit, 'party_hat'); // taken off again
    expect(outfit.head).toBeUndefined();
    outfit = toggleItem(outfit, 'beret');
    s = serveClient(s, client, outfit);
    const stars = styleStars(outfit, request.directions[0]);

    // photo for the album
    const photo = addPhoto(s, { dogId: client.dogId, outfit, backdrop: request.backdrop, title: 'לוק מסיבה', request, directionId: request.directions[0].id, stars }, T0 + 120_000, true);
    s = photo.save;
    expect(s.album).toHaveLength(1);

    // studio edits
    s = removePlaced(s, bed.uid);
    expect(s.studio.items.some((p) => p.uid === bed.uid)).toBe(false);

    // "reload": write to storage and read back
    const st = memoryStorage();
    expect(writeSave(st, s)).toBe(true);
    const loaded = loadSave(st, T0 + 200_000);
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    const r = loaded.data;
    expect(r.profile.studioName).toBe('כלבלבים בסטייל');
    expect(r.coins).toBe(s.coins);
    expect(r.owned.wearables).toContain('beret');
    expect(r.album[0].title).toBe('לוק מסיבה');
    expect(r.outfits[client.dogId].head?.itemId).toBe('beret');
    expect(getStats(r.learning, factKey(wrongStep.a, wrongStep.b)).wrong).toBe(1);

    // next day: the mistaken fact is scheduled back
    const next = planRound(r.learning, r.settings.tables, T0 + 86400_000, rng);
    expect(next.mode).toBe('scheduled');
    const keys = next.steps.filter((x): x is QuestionStep => x.type === 'question').map((q) => q.key);
    expect(keys).toContain(wrongStep.key);
  });
});
