import type { JSX } from 'react';
import type { Palette } from '../../content/catalog';

/** Draws one room's architecture (never selectable) for the chosen wall / floor / palette. */
export type RoomSceneryFn = (props: { wall: string; floor: string; p: Palette }) => JSX.Element;
