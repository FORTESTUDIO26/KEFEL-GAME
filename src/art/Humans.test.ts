import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HUMAN_SLOT_LABEL, HUMAN_WEARABLES, HUMANS, humanById, humanWearableById, type HumanSlot } from '../content/humans';
import { HUMAN_SEAT_DROP, HumanFigure, humanSize, type HumanPose } from './Humans';

const poses: HumanPose[] = ['stand', 'sit', 'wave'];
const slots: HumanSlot[] = ['hair', 'top', 'bottom', 'shoes', 'accessory'];

function render(el: ReturnType<typeof createElement>) {
  // group renders are wrapped in an <svg> so React knows they are SVG elements
  const html = renderToStaticMarkup((el.props as { asGroup?: boolean }).asGroup ? createElement('svg', null, el) : el);
  expect(html).not.toContain('NaN');
  expect(html).not.toContain('undefined');
  return html;
}

describe('human content', () => {
  it('has at least three humans with unique ids and Hebrew names', () => {
    expect(HUMANS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(HUMANS.map((h) => h.id)).size).toBe(HUMANS.length);
    for (const h of HUMANS) {
      expect(h.name).toMatch(/[א-ת]/);
      expect(h.description).toMatch(/[א-ת]/);
      expect(humanById(h.id)).toBe(h);
    }
    expect(HUMANS.some((h) => h.age === 'child')).toBe(true);
    expect(HUMANS.some((h) => h.age === 'adult')).toBe(true);
  });

  it('has ≥15 free wearables, ≥3 per slot, unique ids and Hebrew labels', () => {
    expect(HUMAN_WEARABLES.length).toBeGreaterThanOrEqual(15);
    expect(new Set(HUMAN_WEARABLES.map((w) => w.id)).size).toBe(HUMAN_WEARABLES.length);
    for (const s of slots) {
      expect(HUMAN_WEARABLES.filter((w) => w.slot === s).length).toBeGreaterThanOrEqual(3);
      expect(HUMAN_SLOT_LABEL[s]).toMatch(/[א-ת]/);
    }
    for (const w of HUMAN_WEARABLES) {
      expect(w.price).toBe(0);
      expect(w.name).toMatch(/[א-ת]/);
      expect(w.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(humanWearableById(w.id)).toBe(w);
    }
  });

  it('default outfits only reference existing wearables in the right slot', () => {
    for (const h of HUMANS) {
      for (const [slot, p] of Object.entries(h.defaultOutfit)) {
        const item = humanWearableById(p!.itemId);
        expect(item, `${h.id}.${slot}`).toBeDefined();
        expect(item!.slot).toBe(slot);
      }
    }
  });
});

describe('HumanFigure', () => {
  it.each(HUMANS.map((h) => h.id))('%s renders in every pose with default, empty and every single wearable', (id) => {
    const human = humanById(id)!;
    for (const pose of poses) {
      const def = render(createElement(HumanFigure, { human, pose, asGroup: true }));
      expect(def).toContain(`data-pose="${pose}"`);
      for (const [slot, p] of Object.entries(human.defaultOutfit)) expect(def).toContain(`data-slot="${slot}" data-item="${p!.itemId}"`);
      const bare = render(createElement(HumanFigure, { human, pose, outfit: {}, asGroup: true }));
      expect(bare).not.toContain('data-slot=');
      expect(bare).toContain('human-legs');
      for (const w of HUMAN_WEARABLES) {
        const html = render(createElement(HumanFigure, { human, pose, outfit: { [w.slot]: { itemId: w.id, color: '#123456' } }, asGroup: true }));
        expect(html).toContain(`data-item="${w.id}"`);
        expect(html).toContain('#123456');
      }
    }
  });

  it('sit pose keeps the legs and draws them down to the seat drop', () => {
    expect(HUMAN_SEAT_DROP).toBeGreaterThanOrEqual(60);
    expect(HUMAN_SEAT_DROP).toBeLessThanOrEqual(75);
    for (const human of HUMANS) {
      const html = render(createElement(HumanFigure, { human, pose: 'sit', asGroup: true }));
      expect(html).toContain('human-legs');
      expect(html).not.toContain('translate(0 -');
      expect(html).toContain(`,${(HUMAN_SEAT_DROP - 9).toFixed(1)}`);
      const stand = render(createElement(HumanFigure, { human, pose: 'stand', asGroup: true }));
      expect(stand).toContain(`translate(0 ${-(humanSize(human).h - (human.age === 'child' ? 154 : 181))})`);
    }
  });

  it('humanSize matches child and adult heights', () => {
    for (const h of HUMANS) {
      const s = humanSize(h);
      if (h.age === 'child') {
        expect(s.h).toBeGreaterThanOrEqual(230);
        expect(s.h).toBeLessThanOrEqual(260);
      } else {
        expect(s.h).toBeGreaterThanOrEqual(280);
        expect(s.h).toBeLessThanOrEqual(330);
      }
      expect(s.w).toBeGreaterThan(60);
      expect(s.w).toBeLessThan(s.h);
    }
  });

  it('wave pose has an animated arm and an open smile', () => {
    const html = render(createElement(HumanFigure, { human: HUMANS[0], pose: 'wave', asGroup: true }));
    expect(html).toContain('human-wave-arm');
    expect(render(createElement(HumanFigure, { human: HUMANS[0], pose: 'stand', asGroup: true }))).not.toContain('human-wave-arm');
  });

  it('standalone svg is an accessible image with a Hebrew label', () => {
    for (const pose of poses) {
      const html = render(createElement(HumanFigure, { human: HUMANS[1], pose }));
      expect(html).toMatch(/^<svg[^>]*viewBox="/);
      expect(html).toContain('role="img"');
      expect(html).toMatch(/aria-label="[א-ת]/);
    }
  });

  it('uses unique ids when several humans are on screen', () => {
    const html = render(
      createElement(
        'svg',
        null,
        ...HUMANS.flatMap((human) => poses.map((pose) => createElement(HumanFigure, { key: human.id + pose, human, pose, asGroup: true }))),
      ),
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
