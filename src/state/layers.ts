import { furnitureById } from '../content/catalog';
import type { RoomLayout,SaveData } from './types';
export const DOG_LAYER_ID='__dog__';
export function sceneOrder(room:RoomLayout):string[]{
 const entries=room.items.map(p=>({id:p.uid,kind:furnitureById(p.itemId)?.kind??'floor',y:p.y}));
 const rank=(kind:string)=>kind==='rug'?0:kind==='floor'?2:1;
 const natural=[...entries,{id:DOG_LAYER_ID,kind:'floor',y:room.dog.y}].sort((a,b)=>rank(a.kind)-rank(b.kind)||a.y-b.y).map(e=>e.id);
 if(!room.order)return natural;
 const result=[...new Set(room.order.filter(id=>natural.includes(id)))];
 for(const id of natural.filter(id=>!result.includes(id))){
  const kind=entries.find(e=>e.id===id)?.kind;
  if(kind==='rug')result.unshift(id);
  else if(kind==='wall'||kind==='ceiling'){const i=result.indexOf(DOG_LAYER_ID);result.splice(i<0?0:i,0,id);}
  else result.push(id);
 }
 return result;
}
export function changeLayer(save:SaveData,uid:string,direction:'front'|'back'|'forward'|'backward'):SaveData{
 const order=sceneOrder(save.studio);const at=order.indexOf(uid);if(at<0)return save;
 order.splice(at,1);const next=direction==='front'?order.length:direction==='back'?0:direction==='forward'?Math.min(order.length,at+1):Math.max(0,at-1);
 order.splice(next,0,uid);return {...save,studio:{...save.studio,order}};
}
