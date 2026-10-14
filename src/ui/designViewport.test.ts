import { describe,expect,it } from 'vitest';
import { boundedZoom, designViewBox } from './designViewport';
describe('design scene zoom',()=>{
  it('keeps magnification inside usable limits and handles invalid input',()=>{
    expect(boundedZoom(-2)).toBe(1);expect(boundedZoom(20)).toBe(2.5);expect(boundedZoom(Number.NaN)).toBe(1);
  });
  it('keeps the original scene at normal size and zooms around its centre',()=>{
    expect(designViewBox(1,{x:0,y:0,width:800,height:500},400,250)).toBe('0 0 800 500');
    expect(designViewBox(2,{x:0,y:0,width:800,height:500},400,250)).toBe('200 125 400 250');
  });
  it('panning cannot expose empty space beyond the room edges',()=>{
    expect(designViewBox(2,{x:0,y:0,width:800,height:500},-100,1000)).toBe('0 250 400 250');
    expect(designViewBox(2,{x:-40,y:-60,width:320,height:330},120,105)).toBe('40 22.5 160 165');
  });
  it('fills a portrait room viewport without stretching furniture or losing pan bounds',()=>{
    expect(designViewBox(1,{x:0,y:0,width:800,height:500},400,250,.5)).toBe('275 0 250 500');
    expect(designViewBox(1,{x:0,y:0,width:800,height:500},800,250,.5)).toBe('550 0 250 500');
  });
});
