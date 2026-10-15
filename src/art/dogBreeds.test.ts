import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DOGS, STARTER_DOG_IDS, dogById, type DogDef } from '../content/dogs';
import { WEARABLES } from '../content/catalog';
import { DOG_MOODS, DogFigure, rigFor, type DogMood } from './Dog';
import { dogLifeCss as css } from './test-helpers/dogCss.mjs';

const NEW_DOG_IDS = ['mochi', 'mufi', 'chips', 'shalgit', 'pierre', 'rosie'];
const ALL_MOODS: DogMood[] = ['idle', 'happy', 'pet', 'sit', 'sleep', 'shake', 'walk', 'wag', 'play'];
const newDogs = NEW_DOG_IDS.map((id) => DOGS.find((d) => d.id === id)!);
const signature = (d: DogDef) => [d.build, d.ears, d.pattern, d.tail, d.muzzle ?? 'normal', d.fluffy ? 'fluffy' : '', d.curly ? 'curly' : '', d.topknot ? 'topknot' : ''].join('/');

const fullOutfit = Object.fromEntries(['head', 'eyes', 'neck', 'body', 'feet', 'back', 'prop'].map((slot) => {
  const item = WEARABLES.find((w) => w.slot === slot && !w.baseId)!;
  return [slot, { itemId: item.id, color: item.color }];
}));

const render = (dog: DogDef, mood: DogMood, outfit = {}) =>
  renderToStaticMarkup(createElement('svg', null, createElement(DogFigure, { dog, mood, outfit, asGroup: true })));

/** Split markup into the dog-life-motion group and everything outside it. */
function splitMotion(html: string): { inside: string; outside: string } {
  const open = '<g class="dog-life-motion">';
  const start = html.indexOf(open);
  expect(start).toBeGreaterThan(-1);
  const tags = /<g[\s>]|<\/g>/g;
  tags.lastIndex = start + 2;
  let depth = 1;
  let end = -1;
  for (let m = tags.exec(html); m; m = tags.exec(html)) {
    depth += m[0] === '</g>' ? -1 : 1;
    if (depth === 0) { end = m.index + 4; break; }
  }
  expect(end).toBeGreaterThan(start);
  return { inside: html.slice(start, end), outside: html.slice(0, start) + html.slice(end) };
}

