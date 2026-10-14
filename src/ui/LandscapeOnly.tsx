import { useEffect,useRef,useState,type ReactNode } from 'react';
import './LandscapeOnly.css';
export function LandscapeOnly({children}:{children:ReactNode}) {
 const [portrait,setPortrait]=useState(()=>window.matchMedia('(orientation: portrait)').matches);
 const content=useRef<HTMLDivElement>(null),gate=useRef<HTMLDivElement>(null);
 useEffect(()=>{const query=window.matchMedia('(orientation: portrait)');const changed=()=>setPortrait(query.matches);query.addEventListener('change',changed);changed();return()=>query.removeEventListener('change',changed);},[]);
 useEffect(()=>{
  if(!portrait)return;
  // This layer composes with fullscreen's inline body lock without overwriting
  // it. Cleanup reveals current html/body styles, even if another lock changed.
  const lock=document.createElement('style');
  lock.textContent='html { overflow: hidden !important; scrollbar-gutter: auto !important; } body { overflow: hidden !important; }';
  document.head.appendChild(lock);
  return()=>lock.remove();
 },[portrait]);
 useEffect(()=>{content.current?.toggleAttribute('inert',portrait);if(portrait)gate.current?.focus();},[portrait]);
 return <><div ref={content} aria-hidden={portrait||undefined}>{children}</div>{portrait&&<div ref={gate} className="landscape-only" role="dialog" aria-modal="true" aria-labelledby="turn-device-title" tabIndex={-1}>
  <svg className="landscape-friends" viewBox="0 0 360 260" width="360" height="260" aria-hidden="true" focusable="false">
   <ellipse cx="180" cy="232" rx="143" ry="15" fill="#e6cce5"/>
   <g stroke="#e8aa53" strokeWidth="4" strokeLinecap="round"><path d="M284 22v-9m0 66v-9m-28-27h-9m74 0h-9m-48-20-6-6m46 46-6-6m0-34 6-6m-46 46 6-6"/><circle cx="284" cy="43" r="19" fill="#ffe59a" stroke="none"/></g>
   <path d="M89 32c-13-17-32 0-18 14l18 16 18-16c14-14-5-31-18-14" fill="#f184a9"/>
   <g stroke="#65445b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M68 195q-30-25-37-4q-4 17 33 20" fill="#df9b63"/>
    <path d="M66 228v-56q0-35 34-35t34 35v56" fill="#f7c38d"/>
    <path d="M72 86q-33-18-31 19q0 36 25 35m59-54q31-20 29 18q-2 32-23 37" fill="#bc754c"/>
    <path d="M65 105q0-35 35-35t35 35v21q0 31-35 31t-35-31z" fill="#f7c38d"/>
    <ellipse cx="100" cy="133" rx="23" ry="18" fill="#fff1dc" stroke="none"/>
    <path d="M81 112q5-6 10 0m19 0q5-6 10 0" fill="none"/>
    <path d="M95 126q5-4 10 0l-5 6z" fill="#65445b"/><path d="M100 132v5m-10 0q10 12 20 0" fill="none"/>
    <path d="M74 155l25 8-17 14zM125 155l-26 8 19 14z" fill="#ba98e0"/><circle cx="99" cy="163" r="5" fill="#ba98e0"/>
    <path d="M285 197q30-26 39-5q5 18-37 20" fill="#fff5e9"/>
    <path d="M226 228v-56q0-35 34-35t34 35v56" fill="#fff5e9"/>
    <path d="M235 83q-31-14-29 21q0 33 23 35m56-56q31-15 28 23q-2 29-22 34" fill="#c09bc9"/>
    <path d="M226 105q0-35 34-35t34 35v21q0 31-34 31t-34-31z" fill="#fff5e9"/>
    <ellipse cx="260" cy="133" rx="23" ry="18" fill="#f8dbc7" stroke="none"/>
    <path d="M241 112q5-6 10 0m19 0q5-6 10 0" fill="none"/>
    <path d="M255 126q5-4 10 0l-5 6z" fill="#65445b"/><path d="M260 132v5m-10 0q10 12 20 0" fill="none"/>
    <path d="M237 156q23 15 46 0l-5 17q-18 12-36 0z" fill="#f184a9"/>
    <rect x="108" y="160" width="144" height="78" rx="17" fill="#fffaf1" strokeWidth="4"/>
    <rect x="120" y="170" width="114" height="55" rx="10" fill="#d9c3ef" stroke="none"/>
    <path d="M176 184c-10-13-25 0-14 11l14 12 14-12c11-11-4-24-14-11" fill="#f184a9" stroke="none"/>
    <circle cx="243" cy="198" r="3" fill="#65445b" stroke="none"/>
    <ellipse cx="108" cy="188" rx="13" ry="10" fill="#f7c38d"/><ellipse cx="252" cy="188" rx="13" ry="10" fill="#fff5e9"/>
   </g>
   <path d="M151 113q29-27 59 0m0 0-3-15m3 15-16-1" fill="none" stroke="#9466b6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  <span className="landscape-ribbon">איזה כיף שבאת!</span>
  <h1 id="turn-device-title">פותחות את הסטודיו לרוחב</h1>
  <p>סובבי את המכשיר לרוחב, ובואי נשחק יחד.</p>
  <p className="small landscape-hint">המסך לא מסתובב? אפשר לשחרר את נעילת הסיבוב במכשיר.</p>
  <span className="landscape-reassurance">העיצוב וההתקדמות שלך נשמרים.</span>
 </div>}</>;
}
