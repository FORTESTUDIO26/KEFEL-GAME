import { useRef,type PointerEvent as ReactPointerEvent,type MouseEvent as ReactMouseEvent } from 'react';
import { CameraGesture,type GesturePoint } from './cameraGesture';
import { type Camera,type SceneBounds } from './designViewport';

export interface CameraGestureHandlers {
  onPointerDownCapture:(e:ReactPointerEvent<SVGSVGElement>)=>void;
  onPointerMove:(e:ReactPointerEvent<SVGSVGElement>)=>void;
  onPointerUp:(e:ReactPointerEvent<SVGSVGElement>)=>void;
  onPointerCancel:(e:ReactPointerEvent<SVGSVGElement>)=>void;
  onClickCapture:(e:ReactMouseEvent<SVGSVGElement>)=>void;
  isCameraActive:()=>boolean;
}

function svgPoint(e:ReactPointerEvent<SVGSVGElement>):GesturePoint|null {
  const svg=e.currentTarget,matrix=svg.getScreenCTM(),view=svg.viewBox.baseVal;
  if(!matrix||!view.width||!view.height)return null;
  const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
  return {x:(point.x-view.x)/view.width,y:(point.y-view.y)/view.height,clientX:e.clientX,clientY:e.clientY};
}

export function useCameraGesture(camera:Camera,bounds:SceneBounds,aspect:number|undefined,onChange:(camera:Camera)=>void):CameraGestureHandlers {
  const state=useRef(new CameraGesture());
  const live=useRef({camera,bounds,aspect,onChange});
  live.current={camera,bounds,aspect,onChange};
  const captured=useRef(new Set<number>());
  const pointers=useRef(new Set<number>());
  const capture=(svg:SVGSVGElement,id:number)=>{
    if(svg.hasPointerCapture(id))return;
    svg.setPointerCapture(id);
    captured.current.add(id);
  };
  const end=(e:ReactPointerEvent<SVGSVGElement>)=>{
    state.current.up(e.pointerId,live.current.camera);
    pointers.current.delete(e.pointerId);
    if(captured.current.delete(e.pointerId)&&e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  };
  return {
    onPointerDownCapture(e){
      if(e.pointerType!=='touch'&&e.button!==0)return;
      const point=svgPoint(e);if(!point)return;
      const item=e.target instanceof Element&&!!e.target.closest('.room-item');
      state.current.down(e.pointerId,point,item,live.current.camera);
      pointers.current.add(e.pointerId);
      // Leave a single item's pointer capture to its drag handler.
      if(!item||state.current.active)capture(e.currentTarget,e.pointerId);
      if(state.current.active){
        for(const id of pointers.current)capture(e.currentTarget,id);
        e.preventDefault();
      }
    },
    onPointerMove(e){
      const point=svgPoint(e);if(!point)return;
      const next=state.current.move(e.pointerId,point,live.current.bounds,live.current.aspect);
      if(state.current.active)e.preventDefault();
      if(next){live.current.camera=next;live.current.onChange(next);}
    },
    onPointerUp:end,
    onPointerCancel:end,
    onClickCapture(e){
      // Keyboard activation remains available even after a camera gesture.
      if(state.current.moved&&e.detail!==0){e.preventDefault();e.stopPropagation();}
    },
    isCameraActive:()=>state.current.active,
  };
}
