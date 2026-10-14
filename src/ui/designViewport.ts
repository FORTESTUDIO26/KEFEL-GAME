export interface SceneBounds {x:number;y:number;width:number;height:number}
export function boundedZoom(value:number):number {
  return Number.isFinite(value)?Math.min(2.5,Math.max(1,Math.round(value*100)/100)):1;
}
export function designViewBox(zoom:number,bounds:SceneBounds,cx:number,cy:number,aspect?:number):string {
  const z=boundedZoom(zoom);
  let w=bounds.width/z,h=bounds.height/z;
  if(aspect && Number.isFinite(aspect) && aspect>0) {
    if(aspect<w/h)w=h*aspect;else h=w/aspect;
  }
  const x=Math.min(bounds.x+bounds.width-w,Math.max(bounds.x,cx-w/2));
  const y=Math.min(bounds.y+bounds.height-h,Math.max(bounds.y,cy-h/2));
  return `${x} ${y} ${w} ${h}`;
}
