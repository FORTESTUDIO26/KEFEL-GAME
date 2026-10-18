// Small original UI icons.

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export type IconName =
  | 'home' | 'paw' | 'hanger' | 'bag' | 'album' | 'chart' | 'sound' | 'mute' | 'menu' | 'close' | 'bulb' | 'camera'
  | 'trash' | 'undo' | 'flip' | 'plus' | 'minus' | 'check' | 'arrowL' | 'arrowR' | 'arrowU' | 'arrowD' | 'download'
  | 'upload' | 'edit' | 'sparkle' | 'heart' | 'brush' | 'bone' | 'bubbles' | 'lock' | 'star' | 'sofa' | 'clock';

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const p = (() => {
    switch (name) {
      case 'home': return <><path {...S} d="M4 11 12 4l8 7" /><path {...S} d="M6 10v9h12v-9" /><path {...S} d="M10 19v-5h4v5" /></>;
      case 'paw': return <><ellipse cx="12" cy="16" rx="4.5" ry="3.6" fill="currentColor" /><circle cx="6.5" cy="11" r="2" fill="currentColor" /><circle cx="17.5" cy="11" r="2" fill="currentColor" /><circle cx="9.5" cy="7.5" r="2" fill="currentColor" /><circle cx="14.5" cy="7.5" r="2" fill="currentColor" /></>;
      case 'hanger': return <><path {...S} d="M12 7a2 2 0 1 1 2-2c0 1.2-2 1.6-2 3v1" /><path {...S} d="M12 9 3 16.5c-.6.6-.2 1.5.6 1.5h16.8c.8 0 1.2-.9.6-1.5Z" /></>;
      case 'bag': return <><path {...S} d="M5 8h14l-1 12H6Z" /><path {...S} d="M9 8V6a3 3 0 0 1 6 0v2" /></>;
      case 'album': return <><rect {...S} x="4" y="4" width="16" height="16" rx="3" /><path {...S} d="m6 17 4-5 3 3 2-2 3 4" /><circle cx="15" cy="9" r="1.6" fill="currentColor" /></>;
      case 'chart': return <><path {...S} d="M5 19V5" /><path {...S} d="M5 19h14" /><path {...S} d="M9 15v-3M13 15V9M17 15v-6" /></>;
      case 'sound': return <><path {...S} d="M4 10v4h3l5 4V6L7 10Z" /><path {...S} d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></>;
      case 'mute': return <><path {...S} d="M4 10v4h3l5 4V6L7 10Z" /><path {...S} d="m16 10 4 4M20 10l-4 4" /></>;
      case 'menu': return <path {...S} d="M4 7h16M4 12h16M4 17h16" />;
      case 'close': return <path {...S} d="M6 6l12 12M18 6 6 18" />;
      case 'bulb': return <><path {...S} d="M9 17h6M10 20h4" /><path {...S} d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 2V17h5.2v-1.1c0-.8.3-1.5.9-2A6 6 0 0 0 12 3Z" /></>;
      case 'camera': return <><path {...S} d="M4 8h3l2-2.5h6L17 8h3v11H4Z" /><circle {...S} cx="12" cy="13" r="3.5" /></>;
      case 'trash': return <><path {...S} d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></>;
      case 'undo': return <><path {...S} d="M8 8 4 12l4 4" /><path {...S} d="M4 12h10a5 5 0 0 1 0 10h-2" /></>;
      case 'flip': return <><path {...S} d="M12 3v18" strokeDasharray="2 3" /><path {...S} d="M9 7 4 17h5Z" /><path {...S} d="m15 7 5 10h-5Z" /></>;
      case 'plus': return <path {...S} d="M12 5v14M5 12h14" />;
      case 'minus': return <path {...S} d="M5 12h14" />;
      case 'check': return <path {...S} d="m5 12 5 5 9-10" />;
      case 'arrowL': return <path {...S} d="M15 5 8 12l7 7" />;
      case 'arrowR': return <path {...S} d="m9 5 7 7-7 7" />;
      case 'arrowU': return <path {...S} d="m5 15 7-7 7 7" />;
      case 'arrowD': return <path {...S} d="m5 9 7 7 7-7" />;
      case 'download': return <><path {...S} d="M12 4v11M7 10l5 5 5-5" /><path {...S} d="M5 19h14" /></>;
      case 'upload': return <><path {...S} d="M12 16V5M7 10l5-5 5 5" /><path {...S} d="M5 19h14" /></>;
      case 'edit': return <><path {...S} d="M5 19h4L19 9l-4-4L5 15Z" /></>;
      case 'sparkle': return <path fill="currentColor" d="M12 2c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Zm6 11c.3 2.2 1.1 3 3.3 3.3-2.2.3-3 1.1-3.3 3.3-.3-2.2-1.1-3-3.3-3.3 2.2-.3 3-1.1 3.3-3.3Z" />;
      case 'heart': return <path fill="currentColor" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />;
      case 'brush': return <><path {...S} d="M14 4l6 6-8 8-6-6Z" /><path {...S} d="M6 12l-2 6 6-2" /></>;
      case 'bone': return <path {...S} d="M7 9a2.5 2.5 0 1 1 2-4l6 6a2.5 2.5 0 1 1 4 2 2.5 2.5 0 1 1-4 2L9 9a2.5 2.5 0 1 1-2 0Z" />;
      case 'bubbles': return <><circle {...S} cx="8" cy="14" r="4" /><circle {...S} cx="16" cy="9" r="3" /><circle {...S} cx="17" cy="17" r="2" /></>;
      case 'sofa': return <><path {...S} d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" /><path {...S} d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v4H3z" /><path {...S} d="M5 17v2M19 17v2" /></>;
      case 'clock': return <><circle {...S} cx="12" cy="12" r="8.5" /><path {...S} d="M12 7.5V12l3 2" /></>;
      case 'lock': return <><rect {...S} x="5" y="11" width="14" height="9" rx="2" /><path {...S} d="M8 11V8a4 4 0 0 1 8 0v3" /></>;
      case 'star': return <path fill="currentColor" d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8Z" />;
    }
  })();
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {p}
    </svg>
  );
}

export function Coin({ size = 22 }: { size?: number }) {
  return (
    <svg className="coin" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#f2c14e" stroke="#c9952a" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="6.8" fill="none" stroke="#fff3c4" strokeWidth="1.4" />
      <ellipse cx="12" cy="13.6" rx="2.6" ry="2.1" fill="#c9952a" />
      <circle cx="9.2" cy="10.6" r="1.1" fill="#c9952a" />
      <circle cx="14.8" cy="10.6" r="1.1" fill="#c9952a" />
      <circle cx="10.8" cy="8.8" r="1.1" fill="#c9952a" />
      <circle cx="13.2" cy="8.8" r="1.1" fill="#c9952a" />
    </svg>
  );
}
