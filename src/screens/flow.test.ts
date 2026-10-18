// The daily loop screens show the player's real data.
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StoreProvider } from '../state/store';
import { defaultSave } from '../state/save';
import { applyOutcome } from '../learning/data';
import { addDays } from '../learning/scheduler';
import { Home } from './Home';
import { PlayBalance } from '../ui/PlayBalance';
import type { SaveData } from '../state/types';

const NOW = new Date(2026, 9, 18, 16).getTime();
const base = (): SaveData => {
  const s = defaultSave(NOW);
  return { ...s, coins: 230, profile: { ...s.profile, onboarded: true } };
};
const render = (initial: SaveData, el: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(createElement(StoreProvider, { initial, storage: null, children: el }));

describe('home screen', () => {
  it('shows the current table with real progress, coins, design time and the next room', () => {
    let s = base();
    // two ×3 facts remembered alone on two different days
    for (const [a, b] of [[3, 3], [3, 4]]) {
      s = { ...s, learning: applyOutcome(s.learning, { a, b, outcome: 'independent', usedHint: false }, addDays(NOW, -3)) };
      s = { ...s, learning: applyOutcome(s.learning, { a, b, outcome: 'independent', usedHint: false }, addDays(NOW, -1)) };
    }
    s = { ...s, playTime: { ...s.playTime, usedMs: 4 * 60_000 } };
    const html = render(s, createElement(Home, { onGo: () => {}, playerName: 'ליאורי' }));
    expect(html).toContain('כפולת 3');
    expect(html).toContain('2/8');
    expect(html).toContain('230');
    expect(html).toContain('6 דקות');
    expect(html).toContain('מתחילות ללמוד');
    expect(html).toContain('חדר הלבשה');
    // the house map: every table with the room it opens
    expect(html).toContain('house-step current');
    expect(html).toContain('המטבח המתוק');
  });

  it('says when design time is over and that a lesson adds 10 minutes', () => {
    const s = { ...base(), playTime: { usedMs: 10 * 60_000, limitMin: 10, warned: true } };
    const html = render(s, createElement(Home, { onGo: () => {}, playerName: 'ליאורי' }));
    expect(html).toContain('שיעור = עוד 10 דק׳');
  });
});

describe('time is up in the room', () => {
  it('stops editing with one clear button: "לומדות ומקבלות עוד 10 דקות"', () => {
    const s = { ...base(), playTime: { usedMs: 10 * 60_000, limitMin: 10, warned: true } };
    const html = render(s, createElement(PlayBalance, { screen: 'studio', onGo: () => {} }));
    expect(html).toContain('play-lock');
    expect(html).toContain('לומדות ומקבלות עוד 10 דקות');
    expect(html).toContain('העיצוב נשמר');
  });

  it('shows a gentle note when two minutes are left', () => {
    const s = { ...base(), playTime: { usedMs: 8 * 60_000 + 30_000, limitMin: 10, warned: false } };
    const html = render(s, createElement(PlayBalance, { screen: 'studio', onGo: () => {} }));
    expect(html).toContain('play-warn');
    expect(html).toContain('עוד כ־');
  });

  it('is not shown outside designing (a lesson, the home screen)', () => {
    const s = { ...base(), playTime: { usedMs: 10 * 60_000, limitMin: 10, warned: true } };
    expect(render(s, createElement(PlayBalance, { screen: 'learn', onGo: () => {} }))).toBe('');
    expect(render(s, createElement(PlayBalance, { screen: 'home', onGo: () => {} }))).toBe('');
  });
});
