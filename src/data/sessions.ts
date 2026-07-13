import raw from './questions.json'
import imageMapRaw from './imageMap.json'
import artSourcesRaw from './artSources.json'
import type { Session } from '../types'

export interface ArtMeta {
  title: string
  artist: string
  tradition: string
  licence: string
  source: string
}

const artSources = artSourcesRaw as Record<string, ArtMeta>

// Look up artwork credit by image filename (keyed on base name, ext-agnostic)
export function artMetaFor(image: string): ArtMeta | undefined {
  return artSources[image.replace(/\.[a-z]+$/i, '')]
}

export const SESSIONS = raw.sessions as Session[]

export const WORLD_W = 2900
export const WORLD_H = 1900

// Normalized hub anchor positions on the world canvas (10 sessions)
export const HUB_ANCHORS: [number, number][] = [
  [0.18, 0.26],
  [0.4, 0.15],
  [0.62, 0.24],
  [0.83, 0.16],
  [0.24, 0.52],
  [0.5, 0.46],
  [0.76, 0.5],
  [0.18, 0.8],
  [0.46, 0.82],
  [0.72, 0.78],
]

// Per-session accents from the KIES logo family, darkened for the ivory background
export const SESSION_COLORS = [
  '#b8324f',
  '#1d6f9c',
  '#b34a6e',
  '#16735c',
  '#2f6f8f',
  '#216b45',
  '#8e2f4f',
  '#174a6b',
  '#2b8a75',
  '#a04a63',
]

const imageMap = imageMapRaw as Record<string, string>

export function imageFor(qid: string): string {
  return imageMap[qid] ?? 'art_02.jpg'
}
