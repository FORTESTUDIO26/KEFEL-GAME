import { useEffect, useState, type CSSProperties } from 'react';
import { paletteById } from './content/catalog';
import { ClientFlow, type ClientSession } from './screens/ClientFlow';
import { LearnFlow } from './screens/LearnFlow';
import { Album } from './screens/Album';
import { Onboarding } from './screens/Onboarding';
import { ParentArea } from './screens/ParentArea';
import { Shop } from './screens/Shop';
import { Studio } from './screens/Studio';
import { Wardrobe } from './screens/Wardrobe';
import { Home } from './screens/Home';
import { useStore } from './state/store';
import { CoinAmount, Modal } from './ui/common';
import { Icon, type IconName } from './ui/icons';
import { useBackgroundMusic,unlockBackgroundMusic } from './ui/MusicPlayback';
import { setSoundEnabled, sfx } from './ui/sound';
import { InstallHelp } from './ui/InstallHelp';
import { ToastProvider } from './ui/toast';
import { PlayBalance, usePlayClock } from './ui/PlayBalance';
import type { SaveData } from './state/types';
import './landscape.css';
import './immersive-room.css';
import './playful-theme.css';
import './interaction-polish.css';
import './interaction-layout.css';
import './living-world.css';
import './hud-fixes.css';
import './flow.css';
import './toy.css';
import './toy-screens.css';
import './toy-learn.css';

export type Screen = 'home' | 'studio' | 'learn' | 'client' | 'wardrobe' | 'shop' | 'album' | 'parent' | 'profiles';

/** the top bar keeps only the loop: home and the room (everything else lives in the room's "עוד" menu) */
const NAV: { id: Screen; label: string; icon: IconName }[] = [
  { id: 'home', label: 'בית', icon: 'home' },
  { id: 'studio', label: 'לעצב', icon: 'brush' },
];
/** the full list, in the menu */
const MENU: { id: Screen; label: string; icon: IconName }[] = [
  ...NAV,
  { id: 'learn', label: 'לומדות וזוכרות', icon: 'sparkle' },
  { id: 'client', label: 'לקוחות', icon: 'paw' },
  { id: 'wardrobe', label: 'מלתחה', icon: 'hanger' },
  { id: 'shop', label: 'חנות', icon: 'bag' },
  { id: 'album', label: 'אלבום', icon: 'album' },
];

