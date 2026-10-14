import { describe,expect,it } from 'vitest';
import { boundedZoom, designViewBox, panCamera, pinchCamera } from './designViewport';
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
  it('fills a landscape phone, starts at the floor and permits viewing the ceiling',()=>{
    const room={x:0,y:0,width:800,height:500};
    expect(designViewBox(1,room,400,500,4)).toBe('0 300 800 200');
    expect(designViewBox(1,room,400,0,4)).toBe('0 0 800 200');
  });
});

describe('camera gesture geometry',()=>{
  const bounds={x:0,y:0,width:800,height:500};
  const camera={zoom:2,x:400,y:250};
  it('moves the scene with the finger and clamps both room edges',()=>{
    expect(panCamera(camera,bounds,{x:.1,y:-.2})).toEqual({zoom:2,x:360,y:300});
    expect(panCamera(camera,bounds,{x:10,y:-10})).toEqual({zoom:2,x:200,y:375});
  });
  it('starts panning from the visible clamped centre rather than an offscreen focus',()=>{
    expect(panCamera({zoom:1,x:400,y:500},bounds,{x:0,y:.1},4)).toEqual({zoom:1,x:400,y:380});
  });
  it('keeps the scene point beneath an off-centre pinch anchored',()=>{
    expect(pinchCamera({zoom:1,x:400,y:250},bounds,{x:.25,y:.4},{x:.25,y:.4},2)).toEqual({zoom:2,x:300,y:225});
  });
  it('combines midpoint translation and zoom using the bounded zoom',()=>{
    expect(pinchCamera(camera,bounds,{x:.5,y:.5},{x:.6,y:.4},4)).toEqual({zoom:2.5,x:368,y:270});
  });
  it('anchors an aspect-fitted pinch and never exposes space outside bounds',()=>{
    expect(pinchCamera({zoom:1,x:400,y:400},bounds,{x:.25,y:.5},{x:.25,y:.5},2,4)).toEqual({zoom:2,x:300,y:400});
    expect(pinchCamera(camera,bounds,{x:.5,y:.5},{x:5,y:-5},2)).toEqual({zoom:2.5,x:160,y:400});
  });
});
