/** What the hero's ink shader (hero.frag.glsl) reads; drawn by scroll3d.ts. */
import { SPLASH_SEGMENTS } from '../config'

/** Everything the fragment shader reads, in the prototype's units. */
export interface InkUniforms {
  /** Reveal progress. */
  p: number
  blotR: number
  aspect: number
  maxD: number
  blot: [number, number]
  /** Seconds since the impact. */
  t: number
  seed: number
  r0: number
  wet: number
  sunT: number
  sunR: number
  sun: [number, number]
  time: number
  fog: number
  fogSpeed: number
  seg: Float32Array
  rad: Float32Array
}

export const createSegmentBuffers = () => ({
  seg: new Float32Array(SPLASH_SEGMENTS * 4),
  rad: new Float32Array(SPLASH_SEGMENTS * 2),
})
