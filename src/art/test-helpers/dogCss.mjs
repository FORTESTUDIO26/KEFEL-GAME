import { readFileSync } from 'node:fs';

// Keep Node-only IO out of the TypeScript app compilation. Vitest stubs CSS imports.
export const dogLifeCss = readFileSync(new URL('../DogLife.css', import.meta.url), 'utf8');
