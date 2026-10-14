import { RARE_ITEMS,type ShopKind } from '../content/catalog';
import type { SaveData,GiftRecord } from './types';
export function claimMission(save:SaveData,missionId:string,now:number):{save:SaveData;gift:GiftRecord|null;claimed:boolean}{
 if(save.rewards.claimed.includes(missionId))return {save,gift:null,claimed:false};
 const ownedKey=(kind:ShopKind)=>kind==='wearable'?'wearables':kind==='furniture'?'furniture':'backgrounds';
 const available=RARE_ITEMS.filter(r=>!save.owned[ownedKey(r.kind)].includes(r.id));
 const categories=[...new Set(RARE_ITEMS.map(r=>r.category))];
 const preferred=categories[save.rewards.claimed.length%categories.length];
 const pool=available.filter(r=>r.category===preferred);const choices=pool.length?pool:available;
 const hash=Array.from(missionId).reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0);
 const chosen=choices.length?choices[hash%choices.length]:null;
 const gift:GiftRecord|null=chosen?{...chosen,missionId,at:now}:null;
 const owned=chosen?{...save.owned,[ownedKey(chosen.kind)]:[...save.owned[ownedKey(chosen.kind)],chosen.id]}:save.owned;
 return {save:{...save,owned,rewards:{claimed:[...save.rewards.claimed,missionId],gifts:gift?[...save.rewards.gifts,gift]:save.rewards.gifts}},gift,claimed:true};
}
