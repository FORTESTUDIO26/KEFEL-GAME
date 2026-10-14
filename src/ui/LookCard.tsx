import { forwardRef, useEffect, useRef, type RefObject } from 'react';
import { DogFigure } from '../art/Dog';
import { Backdrop } from '../art/Scenes';
import { paletteById, type BackdropId } from '../content/catalog';
import { dogById } from '../content/dogs';
import type { Outfit } from '../state/types';
import { saveFile, type SaveResult } from './device';

export interface LookCardProps {
  dogId: string;
  outfit: Outfit;
  backdrop: BackdropId;
  title: string;
  paletteId: string;
}

/** A polaroid-style photo of a look. Pure SVG so it can also be saved as an image. */
export const LookCard = forwardRef<SVGSVGElement, LookCardProps>(function LookCard({ dogId, outfit, backdrop, title, paletteId }, ref) {
  const p = paletteById(paletteId);
  const dog = dogById(dogId);
  return (
    <svg ref={ref} className="look-card" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${title} — ${dog.name}`}>
      <rect width={400} height={500} fill="#ffffff" />
      <svg x={0} y={0} width={400} height={440} viewBox="0 0 400 440">
        <Backdrop id={backdrop} p={p} />
        <ellipse cx={200} cy={344} rx={110} ry={16} fill="#000" opacity={0.12} />
        <g transform="translate(80 100)">
          <DogFigure dog={dog} outfit={outfit} asGroup />
        </g>
      </svg>
      <text x={200} y={478} textAnchor="middle" direction="rtl" fontSize={24} fontWeight={600} fill="#3b2d4f" fontFamily="Rubik, Arial, sans-serif">
        {title}
      </text>
    </svg>
  );
});

/** The card as a PNG image. */
export async function lookToPng(svg: SVGSVGElement): Promise<Blob | null> {
  try {
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image'));
      // a data URL works in Safari, Chrome and Firefox without tainting the canvas
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    });
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 1000);
    ctx.drawImage(img, 0, 0, 800, 1000);
    return await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  } catch {
    return null;
  }
}

/** Save the card as a picture on the device (share sheet on phones, download elsewhere). */
export async function downloadLook(svg: SVGSVGElement, fileName: string, title: string, prepared?: Blob | null): Promise<SaveResult> {
  // Safari opens the share sheet only right after a tap, so a ready-made image is used when there is one.
  const blob = prepared ?? (await lookToPng(svg));
  if (!blob) return 'failed';
  return saveFile(blob, fileName, title);
}

/** Keeps a PNG of the card ready (re-made shortly after the card changes). */
export function usePreparedPng(ref: RefObject<SVGSVGElement | null>, deps: unknown[]): RefObject<Blob | null> {
  const blob = useRef<Blob | null>(null);
  useEffect(() => {
    blob.current = null;
    const t = setTimeout(async () => {
      if (ref.current) blob.current = await lookToPng(ref.current);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return blob;
}

export function saveMessage(r: SaveResult): string | null {
  if (r === 'shared') return null;
  if (r === 'cancelled') return null;
  if (r === 'downloaded') return 'התמונה נשמרה בתיקיית ההורדות';
  return 'הדפדפן הזה לא מאפשר לשמור תמונה. אפשר לצלם מסך.';
}

export function safeFileName(title: string): string {
  return `${title.replace(/[\\/:*?"<>|]+/g, '').trim() || 'look'}.png`;
}
