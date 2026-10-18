// "שמעי": reads a fact aloud with the device's own Hebrew voice (no recordings to download).
// Shown only when the device actually has a Hebrew voice, so the button never fails silently.
import { useEffect, useState } from 'react';
import { Icon } from './icons';

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

export function hebrewVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const voices = s.getVoices();
  return voices.find((v) => /^he|^iw/i.test(v.lang)) ?? null;
}

/** Speak Hebrew text aloud; returns false when the device has no Hebrew voice. */
export function speakHebrew(text: string): boolean {
  const s = synth();
  const voice = hebrewVoice();
  if (!s || !voice) return false;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.85; // a little slower, easy to repeat after
  s.speak(u);
  return true;
}

function useHebrewVoice(): boolean {
  const [ok, setOk] = useState(() => !!hebrewVoice());
  useEffect(() => {
    const s = synth();
    if (!s) return;
    const update = () => setOk(!!hebrewVoice());
    update();
    // voices load asynchronously on most phones
    s.addEventListener?.('voiceschanged', update);
    return () => s.removeEventListener?.('voiceschanged', update);
  }, []);
  return ok;
}

export function SpeakButton({ text }: { text: string }) {
  const available = useHebrewVoice();
  useEffect(() => () => synth()?.cancel(), []);
  if (!available) return null;
  return (
    <button type="button" className="speak-btn" onClick={() => speakHebrew(text)} aria-label={`להשמיע: ${text}`}>
      <Icon name="sound" size={20} /> שמעי
    </button>
  );
}
