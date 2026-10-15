import { useCallback,useEffect,useRef } from 'react';
import { acquireBackgroundMusic } from './backgroundMusic';

/** Playback is shared across mounts and waits for a trusted click/touch/key gesture. */
export function useBackgroundMusic(enabled:boolean):()=>void {
  const cleanup=useRef<(()=>void)|null>(null);
  useEffect(()=>{
    const release=acquireBackgroundMusic(enabled);cleanup.current=release;
    return ()=>{release();if(cleanup.current===release)cleanup.current=null;};
  },[enabled]);
  return useCallback(()=>{cleanup.current?.();cleanup.current=null;},[]);
}

export function MusicPlayback({enabled}:{enabled:boolean}) {
  useBackgroundMusic(enabled);
  return null;
}

export { MusicPlayback as BackgroundMusic };

export { unlockBackgroundMusic } from './backgroundMusic';
