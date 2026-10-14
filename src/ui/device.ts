// Phone helpers: home-screen install, storage protection and saving files through the share sheet.

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installEvent: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

/** Android Chrome offers an install prompt; keep it so a button can show it later. */
export function watchInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e as InstallPromptEvent;
    listeners.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    listeners.forEach((f) => f());
  });
}

export function canPromptInstall(): boolean {
  return installEvent !== null;
}

export function onInstallChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

export async function promptInstall(): Promise<boolean> {
  if (!installEvent) return false;
  await installEvent.prompt();
  const choice = await installEvent.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
  installEvent = null;
  listeners.forEach((f) => f());
  return choice.outcome === 'accepted';
}

/** Opened from the home screen (iPhone or Android)? */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/** Ask the browser not to clear the saved game automatically (where supported). */
export async function protectStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function storageProtected(): Promise<boolean | null> {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null;
  } catch {
    return null;
  }
}

export type SaveResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

const touchDevice = () => window.matchMedia?.('(pointer: coarse)').matches === true;

/**
 * Save a file on the device. On phones the share sheet is used when it accepts the file
 * (iPhone: "שמירת תמונה" puts a picture in Photos; "שמירה בקבצים" for backups);
 * otherwise the file is downloaded.
 */
export async function saveFile(blob: Blob, fileName: string, title: string): Promise<SaveResult> {
  const file = new File([blob], fileName, { type: blob.type });
  if (touchDevice() && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // fall through to a download
    }
  }
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
