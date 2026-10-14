import { WEARABLES,type Wearable } from '../content/catalog';
import type { DesignSlot } from './learnPath';
const slots:DesignSlot[]=['body','neck','head','feet','prop'];
export function learningDesignOptions(slot:DesignSlot,ownedIds:string[],stepId:string):Wearable[] {
 const owned=WEARABLES.filter(w=>ownedIds.includes(w.id)&&slots.includes(w.slot as DesignSlot));
 const preferred=owned.filter(w=>w.slot===slot);
 const pool=preferred.length?preferred:owned;
 let h=0;for(const ch of stepId)h=(h*31+ch.charCodeAt(0))>>>0;
 const start=pool.length?h%pool.length:0;
 return [...pool.slice(start),...pool.slice(0,start)].slice(0,3);
}
