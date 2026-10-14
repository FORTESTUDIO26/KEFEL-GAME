import { expect,it } from 'vitest';
import { defaultSave,validateSave } from './save';
import { sceneOrder,changeLayer,DOG_LAYER_ID } from './layers';
import { placeFurniture } from './game';
it('new rugs are under the dog regardless of placement time or position',()=>{
 let s=defaultSave(1);s.owned.furniture.push('rug_fluffy');s=placeFurniture(s,'rug_fluffy',2);
 s.studio.items.find(p=>p.itemId==='rug_fluffy')!.y=500;
 const order=sceneOrder(s.studio);expect(order.indexOf('p2')).toBeLessThan(order.indexOf(DOG_LAYER_ID));
});
it('front/back controls include the dog and survive save/import',()=>{
 let s=defaultSave(1);const rug=s.studio.items[0].uid;
 s=changeLayer(s,rug,'front');expect(sceneOrder(s.studio).slice(-1)[0]).toBe(rug);
 s=changeLayer(s,DOG_LAYER_ID,'front');expect(sceneOrder(s.studio).slice(-1)[0]).toBe(DOG_LAYER_ID);
 const v=validateSave(JSON.parse(JSON.stringify(s)),2);expect(v.ok&&sceneOrder(v.data.studio).slice(-1)[0]).toBe(DOG_LAYER_ID);
 s=changeLayer(s,rug,'back');expect(sceneOrder(s.studio)[0]).toBe(rug);
});
