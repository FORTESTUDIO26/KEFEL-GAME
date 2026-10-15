import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DOGS } from '../content/dogs';
import { WEARABLES } from '../content/catalog';
import { DogFigure } from './Dog';
import { dogLifeCss as css } from './test-helpers/dogCss.mjs';

const moods = ['idle', 'happy', 'pet', 'sit', 'sleep', 'shake'] as const;
describe('living dog art', () => {
  for (const dog of DOGS) for (const mood of moods) {
    it(`${dog.id}: ${mood} keeps every body outfit valid`, () => {
      const html = renderToStaticMarkup(createElement('svg', null,
        ...WEARABLES.filter(item => item.slot === 'body').map(item =>
          createElement(DogFigure, { key: item.id, dog, mood, asGroup: true, outfit: { body: { itemId: item.id, color: item.color } } }))));
      expect(html).toContain(`dog-mood-${mood}`);
      expect(html).toContain('data-foot-anchor="120,240"');
      expect(html).not.toMatch(/NaN|undefined|Infinity/);
      const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
      expect(new Set(ids).size).toBe(ids.length);
      for (const ref of html.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref[1]);
      for (const size of html.matchAll(/ (?:r|rx|ry|width|height)="(-?[\d.]+)"/g)) expect(Number(size[1])).toBeGreaterThanOrEqual(0);
      if (mood === 'sleep' || mood === 'pet') expect(html).toContain('dog-eyes-closed');
      if (mood === 'sleep') expect(html).toContain('dog-sleep-z');
      if (mood === 'shake') expect(html).toContain('dog-water-drop');
    });
  }
  it('defaults to idle and preserves embedding and standalone props', () => {
    const group = renderToStaticMarkup(createElement(DogFigure, { dog: DOGS[0], asGroup: true, className: 'custom' }));
    expect(group).toMatch(/^<g class="dog dog-mood-idle custom"/);
    expect(group).not.toContain('<svg');
    const svg = renderToStaticMarkup(createElement(DogFigure, { dog: DOGS[0], title: 'Friend', className: 'preview' }));
    expect(svg).toContain('aria-label="Friend"');
    expect(svg).toContain('class="preview"');
  });
  it('keeps every outfit slot and decal inside the same pose and motion frame', () => {
    const outfit = Object.fromEntries(['head', 'eyes', 'neck', 'body', 'feet', 'back', 'prop'].map(slot => {
      const item = WEARABLES.find(item => item.slot === slot)!;
      return [slot, { itemId: item.id, color: item.color }];
    }));
    for (const mood of moods) {
      const html = renderToStaticMarkup(createElement('svg', null,
        createElement(DogFigure, { dog: DOGS[DOGS.length - 1], mood, outfit, asGroup: true })));
      expect(html).toContain('<g class="dog-life-motion"><g class="dog-life-pose"');
      expect(html).not.toMatch(/NaN|undefined|Infinity/);
      if (mood === 'sit' || mood === 'sleep') expect(html).toContain('translate(120 240) scale(');
      else expect(html).toContain('<g class="dog-life-pose">');
      expect(html).not.toMatch(/^<svg><g[^>]* (?:style|transform)=/);
    }
  });
  it('disables inner animation for both reduced motion preferences without moving the wrapper', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('.reduce-motion .dog');
    expect(css).toContain('animation: none !important');
    expect(css).not.toMatch(/\.dog\s*\{[^}]*transform:/);
    expect(css).toContain('.dog-mood-happy .dog-life-motion');
    expect(css).toContain('.dog-mood-sleep .dog-life-motion');
  });
});
