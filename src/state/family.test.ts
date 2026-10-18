import { describe, expect, it } from 'vitest';
import { FAMILY, FAMILY_HEIGHTS, familyById, familySize } from '../content/family';
import { addCharacter, characterName, characterOf, FAMILY_PREFIX } from './characters';
import { removePlaced, updatePlaced } from './game';
import { resolveDrop } from './placement';
import { defaultSave, validateSave } from './save';

const NOW = new Date(2026, 9, 18, 12).getTime();
const base = () => {
  const s = defaultSave(NOW);
  return { ...s, profile: { ...s.profile, onboarded: true } };
};
const add = (s: ReturnType<typeof base>, id: string, t = NOW) => addCharacter(s, FAMILY_PREFIX + id, t);

describe('the family illustrations', () => {
  it('has the six family members with their Hebrew names (names are UI, not in the images)', () => {
    expect(FAMILY.map((m) => [m.id, m.name])).toEqual([
      ['lidor', 'אבא'],
      ['sharon', 'אמא'],
      ['lior', 'ליאור'],
      ['noa', 'נועה'],
      ['amit', 'עמית'],
      ['yonatan_shai', 'יונתן שי'],
    ]);
  });

  it('keeps the requested height order', () => {
    const H = FAMILY_HEIGHTS;
    expect(H.lidor).toBeGreaterThan(H.sharon);
    expect(H.sharon).toBeGreaterThan(H.lior);
    expect(H.lior).toBeGreaterThan(H.noa);
    expect(H.noa).toBeGreaterThan(H.amit);
    expect(H.amit).toBeGreaterThan(H.yonatan_shai);
  });

  it('never stretches an image: width follows the image aspect ratio', () => {
    for (const m of FAMILY) {
      const { w, h } = familySize(m);
      expect(w / h).toBeCloseTo(m.px.w / m.px.h, 6);
      expect(h).toBe(FAMILY_HEIGHTS[m.id]);
    }
  });

  it('can be added, saved, reloaded and removed, and is never mirrored', () => {
    let s = base();
    FAMILY.forEach((m, i) => (s = add(s, m.id, NOW + i)));
    const placed = s.studio.items.filter((p) => characterOf(p.itemId)?.kind === 'family');
    expect(placed).toHaveLength(6);
    for (const p of placed) expect(p.flip).toBe(false);
    expect(characterName(FAMILY_PREFIX + 'yonatan_shai')).toBe('יונתן שי');
    const v = validateSave(JSON.parse(JSON.stringify(s)), NOW);
    expect(v.ok && v.data.studio.items.filter((p) => p.itemId.startsWith(FAMILY_PREFIX))).toHaveLength(6);
    // learning, coins and purchases are untouched
    expect(s.learning).toEqual(base().learning);
    expect(s.coins).toBe(base().coins);
    expect(s.owned).toEqual(base().owned);
    const lior = s.studio.items.find((p) => p.itemId === FAMILY_PREFIX + 'lior')!;
    s = removePlaced(s, lior.uid);
    expect(s.studio.items.some((p) => p.itemId === FAMILY_PREFIX + 'lior')).toBe(false);
  });

  it('stands on the floor: a family figure never snaps onto a sofa', () => {
    let s = add(base(), 'sharon');
    const sofa = s.studio.items.find((p) => p.itemId === 'sofa')!;
    const sharon = s.studio.items.find((p) => p.itemId === FAMILY_PREFIX + 'sharon')!;
    expect(resolveDrop(s.studio, sharon.uid, { x: sofa.x, y: sofa.y - 62 }).supportUid).toBeUndefined();
    s = updatePlaced(s, sharon.uid, { x: 500 });
    expect(s.studio.items.find((p) => p.uid === sharon.uid)!.x).toBe(500);
  });

  it('ignores unknown family ids from a damaged save', () => {
    expect(familyById('someone')).toBeUndefined();
    expect(characterOf(FAMILY_PREFIX + 'someone')).toBeNull();
  });
});