describe('new dog breeds', () => {
  it('adds six new dogs with unique ids and Hebrew names, all choosable as the studio dog', () => {
    expect(newDogs.every(Boolean)).toBe(true);
    expect(new Set(DOGS.map((d) => d.id)).size).toBe(DOGS.length);
    expect(new Set(DOGS.map((d) => d.name)).size).toBe(DOGS.length);
    for (const d of newDogs) {
      expect(d.name).toMatch(/^[֐-׿׳"' ]+$/);
      expect(d.breed).toMatch(/[֐-׿]/);
      expect(d.personality.length).toBeGreaterThan(10);
      expect(typeof d.female).toBe('boolean');
      expect(STARTER_DOG_IDS).toContain(d.id);
      expect(dogById(d.id)).toBe(d);
    }
    for (const id of STARTER_DOG_IDS) expect(DOGS.some((d) => d.id === id)).toBe(true);
  });

  it('keeps the original dogs and their looks', () => {
    expect(DOGS.slice(0, 11).map((d) => d.id)).toEqual(['bosko', 'mika', 'pitzi', 'lola', 'ginji', 'shoko', 'nela', 'beigel', 'paprika', 'zaza', 'kakao']);
    expect(signature(dogById('nela'))).toBe('large/pointy/mask/curl/normal///');
    expect(signature(dogById('kakao'))).toBe('small/curly/none/pom/normal//curly/topknot');
  });

  it('gives every dog a distinct visual signature and distinct artwork', () => {
    const sigs = DOGS.map(signature);
    expect(new Set(sigs).size).toBe(sigs.length);
    const arts = DOGS.map((d) => render({ ...d, fur: '#888888', furDark: '#444444', light: '#cccccc', eye: '#000000' }, 'idle'));
    expect(new Set(arts).size).toBe(arts.length);
  });

  it('uses only the existing body rigs so every clothing item still fits', () => {
    const rigs = new Set(DOGS.filter((d) => !NEW_DOG_IDS.includes(d.id)).map((d) => JSON.stringify(rigFor(d))));
    for (const d of newDogs) expect(rigs.has(JSON.stringify(rigFor(d))), d.id).toBe(true);
  });
});

describe('dog moods', () => {
  it('exports a Hebrew label for every mood', () => {
    expect(DOG_MOODS.map((m) => m.id).sort()).toEqual([...ALL_MOODS].sort());
    for (const m of DOG_MOODS) expect(m.label).toMatch(/[֐-׿]/);
  });

  for (const dog of DOGS) {
    it(`${dog.id} renders cleanly in every mood, bare and dressed`, () => {
      for (const mood of ALL_MOODS) for (const outfit of [{}, fullOutfit]) {
        const html = render(dog, mood, outfit);
        expect(html).toContain(`dog-mood-${mood}`);
        expect(html).toContain('data-foot-anchor="120,240"');
        expect(html).not.toMatch(/NaN|undefined|Infinity|null/);
        const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
        expect(new Set(ids).size).toBe(ids.length);
        for (const ref of html.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref[1]);
      }
    });
  }

  it('keeps all clothing inside the moving group in every mood', () => {
    for (const dog of DOGS) for (const mood of ALL_MOODS) {
      const bare = splitMotion(render(dog, mood));
      const dressed = splitMotion(render(dog, mood, fullOutfit));
      // nothing the outfit adds may live outside the motion group
      expect(dressed.outside, `${dog.id}/${mood}`).toBe(bare.outside);
      expect(dressed.inside.length).toBeGreaterThan(bare.inside.length);
      expect(dressed.inside).toMatch(/^<g class="dog-life-motion"><g class="dog-life-pose"/);
    }
  });

  it('shows each mood even as a still picture', () => {
    const dog = dogById('chips');
    expect(render(dog, 'pet')).toContain('dog-pet-heart');
    expect(render(dog, 'pet')).toContain('dog-eyes-closed');
    expect(render(dog, 'play')).toContain('dog-play-ball');
    expect(render(dog, 'play')).toContain('rotate(-5)');
    expect(render(dog, 'walk')).toContain('dog-walk-dust');
    expect(render(dog, 'walk')).toContain('rotate(-2.5)');
    expect(render(dog, 'wag')).toContain('dog-wag-lines');
    expect(render(dog, 'shake')).toContain('dog-water-drop');
    expect(render(dog, 'sleep')).toContain('dog-sleep-z');
  });

  it('keeps the default mood and props backward compatible', () => {
    const html = renderToStaticMarkup(createElement(DogFigure, { dog: dogById('rosie'), asGroup: true }));
    expect(html).toMatch(/^<g class="dog dog-mood-idle"/);
  });
});

describe('dog animation CSS', () => {
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...plain.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '').replace(/@media[^{]+\{/g, '').matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .map((m) => ({ selector: m[1].trim(), body: m[2] }));
  const animated = rules.filter((r) => /animation:\s*(?!none)\S/.test(r.body));
  const targets = new Set(animated.flatMap((r) => r.selector.split(',').map((s) => s.trim().split(/\s+/).pop()!)));

  it('animates every new mood', () => {
    for (const mood of ['walk', 'wag', 'pet', 'play']) expect(css).toContain(`.dog-mood-${mood} .dog-life-motion`);
    expect(css).toMatch(/\.dog-mood-wag \.dog-tail\s*\{\s*animation:/);
  });

  it('only animates groups that carry no loose clothing (motion group, tail, eyes, mood marks)', () => {
    const allowed = ['.dog-life-motion', '.dog-tail', '.dog-eyes', '.dog-water-drop', '.dog-sleep-z', '.dog-walk-dust', '.dog-pet-heart', '.dog-play-ball'];
    expect(targets.size).toBeGreaterThanOrEqual(6);
    expect(targets).toContain('.dog-play-ball');
    for (const t of targets) expect(allowed, t).toContain(t);
  });

  it('uses only transform and opacity in keyframes', () => {
    for (const block of css.matchAll(/@keyframes[^{]+\{((?:[^{}]*\{[^}]*\})*)[^}]*\}/g)) {
      for (const decl of block[1].matchAll(/([a-z-]+)\s*:/g)) expect(['transform', 'opacity']).toContain(decl[1]);
    }
  });

  it('turns every animation off for both reduced-motion preferences', () => {
    const media = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(media.length).toBeGreaterThan(30);
    const reduceRule = rules.find((r) => r.selector.includes('.reduce-motion') && r.body.includes('animation: none !important'))!;
    expect(reduceRule).toBeTruthy();
    for (const t of targets) {
      expect(reduceRule.selector, t).toContain(`.reduce-motion .dog ${t}`);
      expect(media, t).toContain(`.dog ${t}`);
    }
    expect(media).toContain('animation: none !important');
  });
});
