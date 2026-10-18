import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpeakButton, speakHebrew } from './SpeakButton';
import { sayAloud } from '../learning/learnPath';

type Spoken = { text: string; lang: string; rate: number };
function fakeSpeech(voices: { lang: string; name: string }[]) {
  const spoken: Spoken[] = [];
  (globalThis as unknown as { window: unknown }).window = {
    speechSynthesis: {
      getVoices: () => voices,
      cancel: () => {},
      speak: (u: { text: string; lang: string; rate: number }) => spoken.push({ text: u.text, lang: u.lang, rate: u.rate }),
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  };
  (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = class {
    text: string; lang = ''; rate = 1; voice: unknown = null;
    constructor(t: string) { this.text = t; }
  };
  return spoken;
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe('hearing the fact read aloud', () => {
  it('speaks "שלוש כפול שלוש שווה תשע" in Hebrew, a little slower', () => {
    const spoken = fakeSpeech([{ lang: 'en-US', name: 'Samantha' }, { lang: 'he-IL', name: 'Carmit' }]);
    expect(speakHebrew(sayAloud(3, 3))).toBe(true);
    expect(spoken).toEqual([{ text: 'שלוש כפול שלוש שווה תשע', lang: 'he-IL', rate: 0.85 }]);
  });

  it('does nothing (and shows no button) on a device without a Hebrew voice', () => {
    const spoken = fakeSpeech([{ lang: 'en-US', name: 'Samantha' }]);
    expect(speakHebrew(sayAloud(3, 3))).toBe(false);
    expect(spoken).toHaveLength(0);
    expect(renderToStaticMarkup(createElement(SpeakButton, { text: sayAloud(3, 3) }))).toBe('');
  });

  it('shows the button when a Hebrew voice exists', () => {
    fakeSpeech([{ lang: 'he-IL', name: 'Carmit' }]);
    expect(renderToStaticMarkup(createElement(SpeakButton, { text: sayAloud(3, 4) }))).toContain('שמעי');
  });
});
