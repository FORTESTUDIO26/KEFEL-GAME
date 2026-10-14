import { describe, expect, it } from 'vitest';
import { buildHints, buildMissingHints, splitMath } from './hints';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TricksContent, recordTrickExposure } from '../screens/Tricks';
import { defaultSave } from '../state/save';
import { recordAnswer } from '../state/game';
import { dayKey } from './scheduler';

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
    const [h1, h2, h3] = buildHints(7, 7, none);
    expect(h1.text).toContain('5 × 7');
    expect(h1.text).toContain('2 × 7');
    expect(h1.visual).toEqual({ rows: 7, cols: 7, split: 5, dir: 'rows' });
    expect(h2.text).toContain('35 + 14 = ?');
    expect(h3.text).toContain('35 + 14 = 49');
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

  it('uses a known five anchor in either displayed orientation', () => {
    for (const [a, b, anchor, rest] of [[7, 6, '5 × 6 = 30', '2 × 6'], [6, 7, '6 × 5 = 30', '6 × 2']] as const) {
      const [first, , last] = buildHints(a, b, (x, y) => x * y === 30);
      expect(first.text).toContain(anchor);
      expect(first.text).toContain(rest);
      expect(last.text).toContain(`${a} × ${b} = 42`);
    }
  });

  it('doubles for four and eight without presenting a final answer early', () => {
    for (const [a, b] of [[4, 7], [7, 4], [8, 7], [7, 8]]) {
      const hints = buildHints(a, b, none);
      expect(hints[0].text).toContain('מכפילים');
      expect(hints[1].text).toContain('= ?');
      expect(hints[2].text).toContain(`${a} × ${b} = ${a * b}`);
    }
  });

  it('still prefers a known neighbour to a table trick', () => {
    expect(buildHints(9, 7, (a, b) => a === 9 && b === 6)[0].text).toContain('9 × 6 = 54');
  });

  it('connects a missing factor to division in the right direction', () => {
    const hints = buildMissingHints(6, 7);
    expect(hints[0].text).toContain('42 ÷ 6 = ?');
    expect(hints[0].text).not.toContain('42 ÷ 7');
    expect(hints[2].text).toContain('42 ÷ 6 = 7');
  });

  it('renders freely available Hebrew cards with isolated left-to-right equations', () => {
    const html = renderToStaticMarkup(createElement(TricksContent, { onGo: () => {}, onExpose: () => {} }));
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('<bdi dir="ltr" class="eq ">6 × 7 = 7 × 6 = 42</bdi>');
    expect(html).toContain('<bdi dir="ltr" class="eq ">42 ÷ 6 = 7</bdi>');
    expect(html.match(/<article /g)).toHaveLength(7);
    expect(html).toContain('שליפה עצמאית');
    expect(html).toContain('הסתירי');
    expect(html).toContain('ללא מטבעות');
    expect(html.match(/<details/g)).toHaveLength(6);
    expect(html).not.toContain('<details open');
  });

  it('returns from the tricks screen to actual learning navigation', () => {
    const destinations: string[] = [];
    const screen = TricksContent({ onGo: (destination) => destinations.push(destination), onExpose: () => {} });
    const button = screen.props.children[2];
    button.props.onClick();
    expect(destinations).toEqual(['learn']);
  });

  it('records no unopened examples and records all answers exposed in a card', () => {
    const exposures: number[][] = [];
    const screen = TricksContent({ onGo: () => {}, onExpose: (a, b) => exposures.push([a, b]) });
    expect(exposures).toEqual([]);
    const cards = screen.props.children[1].props.children[0];
    const details = cards[4].props.children[2];
    details.props.onToggle({ currentTarget: { open: false } });
    expect(exposures).toEqual([]);
    details.props.onToggle({ currentTarget: { open: true } });
    expect(exposures).toEqual([[7, 8],[7,2],[7,4]]);
  });

  it('reading a trick preserves earned mastery and its scheduled interval',()=>{
    const now=new Date(2026,9,14,12).getTime();let save=defaultSave(now);
    for(let day=5;day>0;day--)save=recordAnswer(save,{a:7,b:8,outcome:'independent',usedHint:false},now-day*86400000);
    const before=save.learning.facts['7x8'];const after=recordTrickExposure(save,7,8,now).learning.facts['7x8'];
    expect(after.stage).toBe(before.stage);expect(after.nextDue).toBe(before.nextDue);
    expect(after.state).toBe(before.state);expect(after.cleanDays).toEqual(before.cleanDays);expect(after.streak).toBe(before.streak);
    expect(after.lastMissDay).toBe(dayKey(now));
  });

  it('marks only a disclosed target as supported and prevents same-day independent copy in either order', () => {
    const now = new Date(2026, 9, 14, 12).getTime();
    const exposed = recordTrickExposure(defaultSave(now), 7, 8, now);
    expect(Object.keys(exposed.learning.facts)).toEqual(['7x8']);
    expect(exposed.learning.facts['7x8'].supported).toBe(1);
    expect(recordTrickExposure(exposed, 8, 7, now + 1)).toBe(exposed);
    const copied = recordAnswer(exposed, { a: 8, b: 7, outcome: 'independent', usedHint: false }, now + 1000);
    expect(copied.learning.facts['7x8'].independentCorrect).toBe(0);
    expect(copied.learning.facts['7x8'].afterHelpCorrect).toBe(1);
    expect(copied.learning.daily[dayKey(now)].independent).toBe(0);
    const tomorrow = new Date(2026, 9, 15, 12).getTime();
    expect(recordTrickExposure(copied, 7, 8, tomorrow).learning.facts['7x8'].supported).toBe(2);
  });
});
