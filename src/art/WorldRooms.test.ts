import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PALETTES } from '../content/catalog';
import type { RoomId } from '../state/types';
import { RoomScenery, RoomThumbnail } from './WorldRooms';
const rooms = ['studio','dressing','garden','stage','cafe','craft','kitchen','bathroom'] as const;
describe('wide dollhouse architecture', () => {
 it.each(rooms)('%s has two decorated wings, original center coordinates and a full-width clip', id => {
  const html=renderToStaticMarkup(createElement('svg',null,createElement(RoomScenery,{id:id as RoomId,wall:'wall_hearts',floor:'floor_tiles',p:PALETTES[0]})));
  expect(html).toContain('x="-800"');expect(html).toContain('width="2400"');expect(html).toContain('height="500"');
  expect(html).toContain('data-room-wing="left"');expect(html).toContain('data-room-wing="right"');
  expect(html).toContain('transform="translate(-400 0)"');expect(html).toContain('transform="translate(800 0)"');
  expect(html).toContain('data-room-center="'+id+'"');expect(html).toContain('pointer-events="none"');
  expect(html).not.toContain('undefined');expect(html).not.toContain('NaN');
  expect((html.match(/<path /g)||[]).length).toBeGreaterThan(25);
 });
 it.each(rooms)('%s thumbnail shows all 1600 horizontal room units',id=>{
  const html=renderToStaticMarkup(createElement(RoomThumbnail,{id:id as RoomId,p:PALETTES[0]}));
  expect(html).toContain('viewBox="-400 0 1600 500"');expect(html).toMatch(/aria-label="[א-ת]/);
 });
 it('keeps the original central studio doorway and stage mat in place',()=>{
  const studio=renderToStaticMarkup(createElement(RoomThumbnail,{id:'studio',p:PALETTES[0]}));
  const stage=renderToStaticMarkup(createElement(RoomThumbnail,{id:'stage',p:PALETTES[0]}));
  expect(studio).toContain('M23 320V135');expect(stage).toContain('M130 347H670L755 481H45Z');
 });
 it('uses unique paint servers for multiple mounted thumbnails',()=>{
  const html=renderToStaticMarkup(createElement('svg',null,...rooms.map(id=>createElement(RoomThumbnail,{key:id,id:id as RoomId,p:PALETTES[0]}))));
  const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);expect(new Set(ids).size).toBe(ids.length);
 });
});

it.each(['kitchen','bathroom'] as const)('%s has original household center and wings',id=>{const html=renderToStaticMarkup(createElement(RoomThumbnail,{id:id as RoomId,p:PALETTES[0]}));expect(html).toContain('data-household-center="'+id+'"');expect(html.match(/data-household-wing=/g)).toHaveLength(2);});
