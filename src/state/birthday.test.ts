import { describe, expect, it } from 'vitest';
import { defaultSave } from './save';
import { emptyDaily } from '../learning/data';
import { buildLearnSession } from '../learning/learnPath';
import { factKey } from '../learning/facts';
import { completeLearnSession } from './game';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StoreProvider } from './store';
import { BirthdayScenery, BirthdayStory } from '../ui/BirthdayStory';
import { SLOT_LABEL, SLOT_ORDER, WEARABLES } from '../content/catalog';
import { RoomNavigation } from '../ui/WorldRoomUI';
import { isValidSupport, moveWithSupports } from './placement';
import { switchRoom } from './world';
import { advanceBirthday, birthdayTheme, birthdayVisit, defaultBirthday, finishBirthday, pauseBirthday, prepareBirthdayKitchen, restartBirthday, sanitizeBirthday, startBirthday, syncBirthday } from './birthday';

const initial=()=>({...defaultSave(1000),birthday:defaultBirthday()});
function learningStage() {
  let s=startBirthday(initial());s=advanceBirthday(s);s=prepareBirthdayKitchen(s);s=advanceBirthday(s);return advanceBirthday(s);
}
describe('birthday story',()=>{
  it('renders all seven owned wardrobe categories and a labeled HUD',()=>{
    const s=advanceBirthday(prepareBirthdayKitchen(advanceBirthday(startBirthday(initial()))));
    const html=renderToStaticMarkup(createElement(StoreProvider,{initial:s,storage:null,children:createElement(BirthdayStory,{onGo:()=>{}})}));
    expect(html).toContain('aria-label="יום הולדת"');
    expect(html).toContain('birthday-cake-icon');expect(html).not.toContain('🎂');
    for(const slot of SLOT_ORDER)expect(html).toContain(`<legend>${SLOT_LABEL[slot]}</legend>`);
    const unowned=WEARABLES.find(w=>!s.owned.wearables.includes(w.id));
    if(unowned)expect(html).not.toContain(`>${unowned.name}</button>`);
  });
  it('offers temporary story room navigation without permanently opening the room',()=>{
    const render=(s:ReturnType<typeof initial>)=>renderToStaticMarkup(createElement(StoreProvider,{initial:s,storage:null,children:createElement(RoomNavigation,{onSwitch:()=>{}})}));
    const s=advanceBirthday(startBirthday(initial()));
    expect(render(s)).toContain('המטבח המתוק, ביקור בסיפור');
    const visited=switchRoom(s,'kitchen');expect(visited.world.activeRoom).toBe('kitchen');
    expect(visited.world.unlocked).toEqual(s.world.unlocked);expect(visited.world.opening).toBeNull();
    expect(render(pauseBirthday(visited))).not.toContain('ביקור בסיפור');
    expect(switchRoom(pauseBirthday(visited),'kitchen').world.activeRoom).toBe('studio');
  });
  it('opens the ready party on mount, but never replays a completion burst on reload',()=>{
    const s=learningStage();const party={...s,birthday:{...s.birthday,stage:'party' as const},world:{...s.world,activeRoom:'garden' as const}};
    const render=(initial:typeof s)=>renderToStaticMarkup(createElement(StoreProvider,{initial,storage:null,children:createElement(BirthdayStory,{onGo:()=>{}})}));
    expect(render(party)).toContain('class="birthday-story" open=""');
    expect(render(party)).toContain('הלמידה הושלמה');
    const done=finishBirthday(party,6000);
    expect(render(done)).not.toContain('mission-effects');
    expect(render({...party,birthday:{...party.birthday,active:false}})).not.toContain('open=""');
  });
  it('attaches newly supplied plates and cups at the real table surface and carries them on moves',()=>{
    const s=prepareBirthdayKitchen(advanceBirthday(startBirthday(initial())));
    const room=s.world.rooms.kitchen;const table=room.items.find(p=>p.itemId==='kitchen_table')!;
    for(const item of room.items.filter(p=>p.itemId!=='kitchen_table')){
      expect(item.y).toBe(365);expect(item.supportUid).toBe(table.uid);expect(isValidSupport(room,item.uid,table.uid)).toBe(true);
    }
    const moved=moveWithSupports({...s,studio:room},table.uid,table.x+100,table.y-15);
    for(const item of room.items){const next=moved.studio.items.find(p=>p.uid===item.uid)!;expect(next.x).toBe(item.x+100);expect(next.y).toBe(item.y-15);}
  });
  it('uses an existing flipped scaled table for new props and preserves existing props exactly',()=>{
    let s=advanceBirthday(startBirthday(initial()));
    const table={uid:'existing-table',itemId:'kitchen_table',x:300,y:435,scale:.8,flip:true};
    const plates={uid:'existing-plates',itemId:'kitchen_plates',x:900,y:450,scale:1.2,flip:true};
    s={...s,world:{...s.world,rooms:{...s.world.rooms,kitchen:{...s.world.rooms.kitchen,items:[table,plates]}}}};
    const room=prepareBirthdayKitchen(s).world.rooms.kitchen;
    expect(room.items.find(p=>p.uid===plates.uid)).toEqual(plates);
    const cups=room.items.find(p=>p.itemId==='kitchen_cups')!;
    expect(cups).toMatchObject({x:268,y:379,scale:.8,supportUid:table.uid});
    expect(isValidSupport(room,cups.uid,table.uid)).toBe(true);
  });
  it('shows the party overlay only during an active garden party',()=>{
    const s=learningStage();
    const render=(initial:typeof s)=>renderToStaticMarkup(createElement(StoreProvider,{initial,storage:null,children:createElement('svg',null,createElement(BirthdayScenery))}));
    expect(render(s)).not.toContain('birthday-scenery');
    const party={...s,birthday:{...s.birthday,stage:'party' as const},world:{...s.world,activeRoom:'garden' as const}};
    expect(render(party)).toContain('birthday-scenery');
    expect(render(pauseBirthday(party))).not.toContain('birthday-scenery');
  });
  it('persists and sanitizes progress without resetting a pause',()=>{
    const s=learningStage();const b=sanitizeBirthday(JSON.parse(JSON.stringify(s.birthday)));
    expect(b.stage).toBe('learn');expect(startBirthday(pauseBirthday({...s,birthday:b})).birthday.stage).toBe('learn');
    expect(sanitizeBirthday({stage:'oops',active:1,baselineLearn:-1,theme:'url(x)'})).toEqual(defaultBirthday());
  });
  it('loans only the current room and restores studio on pause and stage changes',()=>{
    let s=advanceBirthday(startBirthday(initial()));
    expect(birthdayVisit(s.birthday,'kitchen')).toBe(true);expect(birthdayVisit(s.birthday,'garden')).toBe(false);
    s={...s,world:{...s.world,activeRoom:'kitchen'}};
    const p=pauseBirthday(s);expect(p.world.activeRoom).toBe('studio');expect(birthdayVisit(p.birthday,'kitchen')).toBe(false);
    const n=advanceBirthday(prepareBirthdayKitchen(s));expect(n.world.activeRoom).toBe('studio');expect(n.world.unlocked).toEqual(s.world.unlocked);
  });
  it('reuses furniture, preserves coordinates and applies actual table color without charges',()=>{
    let s=advanceBirthday(startBirthday(initial()));
    s={...s,world:{...s.world,rooms:{...s.world.rooms,kitchen:{...s.world.rooms.kitchen,items:[{uid:'my-table',itemId:'kitchen_table',x:201,y:422,scale:1.3,flip:true}]}}}};
    s=birthdayTheme(s,'#b9a3ed');const p=prepareBirthdayKitchen(s);const twice=prepareBirthdayKitchen(p);
    expect(twice.world.rooms.kitchen.items).toEqual(p.world.rooms.kitchen.items);
    expect(p.world.rooms.kitchen.items[0]).toEqual({...s.world.rooms.kitchen.items[0],color:'#b9a3ed'});
    expect(p.coins).toBe(s.coins);expect(p.world.unlocked).toEqual(s.world.unlocked);
    expect(p.world.rooms.kitchen.items).toHaveLength(3);
  });
  it('rejects preexisting completions, arbitrary rounds, claims without completion logs',()=>{
    let s=initial();s.rewards.claimed=['learn:old'];s.learning.daily={'2026-10-14':{...emptyDaily(),learnSessions:1}};
    s=advanceBirthday(advanceBirthday(prepareBirthdayKitchen(advanceBirthday(startBirthday(s)))));
    expect(syncBirthday(s)).toBe(s);
    expect(syncBirthday({...s,rewards:{...s.rewards,claimed:[...s.rewards.claimed,'learn:unlogged']}}).birthday.stage).toBe('learn');
    const round={...s,rewards:{...s.rewards,claimed:[...s.rewards.claimed,'round:new']},learning:{...s.learning,daily:{'2026-10-14':{...emptyDaily(),learnSessions:2}}}};
    expect(syncBirthday(round).birthday.stage).toBe('learn');
  });
  it('accepts a new completed learn session with help, retaining existing learning rewards',()=>{
    const s=learningStage();const keys=[2,3,4,5,6,7].map(n=>factKey(2,n));
    const built=buildLearnSession(s.learning,keys,2000,()=>.5);
    const done={...built,index:built.steps.length-1,helped:6,alone:0,afterHelp:6};
    const result=completeLearnSession(s,done,3000);const next=syncBirthday(result.save);
    expect(next.birthday.stage).toBe('party');expect(next.coins).toBe(result.save.coins);expect(result.coins).toBe(50);
    expect(next.rewards).toEqual(result.save.rewards);expect(syncBirthday(next)).toBe(next);
  });
  it('takes one photo of the actual Lola outfit, never pays twice, and preserves history on replay',()=>{
    let s=learningStage();s={...s,birthday:{...s.birthday,stage:'party'},outfits:{...s.outfits,lola:{head:{itemId:'crown',color:'#abcdef'}}},world:{...s.world,activeRoom:'garden'}};
    const done=finishBirthday(s,5000);expect(done.album).toHaveLength(s.album.length+1);
    expect(done.album[done.album.length-1]?.outfit).toEqual(s.outfits.lola);expect(done.album[done.album.length-1]?.backdrop).toBe('party');
    expect(done.birthday.photoId).toBe(done.album[done.album.length-1]?.id);expect(done.coins).toBe(s.coins);expect(done.rewards).toEqual(s.rewards);
    expect(finishBirthday(done,5001)).toBe(done);expect(done.world.activeRoom).toBe('studio');expect(birthdayVisit(done.birthday,'garden')).toBe(false);
    expect(startBirthday(done)).toBe(done);expect(restartBirthday(done).album).toEqual(done.album);expect(restartBirthday(done).birthday.stage).toBe('invite');
  });
});

