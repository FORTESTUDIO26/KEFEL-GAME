import { useEffect,useRef,useState,type ReactNode } from 'react';
import './LandscapeOnly.css';
export function LandscapeOnly({children}:{children:ReactNode}) {
 const [portrait,setPortrait]=useState(()=>window.matchMedia('(orientation: portrait)').matches);
 const content=useRef<HTMLDivElement>(null),gate=useRef<HTMLDivElement>(null);
 useEffect(()=>{const query=window.matchMedia('(orientation: portrait)');const changed=()=>setPortrait(query.matches);query.addEventListener('change',changed);changed();return()=>query.removeEventListener('change',changed);},[]);
 useEffect(()=>{content.current?.toggleAttribute('inert',portrait);if(portrait)gate.current?.focus();},[portrait]);
 return <><div ref={content} aria-hidden={portrait||undefined}>{children}</div>{portrait&&<div ref={gate} className="landscape-only" role="dialog" aria-modal="true" aria-labelledby="turn-device-title" tabIndex={-1}><svg viewBox="0 0 180 130" width="180" height="130" aria-hidden="true"><rect x="40" y="30" width="100" height="64" rx="14" fill="#fff" stroke="#72588d" strokeWidth="6"/><rect x="51" y="40" width="78" height="44" rx="7" fill="#d9eee8"/><circle cx="134" cy="62" r="3" fill="#72588d"/><path d="M35 25Q90 -7 150 30M150 30L145 10M150 30L130 28" fill="none" stroke="#b387d9" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg><h1 id="turn-device-title">משחקות רק לרוחב</h1><p>סובבי את המכשיר לרוחב כדי לפתוח את הסטודיו.</p><p className="small">אם המסך לא מסתובב, בטלי את נעילת הסיבוב במכשיר.</p><span>העיצוב וההתקדמות שלך נשמרים.</span></div>}</>;
}
