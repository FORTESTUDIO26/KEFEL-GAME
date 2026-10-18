// The game's look (2026-10-18): bold and colourful, inspired by toy-like dollhouse games — original art.
// Dark plum outlines, flat saturated fills, white "sticker" edges on things you can pick up.
// Walls and floors stay a little lighter so the objects and characters pop in front of them.

/** outline colour for every drawn thing */
export const INK = '#33203f';
/** outline widths in the drawing's own units (room objects are drawn ~1 unit = 1 px at scale 1) */
export const LINE = { thin: 2, base: 3, bold: 4 } as const;

/** the saturated colours objects, clothes and UI use */
export const COLORS = {
  red: '#f0443a',
  coral: '#ff6f61',
  orange: '#ff8a1f',
  sun: '#ffc93c',
  lime: '#7ccf3a',
  green: '#22a95b',
  mint: '#2ec4b6',
  sky: '#2f9bff',
  blue: '#3d5afe',
  grape: '#8c4dff',
  pink: '#ff5fa2',
  berry: '#d6246e',
  wood: '#c9824f',
  woodDark: '#8a5232',
  cream: '#fff3dc',
  white: '#ffffff',
  grey: '#9aa3b5',
  charcoal: '#3c3f52',
} as const;

/** lighter tones for walls / floors (still clearly coloured, not washed out) */
export const SURFACES = {
  pinkWall: '#ffc6dc',
  mintWall: '#b8efe3',
  skyWall: '#bfe0ff',
  sunWall: '#ffe8a3',
  lilacWall: '#dcc8ff',
  woodFloor: '#e0a46f',
  woodFloorDark: '#c98a55',
  tileFloor: '#e9eef7',
} as const;

/** UI tokens (buttons, panels, the item menu) */
export const UI = {
  bar: '#2ec4b6',
  barDark: '#169c90',
  panel: '#fffaf0',
  cta: '#ff8a1f',
  ctaDark: '#d96a06',
  shop: '#22a95b',
} as const;
