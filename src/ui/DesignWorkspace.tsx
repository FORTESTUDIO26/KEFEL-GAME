import { useEffect,useId,useRef,useState,type ReactNode } from 'react';
import { boundedZoom,designViewBox,type SceneBounds } from './designViewport';
import { Icon } from './icons';
import '../design-workspace.css';

interface View {viewBox:string;zoom:number;expanded:boolean}
export function DesignWorkspace({title,bounds,children,navigation,focusY}:{title:string;bounds:SceneBounds;navigation?:ReactNode;focusY?:number;children:(view:View)=>ReactNode}) {
  const isWorld=bounds.width===800;
  const [expanded,setExpanded]=useState(isWorld);
  const [drawer,setDrawer]=useState(false);
  const [rotateDismissed,setRotateDismissed]=useState(false);
  const [zoom,setZoom]=useState(1);
  const [fit,setFit]=useState(false);
  const [sceneAspect,setSceneAspect]=useState<number|null>(null);
  const [centre,setCentre]=useState({x:bounds.x+bounds.width/2,y:focusY??(isWorld?375:bounds.y+bounds.height/2)});
  useEffect(()=>{if(focusY!==undefined)setCentre(c=>({...c,y:focusY}));},[focusY]);
  const root=useRef<HTMLDivElement>(null),expandButton=useRef<HTMLButtonElement>(null),closeButton=useRef<HTMLButtonElement>(null);
  const titleId=useId();
  const roomAspect=expanded&&!fit&&isWorld&&sceneAspect?sceneAspect:undefined;
  useEffect(()=>{
    const el=root.current?.querySelector('.room-wrap');if(!el)return;
    const observer=new ResizeObserver(()=>{const r=el.getBoundingClientRect();if(r.height>0)setSceneAspect(r.width/r.height);});
    observer.observe(el);return()=>observer.disconnect();
  },[]);
  const hadExpanded=useRef(false);
  useEffect(()=>{
    if(expanded)hadExpanded.current=true;
    else if(hadExpanded.current){expandButton.current?.focus();hadExpanded.current=false;}
  },[expanded]);
  const exit=()=>setExpanded(false);
  useEffect(()=>{
    if(!expanded)return;
    const previous=document.body.style.overflow;
    const previousFocus=document.activeElement as HTMLElement|null;
    document.body.style.overflow='hidden';
    closeButton.current?.focus();
    const key=(e:KeyboardEvent)=>{
      if(document.querySelector('.modal-backdrop'))return;
      if(e.key==='Escape'){e.preventDefault();setExpanded(false);}
      if(e.key==='Tab'){
        const list=[...root.current!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length>0);
        const first=list[0],last=list[list.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    window.addEventListener('keydown',key);
    return ()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',key);previousFocus?.focus?.();};
  },[expanded]);
  const enter=()=>{setDrawer(false);setFit(false);setCentre({x:bounds.x+bounds.width/2,y:focusY??(isWorld?375:bounds.y+bounds.height/2)});setExpanded(true);};
  const reset=()=>{setZoom(1);setFit(true);setCentre({x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2});};
  const changeZoom=(delta:number)=>{setFit(false);setZoom(z=>boundedZoom(z+delta));};
  const effectiveWidth=roomAspect?Math.min(bounds.width/zoom,bounds.height/zoom*roomAspect):bounds.width/zoom;
  const effectiveHeight=roomAspect?Math.min(bounds.height/zoom,bounds.width/zoom/roomAspect):bounds.height/zoom;
  const pan=(dx:number,dy:number)=>setCentre(c=>({
    x:Math.min(bounds.x+bounds.width-effectiveWidth/2,Math.max(bounds.x+effectiveWidth/2,c.x+dx*effectiveWidth)),
    y:Math.min(bounds.y+bounds.height-effectiveHeight/2,Math.max(bounds.y+effectiveHeight/2,c.y+dy*effectiveHeight)),
  }));
  return <div ref={root} className={`design-workspace ${isWorld?'world-play':''} ${expanded?'design-expanded':''} ${drawer?'drawer-open':'drawer-closed'}`} role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} aria-labelledby={expanded?titleId:undefined}>
    <div className="design-controls">
      {expanded?<><h2 id={titleId}>{title}</h2><button ref={closeButton} className="secondary" onClick={exit}><Icon name="close"/> חזרה למשחק</button></>:<button ref={expandButton} className="primary" onClick={enter}><Icon name="sparkle"/> עיצוב במסך מלא</button>}
      <div className="design-zoom" role="group" aria-label="הגדלת אזור העיצוב">
        <button className="icon-btn" aria-label="להקטין תצוגה" disabled={zoom<=1} onClick={()=>changeZoom(-.25)}><Icon name="minus"/></button>
        <span dir="ltr" className="zoom-value">{Math.round(zoom*100)}%</span>
        <button className="icon-btn" aria-label="להגדיל תצוגה" disabled={zoom>=2.5} onClick={()=>changeZoom(.25)}><Icon name="plus"/></button>
        <button className="ghost small" onClick={reset}>כל התמונה</button>
      </div>
      <button className="primary design-drawer-toggle" aria-expanded={drawer} onClick={()=>setDrawer(v=>!v)}><Icon name="hanger"/>{drawer?'להסתיר פריטים':'לבחור פריטים'}</button>
    </div>
    {isWorld&&!rotateDismissed&&<div className="rotate-note" role="note"><span>יותר מקום לשחק: סובבי את הטלפון לרוחב.</span><button className="ghost small" onClick={()=>setRotateDismissed(true)}>להמשיך ככה</button></div>}
    {(zoom>1||roomAspect)&&<div className="design-pan" role="group" aria-label="הזזת התצוגה המוגדלת" dir="ltr">
      <button className="icon-btn" aria-label="תצוגה שמאלה" onClick={()=>pan(-.15,0)}><Icon name="arrowL"/></button>
      <button className="icon-btn" aria-label="תצוגה למעלה" onClick={()=>pan(0,-.15)}><Icon name="arrowU"/></button>
      <button className="icon-btn" aria-label="תצוגה למטה" onClick={()=>pan(0,.15)}><Icon name="arrowD"/></button>
      <button className="icon-btn" aria-label="תצוגה ימינה" onClick={()=>pan(.15,0)}><Icon name="arrowR"/></button>
    </div>}
    {navigation}
    {children({viewBox:designViewBox(zoom,bounds,centre.x,centre.y,roomAspect),zoom,expanded})}
  </div>;
}
