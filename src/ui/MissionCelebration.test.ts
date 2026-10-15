import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CelebrationParticles, MissionCelebration, CELEBRATION_MS } from './MissionCelebration';
import { StoreProvider } from '../state/store';
import { defaultSave } from '../state/save';
import { RARE_ITEMS } from '../content/catalog';

describe('mission celebration',()=>{
 it('renders a full burst of original decorative SVG shapes',()=>{
  const html=renderToStaticMarkup(createElement(CelebrationParticles));
  expect((html.match(/<svg /g)||[])).toHaveLength(64);
  expect((html.match(/mission-star/g)||[])).length.greaterThan(16);
  expect(html).toContain('aria-hidden="true"');
  expect(html).not.toContain('✦');
  expect(html).not.toMatch(/NaN|undefined/);
 });
 it('uses static stars for the saved reduced-motion preference',()=>{
  const save=defaultSave(1); save.settings.reduceMotion=true;
  const html=renderToStaticMarkup(createElement(StoreProvider,{initial:save,storage:null,children:createElement(MissionCelebration,{gift:null})}));
  expect(html).toContain('mission-effects-static');
  expect(html).toContain('כל האוסף הנדיר כבר שלך');
 });
 it('preserves reward preview and never changes ownership during rendering',()=>{
  const save=defaultSave(1),before=JSON.stringify(save),item=RARE_ITEMS[0];
  const html=renderToStaticMarkup(createElement(StoreProvider,{initial:save,storage:null,children:createElement(MissionCelebration,{gift:{...item,missionId:'test',at:1}})}));
  expect(html).toContain('gift-preview');
  expect(html).toContain('נוסף לאוסף שלך');
  expect(JSON.stringify(save)).toBe(before);
 });
 it('keeps the same stars and removes motion through an explicit reduced mode',()=>{
  const animated=renderToStaticMarkup(createElement(CelebrationParticles));
  const reduced=renderToStaticMarkup(createElement(CelebrationParticles,{reduced:true}));
  expect(CELEBRATION_MS).toBe(3000);
  expect(animated).not.toContain('mission-effects-static');
  expect(reduced).toContain('mission-effects-static');
  expect((reduced.match(/mission-star/g)||[])).toHaveLength((animated.match(/mission-star/g)||[]).length);
 });
});
