import { cameraViewport,panCamera,pinchCamera,type Camera,type CameraPoint,type SceneBounds } from './designViewport';

export interface GesturePoint extends CameraPoint {clientX:number;clientY:number}
interface Pointer {point:GesturePoint;start:GesturePoint;item:boolean}
const midpoint=(a:GesturePoint,b:GesturePoint):CameraPoint=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const distance=(a:GesturePoint,b:GesturePoint)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);

/** Camera ownership remains latched until the next pointer session. */
export class CameraGesture {
  active=false;
  moved=false;
  private pointers=new Map<number,Pointer>();
  private camera:Camera={zoom:1,x:0,y:0};
  private applied:Camera=this.camera;
  private dragging=false;

  down(id:number,point:GesturePoint,item:boolean,camera:Camera) {
    if(!this.pointers.size){this.active=false;this.moved=false;}
    this.pointers.set(id,{point,start:point,item});
    this.rebase(camera);
    if(this.pointers.size>=2)this.active=true;
  }

  move(id:number,point:GesturePoint,bounds:SceneBounds,aspect?:number):Camera|null {
    const pointer=this.pointers.get(id);
    if(!pointer)return null;
    pointer.point=point;
    const pair=[...this.pointers.values()].slice(0,2);
    if(pair.length===1&&pointer.item&&!this.active)return null;
    if(!this.dragging&&!pair.some(p=>distance(p.start,p.point)>4))return null;
    this.dragging=true;
    this.active=true;
    let next:Camera;
    if(pair.length===2){
      const [a,b]=pair;
      const initialDistance=distance(a.start,b.start);
      // Coincident fingers cannot define a zoom ratio; translating still works.
      next=pinchCamera(this.camera,bounds,midpoint(a.start,b.start),midpoint(a.point,b.point),initialDistance>0?distance(a.point,b.point)/initialDistance:1,aspect);
    }else{
      next=panCamera(this.camera,bounds,{x:point.x-pointer.start.x,y:point.y-pointer.start.y},aspect);
    }
    const oldView=cameraViewport(this.applied,bounds,aspect),newView=cameraViewport(next,bounds,aspect);
    if(oldView.x===newView.x&&oldView.y===newView.y&&oldView.width===newView.width&&oldView.height===newView.height)return null;
    this.moved=true;
    this.applied=next;
    return next;
  }

  up(id:number,camera:Camera) {
    this.pointers.delete(id);
    this.rebase(camera);
  }

  private rebase(camera:Camera) {
    this.camera=camera;
    this.applied=camera;
    this.dragging=false;
    for(const pointer of this.pointers.values())pointer.start=pointer.point;
  }
}
