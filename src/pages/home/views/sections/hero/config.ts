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

/**
 * The evening. Where the sun sets and the moon comes up are shares of the part of the
 * painting the screen shows (like the sun's own place), so they stay in view on any screen.
 */
export const EVENING = {
  /** The sun sets here, over to the right, along an arc through `sunArcAt`. */
  sunSetAt: 0.71,
  sunArcAt: 0.74,
  moonRadius: 0.034,
  /** The moon comes up out of its slit here, by the name (on a narrow screen, above the painting). */
  moonAt: 0.43,
  moonAtNarrow: 0.365,
} as const

/**
 * The river, traced on the painting: from the valley down to its mouth (painting uv, y up)
 * and its half-width (uv x). Must match `uRiver[9]` / `uHw[9]` in hero.frag.glsl.
 */
export const RIVER = {
  points: [
    [0.515, 0.345],
    [0.53, 0.3],
    [0.537, 0.266],
    [0.558, 0.241],
    [0.578, 0.217],
    [0.598, 0.192],
    [0.607, 0.168],
    [0.623, 0.143],
    [0.64, 0.115],
  ],
  halfWidth: [0.03, 0.03, 0.024, 0.022, 0.025, 0.02, 0.022, 0.026, 0.034],
} as const

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
  /** How thick the banks are, 0..1.5. */
  strength: number
  /** Left-to-right drift, noise units per second: 0.055 crosses the painting in ~40 s, as over the river. */
  speed: number
}

export const FOG_DEFAULTS: Readonly<FogConfig> = {
  on: true,
  strength: 1.0,
  speed: 0.055,
}
