import { describe, expect, it } from 'vitest';
import { completeLearnSession, startLearnSession } from './game';
import { grantPlay, IDLE_MS, MAX_TICK_MS, playStatus, setPlayLimit, tickPlay, WARN_BEFORE_MS } from './playTime';
import { defaultSave, sanitize } from './save';

const NOW = new Date(2026, 9, 14, 16, 0).getTime();
const active = { visible: true, designing: true, idleMs: 1000 };

function playFor(s: ReturnType<typeof defaultSave>, ms: number, ctx = active) {
  for (let t = 0; t < ms; t += 5000) s = tickPlay(s, 5000, ctx);
  return s;
}

describe('design / learning balance', () => {
  it('counts active design time only', () => {
    let s = defaultSave(NOW);
    s = playFor(s, 60_000);
    expect(s.playTime.usedMs).toBe(60_000);
    // hidden tab, learning / parent screens, or a long pause do not count
    expect(tickPlay(s, 5000, { ...active, visible: false })).toBe(s);
    expect(tickPlay(s, 5000, { ...active, designing: false })).toBe(s);
    expect(tickPlay(s, 5000, { ...active, idleMs: IDLE_MS + 1 })).toBe(s);
    // a page that slept is never counted in one big jump
    expect(tickPlay(s, 10 * 60_000, active).playTime.usedMs).toBe(60_000 + MAX_TICK_MS);
  });

  it('warns 2 minutes before, then stops after 10 minutes', () => {
    let s = playFor(defaultSave(NOW), 8 * 60_000 - 5000);
    expect(playStatus(s.playTime).warn).toBe(false);
    s = playFor(s, 5000);
    expect(playStatus(s.playTime)).toMatchObject({ warn: true, locked: false, remainingMs: WARN_BEFORE_MS });
    s = playFor(s, 2 * 60_000);
    expect(playStatus(s.playTime).locked).toBe(true);
    // nothing more is counted while stopped
    expect(tickPlay(s, 5000, active)).toBe(s);
  });

  it('survives a reload (the counter does not restart)', () => {
    const s = playFor(defaultSave(NOW), 7 * 60_000);
    const reloaded = sanitize(JSON.parse(JSON.stringify(s)), NOW);
    expect(reloaded.playTime.usedMs).toBe(7 * 60_000);
  });

  it('a completed learning session (even with help) opens another period', () => {
    let s = playFor({ ...defaultSave(NOW), profile: { ...defaultSave(NOW).profile, onboarded: true } }, 10 * 60_000);
    expect(playStatus(s.playTime).locked).toBe(true);
    s = startLearnSession(s, NOW);
    const session = { ...s.learning.learnSession!, helped: 6, alone: 0 };
    s = completeLearnSession(s, session, NOW + 60_000).save;
    expect(playStatus(s.playTime)).toMatchObject({ locked: false, remainingMs: 10 * 60_000 });
  });

  it('parents can change the length or switch it off', () => {
    let s = setPlayLimit(defaultSave(NOW), 20);
    s = playFor(s, 15 * 60_000);
    expect(playStatus(s.playTime).locked).toBe(false);
    s = setPlayLimit(s, 0);
    expect(playStatus(s.playTime).limited).toBe(false);
    expect(tickPlay(s, 5000, active)).toBe(s);
    expect(setPlayLimit(s, 7).playTime.limitMin).toBe(10);
    expect(grantPlay(s).playTime.usedMs).toBe(0);
  });
});
