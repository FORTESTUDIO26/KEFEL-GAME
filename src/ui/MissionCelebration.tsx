import { FurnitureThumb } from '../art/Furniture';
import { RoomBackground } from '../art/Scenes';
import { BACKGROUNDS,furnitureById,paletteById,wearableById } from '../content/catalog';
import { dogById } from '../content/dogs';
import type { GiftRecord } from '../state/types';
import { useStore } from '../state/store';
import { WearableThumb } from './DressingRoom';
import './MissionCelebration.css';
export function MissionCelebration({gift}:{gift:GiftRecord|null}){
 const {save}=useStore();const p=paletteById(save.profile.paletteId);
 const item=gift?(gift.kind==='wearable'?wearableById(gift.id):gift.kind==='furniture'?furnitureById(gift.id):BACKGROUNDS.find(b=>b.id===gift.id)):null;
 return <section className="mission-surprise" aria-label="הפתעת סיום משימה">
  <div className="mission-sparkles" aria-hidden="true">{Array.from({length:12},(_,i)=><span key={i} style={{'--i':i} as React.CSSProperties}>✦</span>)}</div>
  <strong>{item?'הפתעה! פריט נדיר חדש שלך':'כל האוסף הנדיר כבר שלך!'}</strong>
  {gift&&item&&<><div className="gift-preview">{gift.kind==='wearable'?<WearableThumb dog={dogById(save.profile.ownDogId)} item={wearableById(gift.id)!}/>:gift.kind==='furniture'?<FurnitureThumb id={gift.id} p={p}/>:<svg viewBox="0 0 800 500" role="img" aria-label={item.name}><RoomBackground wall={BACKGROUNDS.find(b=>b.id===gift.id)?.type==='wall'?gift.id:'wall_plain'} floor={BACKGROUNDS.find(b=>b.id===gift.id)?.type==='floor'?gift.id:'floor_wood'} p={p}/></svg>}</div><span>{item.name}</span><small>נוסף לאוסף שלך · אפשר לעצב איתו מיד</small></>}
 </section>;
}
