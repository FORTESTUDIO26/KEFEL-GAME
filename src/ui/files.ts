import { saveFile, type SaveResult } from './device';

/** Save a text file (backup) — share sheet on phones when it accepts the file, download otherwise. */
export function downloadText(text: string, fileName: string, type = 'application/json'): Promise<SaveResult> {
  return saveFile(new Blob([text], { type }), fileName, fileName);
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}
