import '@fontsource/rubik/hebrew-400.css';
import '@fontsource/rubik/hebrew-500.css';
import '@fontsource/rubik/hebrew-700.css';
import '@fontsource/rubik/latin-400.css';
import '@fontsource/rubik/latin-500.css';
import '@fontsource/rubik/latin-700.css';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Root, type Boot } from './Root';
import { defaultSave, detectStorage, loadSave } from './state/save';
import { protectStorage, watchInstallPrompt } from './ui/device';
import { PLAYERS_KEY } from './state/profiles';
import { LandscapeOnly } from './ui/LandscapeOnly';

watchInstallPrompt();

const storage = detectStorage();
const now = Date.now();
let boot: Boot;
if (!storage) {
  boot = { kind: 'ready', data: defaultSave(now), fresh: true };
} else {
  // Once migrated, the preserved legacy file is only a recovery copy; it must not be
  // loaded/repaired repeatedly or cause backups on every visit to the profile game.
  let hasPlayers=false;
  try { hasPlayers=storage.getItem(PLAYERS_KEY)!==null; } catch { /* bootstrap reports read failure */ }
  const r = hasPlayers ? {status:'new' as const,data:defaultSave(now)} : loadSave(storage, now);
  boot =
    r.status === 'corrupt'
      ? { kind: 'corrupt', raw: r.raw, errors: r.errors, backupKey: r.backupKey }
      : { kind: 'ready', data: r.data, fresh: r.status === 'new' };
}

const root = createRoot(document.getElementById('root')!);
if (import.meta.env.DEV && location.search.includes('gallery')) {
  void import('./dev/Gallery').then(({ Gallery }) => root.render(<Gallery />));
} else {
  root.render(
    <StrictMode>
      <LandscapeOnly><Root boot={boot} storage={storage} /></LandscapeOnly>
    </StrictMode>
  );
}

// Ask the browser to keep the saved game (iPhone/Android may otherwise clear unused site data).
if (storage) void protectStorage();

// Offline support after the first successful load (production build only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // A new version took over (e.g. an iPhone home-screen app resumed after an update):
    // reload once, at a calm moment, so the old version never stays on screen. The game is saved.
    const hadController = !!navigator.serviceWorker.controller;
    let pendingReload = false;
    const loadedAt = Date.now();
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return;
      if (document.visibilityState === 'hidden' || Date.now() - loadedAt < 15000) location.reload();
      else pendingReload = true;
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (pendingReload) location.reload();
      else navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => undefined);
    });
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(async () => {
        // Files loaded before the worker took control are cached here.
        if (!('caches' in window)) return;
        // Make sure every font weight is downloaded once, so it is available offline too.
        await Promise.all(
          ['400', '500', '700'].map((w) => document.fonts?.load(`${w} 16px Rubik`, 'אבג 123').catch(() => undefined))
        );
        // the same cache the worker uses (see public/sw.js), so an update clears it
        const cache = await caches.open('liori-studio-v14-flow');
        const urls = performance
          .getEntriesByType('resource')
          .map((e) => e.name)
          .filter((u) => u.startsWith(location.origin));
        await Promise.all([location.href.split('#')[0], ...urls].map((u) => cache.add(u).catch(() => undefined)));
        // Drop files left over from older versions of the game.
        const current = new Set(urls);
        for (const req of await cache.keys()) {
          if (req.url.includes('/assets/') && !current.has(req.url)) await cache.delete(req);
        }
      })
      .catch(() => undefined);
  });
}
