import { describe, expect, it } from 'vitest';
import { buildHints, buildMissingHints, splitMath } from './hints';

const none = () => false;

describe('hints', () => {
  it('prefers a fact she already knows (7×7 → 7×8)', () => {
    const known = (x: number, y: number) => x === 7 && y === 7;
    const [h1, , h3] = buildHints(7, 8, known);
    expect(h1.text).toContain('7 × 7 = 49');
    expect(h1.text).toContain('נוסיף עוד');
    expect(h1.text).not.toContain('56');
    expect(h3.reveals).toBe(true);
    expect(h3.text).toContain('7 × 8 = 56');
  });

  it('falls back to a simple split with a picture when no known fact fits', () => {
    const [h1, h2, h3] = buildHints(7, 8, none);
    expect(h1.text).toContain('5 × 8');
    expect(h1.text).toContain('2 × 8');
    expect(h1.visual).toEqual({ rows: 7, cols: 8, split: 5, dir: 'rows' });
    expect(h2.text).toContain('40 + 16 = ?');
    expect(h3.text).toContain('40 + 16 = 56');
  });

  it('does not reveal the answer before the last level', () => {
    for (let a = 1; a <= 10; a++)
      for (let b = 1; b <= 10; b++) {
        const hints = buildHints(a, b, none);
        expect(hints).toHaveLength(3);
        expect(hints[0].reveals).toBeFalsy();
        expect(hints[1].reveals).toBeFalsy();
        expect(hints[2].text).toContain(`= ${a * b}`);
      }
  });

  it('keeps the shown order of the question', () => {
    const [h1] = buildHints(8, 7, (x, y) => x === 8 && y === 6);
    expect(h1.text).toContain('8 × 6 = 48');
  });

  it('missing-factor hints end with the explained answer', () => {
    const hints = buildMissingHints(6, 7);
    expect(hints[2].text).toContain('6 × 7 = 42');
    expect(hints[0].reveals).toBeFalsy();
  });

  it('splits math segments for left-to-right display', () => {
    expect(splitMath('אם [[7 × 7 = 49]], עוד [[7]]?')).toEqual([
      { math: false, value: 'אם ' },
      { math: true, value: '7 × 7 = 49' },
      { math: false, value: ', עוד ' },
      { math: true, value: '7' },
      { math: false, value: '?' },
    ]);
  });
});
