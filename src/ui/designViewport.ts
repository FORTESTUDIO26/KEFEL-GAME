export interface SceneBounds {x:number;y:number;width:number;height:number;horizontal?:boolean}
export interface Camera {zoom:number;x:number;y:number}
export interface CameraPoint {x:number;y:number}
export function boundedZoom(value:number):number {
  return Number.isFinite(value)?Math.min(2.5,Math.max(1,Math.round(value*100)/100)):1;
}

export function cameraViewport(camera:Camera,bounds:SceneBounds,aspect?:number):SceneBounds {
  const [x,y,width,height]=designViewBox(camera.zoom,bounds,camera.x,camera.y,aspect).split(' ').map(Number);
  return {x,y,width,height};
}

function clampCamera(camera:Camera,bounds:SceneBounds,aspect?:number):Camera {
  const view=cameraViewport(camera,bounds,aspect);
  return {zoom:boundedZoom(camera.zoom),x:view.x+view.width/2,y:view.y+view.height/2};
}

/** Delta and pinch midpoints are fractions of the rendered SVG viewBox. */
export function panCamera(camera:Camera,bounds:SceneBounds,delta:CameraPoint,aspect?:number):Camera {
  const view=cameraViewport(camera,bounds,aspect);
  return clampCamera({zoom:camera.zoom,x:view.x+view.width/2-delta.x*view.width,y:bounds.horizontal?camera.y:view.y+view.height/2-delta.y*view.height},bounds,aspect);
}

export function pinchCamera(camera:Camera,bounds:SceneBounds,start:CameraPoint,end:CameraPoint,ratio:number,aspect?:number):Camera {
  const old=cameraViewport(camera,bounds,aspect);
  const zoom=boundedZoom(camera.zoom*ratio);
  const next=cameraViewport({...camera,zoom},bounds,aspect);
  return clampCamera({zoom,x:old.x+start.x*old.width+(.5-end.x)*next.width,y:bounds.horizontal?camera.y:old.y+start.y*old.height+(.5-end.y)*next.height},bounds,aspect);
}
export function designViewBox(zoom:number,bounds:SceneBounds,cx:number,cy:number,aspect?:number):string {
  const z=boundedZoom(zoom);
  let w=bounds.width/z,h=bounds.height/z;
  if(aspect && Number.isFinite(aspect) && aspect>0) {
    if(bounds.horizontal)w=Math.min(w,h*aspect);else if(aspect<w/h)w=h*aspect;else h=w/aspect;
  }
  const x=Math.min(bounds.x+bounds.width-w,Math.max(bounds.x,cx-w/2));
  const y=Math.min(bounds.y+bounds.height-h,Math.max(bounds.y,cy-h/2));
  return `${x} ${y} ${w} ${h}`;
}
