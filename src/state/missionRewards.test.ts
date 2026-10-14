import { expect,it } from 'vitest';
import { defaultSave,validateSave } from './save';
import { completeLearnSession,completeRound,startLearnSession } from './game';
import { roundReward,canBuy } from './economy';
import { RARE_ITEMS } from '../content/catalog';
import { planRound } from '../learning/session';
it('all completed missions pay 50 regardless of help and mode',()=>{
 expect(roundReward(['hinted','wrong'],'scheduled').total).toBe(50);
 expect(roundReward(['independent'],'free').total).toBe(50);
 const s=startLearnSession(defaultSave(1),2,()=>.5);const r=completeLearnSession(s,s.learning.learnSession!,3);expect(r.coins).toBe(50);expect(r.save.coins).toBe(50);
});
it('gifts and coins cannot be awarded twice, including after import',()=>{
 const s=startLearnSession(defaultSave(1),2,()=>.5),session=s.learning.learnSession!;
 const a=completeLearnSession(s,session,3);expect(a.gift).not.toBeNull();
 expect(completeLearnSession(s,session,3).gift).toEqual(a.gift);
 const v=validateSave(JSON.parse(JSON.stringify(a.save)),4);expect(v.ok).toBe(true);
 if(v.ok){const b=completeLearnSession(v.data,session,5);expect(b.save.coins).toBe(50);expect(b.coins).toBe(0);expect(b.save.rewards.gifts).toHaveLength(1);}
 const round=planRound(s.learning,s.settings.tables,6,()=>.5);const first=completeRound(a.save,round,[],6);expect(completeRound(first.save,round,[],7).save).toBe(first.save);
});
it('rare gifts rotate through every category and never duplicate ownership',()=>{
 let s=defaultSave(1);const cats=new Set(RARE_ITEMS.map(r=>r.category));
 for(let i=0;i<RARE_ITEMS.length;i++){s=startLearnSession(s,i+2,()=>.5);s=completeLearnSession(s,s.learning.learnSession!,i+3).save;}
 expect(new Set(s.rewards.gifts.map(g=>g.id)).size).toBe(RARE_ITEMS.length);
 expect(new Set(s.rewards.gifts.slice(0,cats.size).map(g=>g.category))).toEqual(cats);
 s=startLearnSession(s,100,()=>.5);expect(completeLearnSession(s,s.learning.learnSession!,101).gift).toBeNull();
 const rare=RARE_ITEMS[0];expect(canBuy(defaultSave(1),rare.kind,rare.id)).toEqual({ok:false,reason:'rewardOnly'});
});

it('version 3 imports receive every free addition without losing coins or purchases',()=>{
 const old=defaultSave(1);old.version=3;old.coins=87;old.owned={wearables:['crown'],furniture:['chandelier'],backgrounds:['wall_hearts']};
 const v=validateSave(old,2);expect(v.ok).toBe(true);if(!v.ok)return;
 expect(v.data.coins).toBe(87);expect(v.data.owned.wearables).toContain('crown');expect(v.data.owned.furniture).toContain('chandelier');
 expect(v.data.owned.wearables).toHaveLength(42);expect(v.data.owned.furniture).toHaveLength(27);expect(v.data.owned.backgrounds).toHaveLength(14);
 expect(v.data.rewards.gifts).toEqual([]);expect(v.data.owned.wearables.some(id=>RARE_ITEMS.some(r=>r.id===id))).toBe(false);
});