export function App({playerName='ליאורי',onSwitchPlayer}:{playerName?:string;onSwitchPlayer?:(save:SaveData)=>void}) {
  const { save, update, persistent, flush } = useStore();
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<ClientSession | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [storageNoteHidden, setStorageNoteHidden] = useState(false);
  const p = paletteById(save.profile.paletteId);

  useBackgroundMusic(save.settings.sound);
  usePlayClock(save.profile.onboarded ? screen : 'parent');
  useEffect(() => setSoundEnabled(save.settings.sound), [save.settings.sound]);
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', save.settings.reduceMotion);
  }, [save.settings.reduceMotion]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  const vars = {
    '--accent': p.accent,
    '--accent2': p.accent2,
    '--soft': p.soft,
    '--wall': p.wall,
  } as CSSProperties;

  const go = (s: Screen) => {
    if(s==='profiles'){switchPlayer();return;}
    sfx.tap();
    setMenuOpen(false);
    if (s === 'parent') {
      setGateOpen(true);
      return;
    }
    setScreen(s);
  };
  const switchPlayer = () => { flush(); onSwitchPlayer?.(save); };

  if (!save.profile.onboarded) {
    return (
      <ToastProvider>
        <div className="app" style={vars}>
          {onSwitchPlayer&&<button className="player-switch onboarding-player-switch" onClick={switchPlayer}>מי משחקת? · {playerName}</button>}
          <Onboarding />
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app" style={vars}>
        {screen !== 'home' && screen !== 'learn' && <header className="topbar">
          <button className="brand" onClick={() => go('home')} aria-label="למסך הבית">
            <span className="brand-dot" aria-hidden="true">
              <Icon name="paw" size={20} />
            </span>
            <span className="brand-name">{save.profile.studioName}</span>
          </button>
          <nav className="nav" aria-label="ניווט ראשי">
            {NAV.map((n) => (
              <button key={n.id} className={`nav-btn ${screen === n.id ? 'active' : ''}`} onClick={() => go(n.id)} aria-current={screen === n.id ? 'page' : undefined}>
                <Icon name={n.icon} />
                <span>{n.label}</span>
                {n.id === 'client' && session && session.phase !== 'done' && <span className="nav-badge" aria-label="לקוח מחכה" />}
                {n.id === 'learn' && save.learning.learnSession && <span className="nav-badge" aria-label="שיעור שעצרנו באמצע" />}
              </button>
            ))}
          </nav>
          <div className="topbar-end">
            {onSwitchPlayer&&<button className="player-switch" onClick={switchPlayer} aria-label="החלפת פרופיל">{playerName} · החלפה</button>}
            <span className="coins-pill" aria-label={`${save.coins} מטבעות`}>
              <CoinAmount value={save.coins} />
            </span>
            <button
              className="icon-btn"
              onClick={() => {const next=!save.settings.sound;setSoundEnabled(next);if(next){unlockBackgroundMusic();sfx.tap();}update((s) => ({ ...s, settings: { ...s.settings, sound:next } }));}}
              aria-label={save.settings.sound ? 'השתקת צלילים' : 'הפעלת צלילים'}
              aria-pressed={!save.settings.sound}
            >
              <Icon name={save.settings.sound ? 'sound' : 'mute'} />
            </button>
            <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="תפריט">
              <Icon name="menu" />
            </button>
          </div>
        </header>}

        {!persistent && !storageNoteHidden && (
          <div className="storage-banner" role="alert">
            <span>
              השמירה בדפדפן הזה לא זמינה כרגע — אפשר לשחק, אבל ההתקדמות תישמר רק עד סגירת הדף. הורים: אפשר לייצא קובץ גיבוי מאזור ההתקדמות.
            </span>
            <button className="ghost small" onClick={() => setStorageNoteHidden(true)}>
              הבנתי
            </button>
          </div>
        )}

        <main className="main" id="main">
          {screen === 'home' && <Home onGo={go} playerName={playerName} onSwitchPlayer={onSwitchPlayer ? switchPlayer : undefined} />}
          {screen === 'studio' && <Studio onGo={go} hasClient={!!session && session.phase !== 'done'} />}
          {screen === 'learn' && <LearnFlow onGo={go} />}
          {screen === 'client' && <ClientFlow session={session} setSession={setSession} onGo={go} />}
          {screen === 'wardrobe' && <Wardrobe onGo={go} />}
          {screen === 'shop' && <Shop />}
          {screen === 'album' && <Album onGo={go} />}
          {screen === 'parent' && <ParentArea playerName={playerName} onExit={() => setScreen('home')} />}
        </main>

        <PlayBalance screen={screen} onGo={go} />

        {menuOpen && (
          <Modal title="תפריט" onClose={() => setMenuOpen(false)}>
            <div className="menu-list">
              {onSwitchPlayer&&<button className="menu-item" onClick={switchPlayer}><Icon name="paw"/> מי משחקת? · {playerName}</button>}
              {MENU.map((n) => (
                <button key={n.id} className="menu-item" onClick={() => go(n.id)}>
                  <Icon name={n.icon} /> {n.label}
                </button>
              ))}
              <button
                className="menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  setInstallOpen(true);
                }}
              >
                <Icon name="download" /> הוספה למסך הבית
              </button>
              <hr />
              <button className="menu-item parent-link" onClick={() => go('parent')}>
                <Icon name="chart" /> ההתקדמות של {playerName} (להורים)
              </button>
            </div>
          </Modal>
        )}

        {installOpen && <InstallHelp onClose={() => setInstallOpen(false)} />}

        {gateOpen && (
          <ParentGate
            onCancel={() => setGateOpen(false)}
            onEnter={() => {
              setGateOpen(false);
              setScreen('parent');
            }}
          />
        )}
      </div>
    </ToastProvider>
  );
}

/** A deliberate action (press and hold) separates the parent area from the game. */
function ParentGate({ onEnter, onCancel }: { onEnter: () => void; onCancel: () => void }) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  useEffect(() => {
    if (!holding) {
      setProgress(0);
      return;
    }
    const started = Date.now();
    const t = setInterval(() => {
      const v = Math.min(1, (Date.now() - started) / 1500);
      setProgress(v);
      if (v >= 1) {
        clearInterval(t);
        onEnter();
      }
    }, 50);
    return () => clearInterval(t);
  }, [holding, onEnter]);
  return (
    <Modal title="אזור להורים" onClose={onCancel}>
      <div className="stack">
        <p>כאן אפשר לראות את ההתקדמות בלוח הכפל ולשנות הגדרות. כדי להיכנס, לחצו והחזיקו את הכפתור.</p>
        <button
          className="hold-btn"
          onPointerDown={() => setHolding(true)}
          onPointerUp={() => setHolding(false)}
          onPointerLeave={() => setHolding(false)}
          onPointerCancel={() => setHolding(false)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
              e.preventDefault();
              setHolding(true);
            }
          }}
          onKeyUp={() => setHolding(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <span className="hold-fill" style={{ width: `${progress * 100}%` }} />
          <span className="hold-label">החזיקו כדי להיכנס</span>
        </button>
        <button className="ghost" onClick={onCancel}>
          חזרה למשחק
        </button>
      </div>
    </Modal>
  );
}
