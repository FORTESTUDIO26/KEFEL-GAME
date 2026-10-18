import { useEffect,useId,useRef,useState,type ReactNode } from 'react';
import { panCamera,boundedZoom,designViewBox,type SceneBounds } from './designViewport';
import { Icon } from './icons';
import { useCameraGesture,type CameraGestureHandlers } from './useCameraGesture';
import '../design-workspace.css';

interface View {viewBox:string;zoom:number;expanded:boolean;closeDrawer:()=>void;/** move the camera sideways by room units (used while dragging an item to the screen edge) */panBy:(dx:number)=>void;gesture:CameraGestureHandlers;onCameraKey:(e:import('react').KeyboardEvent<SVGSVGElement>)=>void}
export function DesignWorkspace({title,bounds,children,navigation,focusY,onTool,sound,onToggleSound,hudEnd,toolbarExtra}:{title:string;bounds:SceneBounds;sound?:boolean;onToggleSound?:()=>void;navigation?:ReactNode;focusY?:number;onTool?:(tool:'storage'|'clothes'|'walls'|'dog')=>void;children:(view:View)=>ReactNode;/** top corner (timer, parents) */hudEnd?:ReactNode;/** extra buttons at the end of the bottom bar (shop, more) */toolbarExtra?:ReactNode}) {
  const isWorld=bounds.width>=800;
  const [expanded,setExpanded]=useState(isWorld);
  const [drawer,setDrawer]=useState(false);
  const drawerLive=useRef(drawer);drawerLive.current=drawer;
  const [tool,setTool]=useState<'storage'|'clothes'|'walls'|'dog'>('storage');
  const [zoom,setZoom]=useState(1);
  const [fit,setFit]=useState(false);
  const [sceneAspect,setSceneAspect]=useState<number|null>(null);
  const [centre,setCentre]=useState({x:bounds.x+bounds.width/2,y:bounds.horizontal?250:focusY??(isWorld?375:bounds.y+bounds.height/2)});
  useEffect(()=>{if(focusY!==undefined&&!bounds.horizontal)setCentre(c=>({...c,y:focusY}));},[focusY,bounds.horizontal]);
  const root=useRef<HTMLDivElement>(null),expandButton=useRef<HTMLButtonElement>(null),closeButton=useRef<HTMLButtonElement>(null);
  const titleId=useId();
  const roomAspect=expanded&&!fit&&isWorld&&sceneAspect?sceneAspect:undefined;
  const gesture=useCameraGesture({zoom,...centre},bounds,roomAspect,next=>{
    setZoom(next.zoom);setCentre({x:next.x,y:next.y});
  });
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
      if(document.querySelector('.landscape-only'))return;
      if(document.querySelector('.modal-backdrop'))return;
      if(e.key==='Escape'){
        e.preventDefault();
        const menus=root.current?.querySelectorAll<HTMLDetailsElement>('details[open]');
        if(menus?.length){menus.forEach(menu=>{menu.open=false;});return;}
        if(drawerLive.current){setDrawer(false);return;}
        if(!isWorld)setExpanded(false);
      }
      if(e.key==='Tab'){
        const list=[...root.current!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),summary,[tabindex="0"]')].filter(el=>el.getClientRects().length>0);
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
  const dismissPanels=(target:Element)=>{root.current?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(menu=>{if(!menu.contains(target))menu.open=false;});if(drawerLive.current&&!target.closest('.studio-side,.dress-panel,.design-drawer-toggle,.design-controls')&&!target.closest('.room-hud-tools,.room-rail'))setDrawer(false);};
  return <div ref={root} onPointerDownCapture={e=>dismissPanels(e.target as Element)} onClickCapture={e=>dismissPanels(e.target as Element)} className={`design-workspace ${isWorld?'world-play':''} ${expanded?'design-expanded':''} ${drawer?'drawer-open':'drawer-closed'}`} role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} aria-labelledby={expanded?titleId:undefined}>
    {isWorld&&expanded?<><h2 id={titleId} className="sr-only">{title}</h2>{hudEnd&&<div className="room-hud-end">{hudEnd}</div>}<nav className="room-rail room-rail-tools" aria-label="כלי עיצוב">{([{id:'storage',icon:'sofa',name:'רהיטים'},{id:'clothes',icon:'hanger',name:'בגדים'},{id:'dog',icon:'paw',name:'דמויות'},{id:'walls',icon:'brush',name:'צבעים'}] as const).map(t=><button key={t.id} className={`bar-button ${drawer&&tool===t.id?'on':''}`} aria-label={t.name} title={t.name} aria-expanded={drawer&&tool===t.id} onClick={()=>{setDrawer(drawer&&tool===t.id?false:true);setTool(t.id);onTool?.(t.id);}}><Icon name={t.icon} size={22}/><span>{t.name}</span></button>)}{!toolbarExtra&&onToggleSound&&<button className="bar-button" aria-label={sound?'השתקת מנגינה וצלילים':'הפעלת מנגינה וצלילים'} aria-pressed={!!sound} onClick={onToggleSound}><Icon name={sound?'sound':'mute'} size={22}/><span>מנגינה</span></button>}</nav>{toolbarExtra&&<div className="room-rail room-rail-more">{toolbarExtra}</div>}</>:<div className="design-controls">
      {expanded?<><h2 id={titleId}>{title}</h2><button ref={closeButton} className="secondary" onClick={exit}><Icon name="close"/> חזרה למשחק</button></>:<button ref={expandButton} className="primary" onClick={enter}><Icon name="sparkle"/> עיצוב במסך מלא</button>}
      <div className="design-zoom" role="group" aria-label="הגדלת אזור העיצוב">
        <button className="icon-btn" aria-label="להקטין תצוגה" disabled={zoom<=1} onClick={()=>changeZoom(-.25)}><Icon name="minus"/></button>
        <span dir="ltr" className="zoom-value">{Math.round(zoom*100)}%</span>
        <button className="icon-btn" aria-label="להגדיל תצוגה" disabled={zoom>=2.5} onClick={()=>changeZoom(.25)}><Icon name="plus"/></button>
        <button className="ghost small" onClick={reset}>כל התמונה</button>
      </div>
      <button className="primary design-drawer-toggle" aria-expanded={drawer} onClick={()=>setDrawer(v=>!v)}><Icon name="hanger"/>{drawer?'להסתיר פריטים':'לבחור פריטים'}</button>
    </div>}
    {navigation}
    {children({viewBox:designViewBox(zoom,bounds,centre.x,centre.y,roomAspect),zoom,expanded,closeDrawer:()=>setDrawer(false),panBy:dx=>setCentre(c=>{const next=panCamera({zoom,...c},bounds,{x:-dx/Math.max(1,Number(designViewBox(zoom,bounds,c.x,c.y,roomAspect).split(' ')[2])),y:0},roomAspect);return next.x===c.x?c:{x:next.x,y:next.y};}),gesture,onCameraKey:e=>{if(e.target!==e.currentTarget)return;const dx=e.key==='ArrowLeft'?.15:e.key==='ArrowRight'?-.15:0;if(!dx)return;e.preventDefault();const next=panCamera({zoom,...centre},bounds,{x:dx,y:0},roomAspect);setCentre({x:next.x,y:next.y});}})}
  </div>;
}
