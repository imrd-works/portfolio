/**
 * Tuning knobs for the ink-on-scroll hero. Values come straight from the
 * prototype (`hero-prototype.html`); the prototype names are kept in the
 * comments so the two can be compared side by side.
 */

/** Cleaned ink painting (background flattened to pure white), served from `public/`. */
export const INK_IMAGE = {
  avif: '/hero/ink-valley.avif',
  webp: '/hero/ink-valley.webp',
  width: 2912,
  height: 1632,
} as const

export const INK_RATIO = INK_IMAGE.width / INK_IMAGE.height

/** Jets + flying drops + drips. Must match the `uSeg[26]` / `uRad[26]` arrays in hero.frag.glsl. */
export const SPLASH_SEGMENTS = 26

export interface InkConfig {
  /** `R0`: blot radius as a share of the painting height (same unit as in the shader). */
  blotRadius: number
  /** `REVEAL_DELAY`, ms: pause between the impact and the start of the reveal. */
  revealDelayMs: number
  /** `REVEAL_MS`: how long the painting takes to bloom out of the blot. */
  revealMs: number
  /** `P0`: reveal progress right after the impact. */
  progressStart: number
  /** `P_END`: runs past 1 so the far corners also get to "dry" into sharp strokes. */
  progressEnd: number
  /** `SUN_R`: sun radius as a share of the painting height. */
  sunRadius: number
  /** `SUN_AT`, ms after the impact: when the cinnabar drop falls. */
  sunAtMs: number
  /** `SUN_SETTLE`, s: the sun stops changing after this long. */
  sunSettleS: number
  /** `WET`: visibility of the damp trace on the still-blank sheet (0 turns it off). */
  wet: number
}

export const INK: Readonly<InkConfig> = {
  blotRadius: 0.046,
  revealDelayMs: 0,
  revealMs: 9400,
  progressStart: 0.035,
  progressEnd: 1.5,
  sunRadius: 0.04,
  sunAtMs: 3200,
  sunSettleS: 5,
  wet: 0.05,
}

/** Timeline of the captions, ms after the impact. */
export const CAPTION_TIMING = {
  name: 3000,
  role: 4000,
  seal: 4600,
  controls: 5200,
} as const

/** `__fog` in the prototype. Mutable: the toggle button and the dev console change it live. */
export interface FogConfig {
  on: boolean
  /** Haze amplitude, 0..1.5. */
  strength: number
  /** Left-to-right drift, noise units per second. */
  speed: number
  /** Lowest tone the mist lives in (0 is paper, 1 is solid ink). */
  lo: number
  /** Highest tone: darker ridges count as near and get no mist. */
  hi: number
}

export const FOG_DEFAULTS: Readonly<FogConfig> = {
  on: true,
  strength: 1.0,
  speed: 0.07,
  lo: 0.1,
  hi: 0.7,
}
