import { describe,expect,it } from 'vitest';
import { CameraGesture } from './cameraGesture';

describe('camera gesture ownership',()=>{
  const bounds={x:0,y:0,width:800,height:500};
  const camera={zoom:2,x:400,y:250};
  const point=(x:number,y=0)=>({x:x/400,y:y/250,clientX:x,clientY:y});
  it('preserves taps, waits for four pixels, and retains camera ownership through release',()=>{
    const gesture=new CameraGesture();
    gesture.down(1,point(0),false,camera);
    expect(gesture.move(1,point(3),bounds)).toBeNull();
    expect(gesture.active).toBe(false);
    expect(gesture.move(1,point(10),bounds)).toEqual({zoom:2,x:390,y:250});
    gesture.up(1,camera);
    expect(gesture.active).toBe(true);
    expect(gesture.moved).toBe(true);
    gesture.down(2,point(0),false,camera);
    expect(gesture.active).toBe(false);
    expect(gesture.moved).toBe(false);
  });
  it('leaves single item drags alone but claims a second finger before it can drag an item',()=>{
    const gesture=new CameraGesture();
    gesture.down(1,point(100),true,camera);
    expect(gesture.move(1,point(110),bounds)).toBeNull();
    gesture.down(2,point(210),true,camera);
    expect(gesture.active).toBe(true);
    expect(gesture.moved).toBe(false);
    expect(gesture.move(2,point(310),bounds)).toEqual({zoom:2.5,x:352,y:225});
  });
  it('does not suppress a click when a camera gesture is blocked by room bounds',()=>{
    const gesture=new CameraGesture();
    gesture.down(1,point(0),false,{zoom:1,x:400,y:250});
    expect(gesture.move(1,point(50),bounds)).toBeNull();
    expect(gesture.active).toBe(true);
    expect(gesture.moved).toBe(false);
  });
  it('rebases remaining pointers after pinch release without jumping',()=>{
    const gesture=new CameraGesture();
    gesture.down(1,point(100,100),true,camera);
    gesture.down(2,point(200,100),true,camera);
    const next=gesture.move(2,point(300,100),bounds)!;
    gesture.up(2,next);
    expect(gesture.move(1,point(110,100),bounds)).toEqual({...next,x:next.x-8});
  });
  it('returns to the starting camera when the finger reverses back inside the threshold',()=>{
    const gesture=new CameraGesture();
    gesture.down(1,point(0),false,camera);
    expect(gesture.move(1,point(10),bounds)).toEqual({zoom:2,x:390,y:250});
    expect(gesture.move(1,point(2),bounds)).toEqual({zoom:2,x:398,y:250});
    expect(gesture.move(1,point(0),bounds)).toEqual(camera);
  });
});
