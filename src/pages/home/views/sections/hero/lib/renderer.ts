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
  /** The evening: how far the sun has gone down, how far the moon has come up (0..1). */
  s: number
  m: number
  /** The sun's arc: its control point and its end, behind the hills (painting uv). */
  sunC: [number, number]
  set: [number, number]
  /** The height the glow over the horizon is born at. */
  setHz: number
  moon0: [number, number]
  moonC: [number, number]
  moon1: [number, number]
  moonR: number
  /** The slits the sun goes into and the moon comes out of (painting y). */
  band: number
  mband: number
  /** How far each slit's stroke has been laid, and taken away again (0..1), in real time. */
  sunDraw: number
  sunGone: number
  moonDraw: number
  moonGone: number
  /** The painting fades out from the top: fully shown below [0], gone above [1] (painting y). */
  fade: [number, number]
}

export const createSegmentBuffers = () => ({
  seg: new Float32Array(SPLASH_SEGMENTS * 4),
  rad: new Float32Array(SPLASH_SEGMENTS * 2),
})
