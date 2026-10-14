import { expect,it } from 'vitest';
import { learningDesignOptions } from './designOptions';
import { FREE_WEARABLES } from '../content/catalog';
import { defaultSave,validateSave } from '../state/save';
import { startLearnSession } from '../state/game';
it('provides owned alternatives when a new player reaches hair or hand accessories',()=>{
 for(const slot of ['head','prop'] as const){const options=learningDesignOptions(slot,FREE_WEARABLES.filter(id=>id!=='bow'),'step');expect(options.length).toBeGreaterThan(0);expect(options.every(w=>FREE_WEARABLES.includes(w.id))).toBe(true);}
});
it('repairs an existing stalled hair step without losing the session, coins or old free items',()=>{
 let save=startLearnSession(defaultSave(1000),1000);
 save.owned.wearables=['collar_classic','bandana','tee_stripes','sport_tank','socks','ribbon'];save.coins=37;
 const session=save.learning.learnSession!;session.index=session.steps.findIndex(s=>s.type==='design'&&s.slot==='head');
 const back=validateSave(JSON.parse(JSON.stringify(save)),2000);expect(back.ok).toBe(true);if(!back.ok)return;
 expect(back.data.learning.learnSession?.index).toBe(session.index);expect(back.data.coins).toBe(37);
 expect(back.data.owned.wearables).toContain('bandana');expect(back.data.owned.wearables).toContain('bow');
 expect(learningDesignOptions('head',back.data.owned.wearables,'step').map(w=>w.id)).toContain('bow');
});
it('keeps hair options for players who own them, and handles missing inventory without inventing ownership',()=>{
 expect(learningDesignOptions('head',['bow'],'step').map(w=>w.id)).toEqual(['bow']);
 expect(learningDesignOptions('head',[],'step')).toEqual([]);
});
