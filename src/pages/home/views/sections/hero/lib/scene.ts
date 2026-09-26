/**
 * The hero scene outside of Vue: the scroll unrolls the hanging scroll (in 3D,
 * edge to edge), a drop of ink falls from the top, the painting blooms out of
 * the blot, then a cinnabar drop becomes the sun and the mist keeps drifting.
 * Then the evening (lib/evening.ts): a scroll at the top sends the sun down
 * into a slit cut with the brush and brings the moon up out of another, before
 * the page moves on.
 * Without WebGL2 the flat CSS scroll unrolls with the plain image on it.
 *
 * Ported from `hero-prototype.html` with the logic unchanged. The only
 * structural difference: CSS custom properties are written to the section
 * root instead of `document.documentElement`, and caption visibility is
 * reported through `hooks` so Vue owns the classes.
 */
import { holdScroll, type ScrollHold } from './hold'
import { createEvening } from './evening'
import { heightAt, readSkyline, type Skyline } from './skyline'
import {
  CAPTION_TIMING,
  EVENING,
  FOG_DEFAULTS,
  INK,
  INK_RATIO as RATIO,
  type FogConfig,
} from '../config'
import { createSegmentBuffers } from './renderer'
import { createScroll3D, type Scroll3D } from './scroll3d'
import { makeSplash, updateSplash, type SplashPart } from '@/shared/lib/ink/splash'

export type Caption = keyof typeof CAPTION_TIMING

export interface SceneElements {
  /** The tall scroll track (`.hero` in the prototype). */
  root: HTMLElement
  stage: HTMLElement
  paper: HTMLElement
  sheet: HTMLElement
  /** The 3D scroll's canvas, over the whole stage. */
  canvas: HTMLCanvasElement
  /** The <img> inside <picture>: the WebGL texture source and the no-WebGL fallback. */
  art: HTMLImageElement
  drop: HTMLElement
  sunDrop: HTMLElement
}

export interface SceneHooks {
  show(caption: Caption): void
  /** Hides every caption again (replay, or the scroll rolled back up). */
  hideCaptions(): void
  /** WebGL2 is out: drop the canvas, unroll the flat scroll with the plain image. */
  useImageFallback(): void
  /** Fallback image fade (only used without WebGL). */
  showArt(on: boolean): void
}

export interface InkScene {
  replay(): void
  setFog(on: boolean): void
  destroy(): void
}

declare global {
  interface Window {
    __ink?: { at(ts: number, sunT?: number, time?: number): void }
    __fog?: FogConfig
  }
}

const REVEAL_DELAY = INK.revealDelayMs / 1000
const easeSpread = (t: number) => 1 - Math.pow(1 - t, 1.55)

export function mountInkScene(els: SceneElements, hooks: SceneHooks): InkScene {
  const { root, stage, paper, sheet, canvas, art, drop: dropEl, sunDrop: sunEl } = els
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const { blotRadius: R0, sunRadius: SUN_R, wet: WET, progressStart: P0, progressEnd: P_END } = INK

  const FOG: FogConfig = { ...FOG_DEFAULTS, on: FOG_DEFAULTS.on && !REDUCED }

  let renderer: Scroll3D | null = null
  let fallback = false
  let destroyed = false

  const state = {
    time: 0,
    fogIn: 0,
    sunT: -1,
    sun: [0.64, 0.85] as [number, number],
    p: -0.1,
    blotR: 0,
    blot: [0.2, 0.28] as [number, number],
    maxD: 1.6,
    t: 0,
    seed: 1.7,
    ...createSegmentBuffers(),
    // the evening
    s: 0,
    m: 0,
    sunC: [0.67, 0.85] as [number, number],
    set: [0.67, 0.64] as [number, number],
    setHz: 0.6,
    moon0: [0.43, 0.64] as [number, number],
    moonC: [0.43, 0.85] as [number, number],
    moon1: [0.46, 0.85] as [number, number],
    /** The slits the sun goes into and the moon comes out of (painting y). */
    band: 0.7,
    mband: 0.7,
    /** The painting fades out above this: fully shown below [0], gone above [1] (painting y). */
    fade: [9, 10] as [number, number],
    /** How far each slit's stroke has been laid, and taken away again (0..1). */
    sunDraw: 0,
    sunGone: 0,
    moonDraw: 0,
    moonGone: 0,
  }

  function draw() {
    renderer?.draw({
      p: state.p,
      blotR: state.blotR,
      aspect: RATIO,
      maxD: state.maxD,
      blot: state.blot,
      t: state.t,
      seed: state.seed,
      r0: R0,
      wet: WET,
      sunT: state.sunT,
      sunR: SUN_R,
      sun: state.sun,
      time: state.time,
      fog: FOG.on ? FOG.strength * state.fogIn : 0,
      fogSpeed: FOG.speed,
      seg: state.seg,
      rad: state.rad,
      s: state.s,
      m: state.m,
      sunC: state.sunC,
      set: state.set,
      setHz: state.setHz,
      moon0: state.moon0,
      moonC: state.moonC,
      moon1: state.moon1,
      moonR: EVENING.moonRadius,
      band: state.band,
      mband: state.mband,
      sunDraw: state.sunDraw,
      sunGone: state.sunGone,
      moonDraw: state.moonDraw,
      moonGone: state.moonGone,
      fade: state.fade,
    })
  }

  /* ---------- layout ---------- */
  let sheetH = 0
  let dropTarget = [0, 0]
  let sunTarget = [0, 0]
  const setVar = (name: string, value: string) => root.style.setProperty(name, value)

  function layout() {
    // in 3D the sheet covers the stage; the flat scroll keeps margins, the rod and the roller
    const m = fallback ? parseFloat(getComputedStyle(paper).left) || 0 : 0
    const top = fallback
      ? parseFloat(getComputedStyle(root).getPropertyValue('--hero-top')) || 26
      : 0
    const stageH = stage.clientHeight
    const sheetW = stage.clientWidth - m * 2
    sheetH = fallback ? stageH - top - 34 : stageH // room for the roller at the bottom
    setVar('--hero-sheet-h', sheetH + 'px')

    // the painting: "cover" anchored to the bottom on wide screens. On tall
    // ones it is scaled up to fill well over half of the sheet — shown at the
    // sheet's width it was a strip under an empty page — and cropped at the
    // sides around the valley, where the forests meet
    const portrait = sheetW / sheetH < 1.05
    const w = portrait
      ? Math.max(sheetW * 1.9, sheetH * 0.6 * RATIO)
      : Math.max(sheetW, sheetH * RATIO)
    const h = w / RATIO
    const left = portrait
      ? Math.min(0, Math.max(sheetW - w, sheetW * 0.5 - w * 0.42))
      : (sheetW - w) / 2
    const bottom = portrait ? sheetH * 0.06 : 0
    if (fallback) {
      Object.assign(art.style, {
        width: w + 'px',
        height: h + 'px',
        left: left + 'px',
        bottom: bottom + 'px',
      })
    }
    renderer?.setLayout(sheetW, stageH, { left, bottom, w, h })

    // the blot: in the dark spruce on the left, within the visible part
    const vx0 = Math.max(0, -left / w)
    const vx1 = Math.min(1, (-left + sheetW) / w)
    const bx = vx0 + 0.2 * (vx1 - vx0)
    const by = 0.72 // from the top
    state.blot = [bx, 1 - by]
    const far = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ].map(([x, y]) => Math.hypot((x - bx) * RATIO, y - (1 - by)))
    state.maxD = Math.max(...far)
    dropTarget = [left + bx * w, sheetH - bottom - h + by * h]
    // the sun: in the empty sky between the middle mountain and the peak;
    // if the top of the painting is cropped, lower it into view
    const topPx = sheetH - bottom - h
    // …and within the part of it that is on screen, like the blot
    const sx = vx0 + 0.64 * (vx1 - vx0)
    const sy = Math.max(0.15, (-topPx + SUN_R * h * 1.6 + 18) / h)
    state.sun = [sx, 1 - sy]
    sunTarget = [left + sx * w, topPx + sy * h]
    paths(vx0, vx1)
    draw()
    applyUnroll()
  }

  /* ---------- the evening's paths ---------- */
  // Set within the part of the painting the screen shows, like the sun's own place. One
  // horizon for both: the sun goes down into a slit a little under it, the moon comes up out
  // of its own slit on the same line, by the name. Each goes along a small arc, one the other
  // mirrored: the sun leaves going over to the right and goes in straight down, the moon comes
  // out straight up and ends going over to the right. They answer only to their slits,
  // whatever is painted there, so it all goes the same way on any screen.
  let sky: Skyline | null = null
  function paths(vx0: number, vx1: number) {
    const X = (f: number) => vx0 + f * (vx1 - vx0)
    const top = state.sun[1]
    const MR = EVENING.moonRadius
    const D = EVENING.arc
    const sx = state.sun[0]
    // On a very wide screen the sky is cropped so low that the hills come up to the sun's way
    // down. The sun stays where it always is: its slit goes right under it instead, and the
    // hills above the slit fade into the sky.
    let hills = 0
    if (sky)
      for (let k = 0; k <= 24; k++)
        hills = Math.max(hills, heightAt(sky.tops, X(0.6 + 0.16 * (k / 24))))
    const crowded = hills > top - SUN_R * 1.3 - 0.02
    const band = crowded ? top - SUN_R * 1.6 : top - 0.16
    state.band = band
    state.mband = band
    state.fade = crowded ? [band - 0.07, band + 0.005] : [9, 10]
    state.setHz = band // the glow over the horizon is born where it sets
    // the control point at the arc's corner: level with where it starts, over where it ends
    state.sunC = [sx + D, top]
    // it ends just gone through its slit: the stroke goes away in its own time
    state.set = [sx + D, band - SUN_R * 1.4]
    // the moon: the same arc, turned over, up to where the sun stood in the day
    const mx = X(vx1 - vx0 < 0.75 ? EVENING.moonAtNarrow : EVENING.moonAt)
    state.moon0 = [mx, band - MR * 1.4]
    state.moonC = [mx, top]
    state.moon1 = [mx + D, top]
  }

  /* ---------- the slits' strokes ---------- */
  // Each stroke is laid as its disc comes to the slit and taken away once it has gone through,
  // and both take their time: laying one takes at least STROKE_DRAW_S, taking it away
  // STROKE_AWAY_S, however fast the scroll. The sun and the moon wait for them, both ways:
  // neither gets far ahead of the brush into its slit, and on the way back neither gets far
  // ahead of its stroke coming back. So it plays back as it played.
  const STROKE_DRAW_S = 0.35
  const STROKE_AWAY_S = 0.5
  const MR = EVENING.moonRadius
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
  const smooth = (a: number, b: number, x: number) => {
    const t = clamp01((x - a) / (b - a))
    return t * t * (3 - 2 * t)
  }
  const arcY = (a: number[], c: number[], b: number[], t: number) =>
    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]
  const ease = (t: number) => t * t * (3 - 2 * t)
  /** The sun's lower edge over its slit (below it: < 0); falls as `s` grows. */
  const sunGap = (s: number) => arcY(state.sun, state.sunC, state.set, ease(s)) - SUN_R - state.band
  /** The moon's upper edge over its slit; rises as `m` grows. */
  const moonGap = (m: number) =>
    arcY(state.moon0, state.moonC, state.moon1, ease(m)) + MR - state.mband
  /** Where along its way `f` (monotonic, rising or falling) reaches `g`. */
  function at(f: (x: number) => number, g: number, rising: boolean) {
    let lo = 0
    let hi = 1
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2
      if (f(mid) < g === rising) lo = mid
      else hi = mid
    }
    return (lo + hi) / 2
  }
  // the brush lays the sun's stroke from a hair before it touches till it is some way in, and
  // it is taken away from the moment the sun is all in (in sun radii, its lower edge's gap)
  const SUN_DRAW = [0.35, -0.9]
  const SUN_AWAY = [-2.05, -2.35]
  // the moon's: from a hair before its top comes out till it is some way out; taken away
  // along its way on up once it is all out (moon radii, its top's gap; on a screen where its
  // way is short, by the end of it)
  const MOON_DRAW = [-0.35, 0.9]
  const MOON_AWAY = [1.7, 4.5]

  function strokesWant() {
    const g = sunGap(state.s) / SUN_R
    const gm = moonGap(state.m)
    const awayEnd = Math.max(MOON_AWAY[0] + 0.5, Math.min(MOON_AWAY[1], moonGap(1) / MR))
    return {
      sunDraw: clamp01((SUN_DRAW[0] - g) / (SUN_DRAW[0] - SUN_DRAW[1])),
      sunGone: smooth(-SUN_AWAY[0], -SUN_AWAY[1], -g),
      moonDraw: state.m > 0 ? clamp01((gm / MR - MOON_DRAW[0]) / (MOON_DRAW[1] - MOON_DRAW[0])) : 0,
      moonGone: state.m > 0 ? smooth(MOON_AWAY[0], awayEnd, gm / MR) : 0,
    }
  }

  /** Moves the strokes toward where they should be by `dt` s; true while they still move. */
  function stepStrokes(dt: number) {
    const want = strokesWant()
    const toward = (v: number, w: number, secs: number) =>
      v + Math.max(-dt / secs, Math.min(dt / secs, w - v))
    state.sunDraw = toward(state.sunDraw, want.sunDraw, STROKE_DRAW_S)
    state.sunGone = toward(state.sunGone, want.sunGone, STROKE_AWAY_S)
    state.moonDraw = toward(state.moonDraw, want.moonDraw, STROKE_DRAW_S)
    state.moonGone = toward(state.moonGone, want.moonGone, STROKE_AWAY_S)
    return (
      state.sunDraw !== want.sunDraw ||
      state.sunGone !== want.sunGone ||
      state.moonDraw !== want.moonDraw ||
      state.moonGone !== want.moonGone
    )
  }

  /**
   * Holds the sun and the moon back for their strokes (only ever stops them, never pushes).
   * Both ways they may be well ahead of the stroke, laid or coming back, so they hardly ever
   * wait: it catches up with them as they go in.
   */
  function waitForStrokes(s0: number, m0: number, s: number, m: number): [number, number] {
    const lead = 0.7
    const eps = 1e-3 // done is done: no waiting on a rounding error
    if (s > s0 && state.sunDraw < 1 - eps) {
      const g = SUN_DRAW[0] - (SUN_DRAW[0] - SUN_DRAW[1]) * (state.sunDraw + lead)
      s = Math.min(s, Math.max(s0, at(sunGap, g * SUN_R, false)))
    }
    if (s < s0 && state.sunGone > lead)
      s = Math.max(s, Math.min(s0, at(sunGap, SUN_AWAY[0] * SUN_R, false)))
    if (m > m0 && state.moonDraw < 1 - eps) {
      const g = MOON_DRAW[0] + (MOON_DRAW[1] - MOON_DRAW[0]) * (state.moonDraw + lead)
      m = Math.min(m, Math.max(m0, at(moonGap, g * MR, true)))
    }
    if (m < m0 && state.moonGone > lead)
      m = Math.max(m, Math.min(m0, at(moonGap, MOON_AWAY[0] * MR, true)))
    return [s, m]
  }

  /* ---------- animation ---------- */
  let phase: 'idle' | 'playing' | 'done' | 'debug' = 'idle'
  let raf = 0
  let timers: number[] = []
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
  let parts: SplashPart[] = []

  const showCaptions = () => {
    ;(Object.keys(CAPTION_TIMING) as Caption[]).forEach((c) => hooks.show(c))
  }

  function showAll() {
    state.p = P_END
    state.blotR = 0
    state.rad.fill(0)
    state.sunT = 100
    state.fogIn = 0
    draw()
    if (fallback) hooks.showArt(true)
    showCaptions()
    hold?.release()
    phase = 'done'
  }

  // scene state `ts` seconds after the impact (no drawing)
  function frame(ts: number) {
    state.t = ts
    // the hit, then a slow creep
    state.blotR = (1 - Math.exp(-ts * 30)) * (1 + 0.14 * (1 - Math.exp(-ts * 1.1)))
    updateSplash(parts, ts, state.blot[0] * RATIO, state.blot[1], R0, state.seg, state.rad)
    const tr = (ts - REVEAL_DELAY) / (INK.revealMs / 1000)
    state.p = tr <= 0 ? -0.1 : P0 + (P_END - P0) * easeSpread(Math.min(1, tr))
    return tr
  }

  /* the ink's own clock: ms since the impact, running faster once hurried */
  const HURRY_SPEED = 3
  let clockFrom = 0 // real time the current pace started at
  let clockBase = 0 // ink ms at that moment
  let pace = 1
  const inkMs = (now: number) => clockBase + (now - clockFrom) * pace

  // what happens after the impact, on the ink's clock
  let plan: { at: number; fn: () => void; done: boolean }[] = []
  function schedulePlan() {
    timers.forEach(clearTimeout)
    timers = []
    const now = inkMs(performance.now())
    for (const step of plan) {
      if (step.done) continue
      later(
        () => {
          step.done = true
          step.fn()
        },
        Math.max(0, (step.at - now) / pace)
      )
    }
  }

  /* render loop: reveal and sun, then the quiet life of the mist; stops off-screen */
  let t0 = 0
  let sunT0 = 0 // ink ms the sun landed at
  let ticking = false
  let visible = true
  let lastTick = 0
  let lastStep = 0

  function tick(now: number) {
    ticking = false
    if (phase !== 'playing' && phase !== 'done') return
    // real time, even at a low frame rate (a slow device plays it coarser, not slower)
    const dt = Math.min(0.25, (now - (lastStep || now)) / 1000)
    lastStep = now
    const ev = evening?.step(dt, waitForStrokes)
    if (ev) {
      state.s = ev.s
      state.m = ev.m
    }
    const going = stepStrokes(dt)
    const calm = phase === 'done' && sunT0 && state.sunT >= INK.sunSettleS && !ev?.moving && !going
    if (calm && now - lastTick < 32) {
      // ~30 fps is plenty at rest
      schedule()
      return
    }
    lastTick = now
    if (phase === 'playing') {
      if (frame(inkMs(now) / 1000) >= 1) {
        phase = 'done'
        hooks.show('controls')
      }
    }
    if (sunT0) state.sunT = (inkMs(now) - sunT0) / 1000
    state.time = now / 1000
    const want = FOG.on ? 1 : 0
    state.fogIn += (want - state.fogIn) * 0.02 // mist fades in and out smoothly
    draw()
    // on while in view: the river's strokes keep riding it and the sun breathes
    schedule()
  }

  function schedule() {
    if (ticking || !visible || document.hidden || destroyed) {
      if (!ticking) lastStep = 0 // no jump when it comes back into view
      return
    }
    ticking = true
    raf = requestAnimationFrame(tick)
  }

  function sunDrop() {
    sunEl.style.left = sunTarget[0] + 'px'
    sunEl.style.top = '0px'
    sunEl.style.opacity = '1'
    const fall = sunEl.animate(
      [
        { transform: 'translateY(2px) scale(.1, .1)', offset: 0, easing: 'ease-out' },
        {
          transform: 'translateY(12px) scale(1, 1.15)',
          offset: 0.5,
          easing: 'cubic-bezier(.6,0,1,.6)',
        },
        { transform: `translateY(${sunTarget[1]}px) scale(.8, 1.9)`, offset: 1 },
      ],
      { duration: hurried ? 600 : 800, fill: 'forwards' }
    )
    fall.onfinish = () => {
      sunEl.style.opacity = '0'
      sunT0 = Math.max(1, inkMs(performance.now()))
      // the sun is the last touch: the page scrolls again once it has landed,
      // and a scroll at the top from now on brings the evening
      hold?.release()
      evening?.arm()
    }
  }

  function impact() {
    dropEl.style.opacity = '0'
    // the flat sheet gives a little under the hit (the 3D one hangs still)
    if (fallback)
      sheet.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(3px)' },
          { transform: 'translateY(-1px)' },
          { transform: 'translateY(0)' },
        ],
        { duration: 260, easing: 'ease-out' }
      )
    parts = makeSplash(R0)
    state.seed = 1 + Math.random() * 40
    t0 = performance.now()
    clockFrom = t0
    clockBase = 0
    pace = hurried ? HURRY_SPEED : 1
    schedule()
    landed = true
    const base = INK.revealDelayMs
    plan = [
      { at: base + CAPTION_TIMING.name, fn: () => hooks.show('name'), done: false },
      { at: base + CAPTION_TIMING.role, fn: () => hooks.show('role'), done: false },
      { at: base + INK.sunAtMs, fn: sunDrop, done: false },
      { at: base + CAPTION_TIMING.seal, fn: () => hooks.show('seal'), done: false },
      { at: base + CAPTION_TIMING.controls, fn: () => hooks.show('controls'), done: false },
    ]
    // hurried by a try to scroll: the name comes with the blot, not after it
    if (hurried) plan[0].at = plan[1].at = 0
    schedulePlan()
  }

  function play() {
    if (phase !== 'idle') return
    phase = 'playing'
    if (REDUCED || !renderer) {
      showAll()
      return
    }

    // the drop swells at the top rod, breaks off and falls, stretching
    dropEl.style.left = dropTarget[0] + 'px'
    dropEl.style.top = '0px'
    dropEl.style.opacity = '1'
    const y = dropTarget[1]
    const fall = dropEl.animate(
      [
        { transform: 'translateY(2px) scale(.1, .1)', offset: 0, easing: 'ease-out' },
        {
          transform: 'translateY(16px) scale(1, 1.15)',
          offset: 0.5,
          easing: 'cubic-bezier(.6,0,1,.6)',
        },
        { transform: `translateY(${y}px) scale(.8, 2.3)`, offset: 1 },
      ],
      { duration: hurried ? 400 : 650, fill: 'forwards' }
    )
    fall.onfinish = impact
  }

  function reset() {
    cancelAnimationFrame(raf)
    timers.forEach(clearTimeout)
    timers = []
    ;[dropEl, sunEl].forEach((el) => {
      el.getAnimations().forEach((a) => a.cancel())
      el.style.opacity = '0'
    })
    ticking = false
    sunT0 = 0
    landed = false
    hurried = false
    pace = 1
    plan = []
    setVar('--hero-pace', '1')
    state.p = -0.1
    state.blotR = 0
    state.t = 0
    state.rad.fill(0)
    state.sunT = -1
    state.fogIn = 0
    evening?.reset()
    state.s = 0
    state.m = 0
    state.sunDraw = 0
    state.sunGone = 0
    state.moonDraw = 0
    state.moonGone = 0
    hooks.hideCaptions()
    if (fallback) hooks.showArt(false)
    phase = 'idle'
    draw()
  }

  /* ---------- the unrolling: by itself, on load ---------- */
  // The sheet unrolls on its own as the page opens, instead of with the
  // scroll. Meanwhile the page is held at the top, so the hero is seen before
  // the next section; a try to scroll hurries the drawing up instead.
  const UNROLL_MS = 1500
  const HURRY_MS = 350
  const easeUnroll = (t: number) => 1 - Math.pow(1 - t, 3)
  let unrolled = REDUCED ? 1 : 0
  let unrollRaf = 0
  let unrolling = false
  let hurried = false
  let landed = false

  /** Sets the sheet `unrolled` of the way down and lets the drop fall once its spot is down. */
  function applyUnroll() {
    const u = unrolled
    setVar('--hero-u', u.toFixed(4))
    // how much of the sheet is down, px from its top
    let down: number
    if (renderer) {
      // captions and drops live on the paper overlay, cut where the 3D sheet ends
      down = Math.max(0, renderer.setUnroll(u))
      setVar('--hero-h', down.toFixed(1) + 'px')
    } else {
      down = u * sheetH
      setVar('--hero-h', down.toFixed(1) + 'px')
      setVar('--hero-roll', down.toFixed(1) + 'px') // the roller surface travels 1:1 with the paper
      setVar('--hero-d', (58 - 24 * u).toFixed(1) + 'px') // the roller gets thinner
    }
    // the drop falls as soon as the spot it lands on is down
    if ((down >= dropTarget[1] + 60 || u >= 0.985) && phase === 'idle') play()
  }

  /** Unrolls the rest of the sheet, from wherever it is now. */
  function unroll() {
    cancelAnimationFrame(unrollRaf)
    if (REDUCED) {
      unrolled = 1
      applyUnroll()
      return
    }
    unrolling = true
    const from = unrolled
    const ms = hurried ? HURRY_MS : UNROLL_MS
    const begun = performance.now()
    const step = (now: number) => {
      if (destroyed) return
      unrolled = from + (1 - from) * easeUnroll(Math.min(1, (now - begun) / ms))
      applyUnroll()
      if (unrolled < 1) unrollRaf = requestAnimationFrame(step)
      else unrolling = false
    }
    unrollRaf = requestAnimationFrame(step)
  }

  /** A try to scroll while the hero is still being drawn: show it sooner. */
  function hurry() {
    if (hurried) return
    hurried = true
    // the captions bleed in faster too
    setVar('--hero-pace', '0.5')
    if (unrolling) unroll()
    // a drop on its way falls faster
    dropEl.getAnimations().forEach((a) => (a.playbackRate = 650 / 400))
    if (landed) {
      // the ink runs faster from here on, and the name comes now
      const now = performance.now()
      clockBase = inkMs(now)
      clockFrom = now
      pace = HURRY_SPEED
      plan[0].at = plan[1].at = 0
      schedulePlan()
    }
  }

  // held from the first frame, unless the page opens somewhere below the hero
  const hold: ScrollHold | null = !REDUCED && window.scrollY < 40 ? holdScroll(hurry) : null
  // the evening waits for the hero to be drawn (and never comes with reduced motion)
  const evening = REDUCED ? null : createEvening()

  /* ---------- wiring ---------- */
  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting
    schedule()
  })
  io.observe(stage)
  document.addEventListener('visibilitychange', schedule)
  window.addEventListener('resize', layout)

  if (import.meta.env.DEV) {
    // console handles: __fog.on = false, __fog.speed = 0.03; __ink.at(0.3) freezes 0.3 s after the hit
    window.__fog = FOG
    window.__ink = {
      at(ts, sunT = -1, time = 30) {
        reset()
        phase = 'debug'
        if (!parts.length) parts = makeSplash(R0)
        frame(ts)
        state.sunT = sunT
        state.fogIn = 1
        state.time = time
        draw()
      },
    }
  }

  function start() {
    if (destroyed) return
    try {
      renderer = createScroll3D(canvas)
    } catch (e) {
      console.error(e)
      renderer = null
    }
    if (renderer) {
      renderer.loadTexture(art)
      sky = readSkyline(art, RATIO)
    } else {
      fallback = true
      hooks.useImageFallback()
    }
    layout()
    unroll()
  }

  // The <img> is in the prerendered HTML and may have finished loading before hydration.
  if (art.complete && art.naturalWidth) start()
  else art.addEventListener('load', start, { once: true })
  layout()

  return {
    replay() {
      reset()
      play()
    },
    setFog(on) {
      FOG.on = on
      schedule()
    },
    destroy() {
      destroyed = true
      hold?.dispose()
      evening?.dispose()
      reset()
      io.disconnect()
      art.removeEventListener('load', start)
      document.removeEventListener('visibilitychange', schedule)
      cancelAnimationFrame(unrollRaf)
      window.removeEventListener('resize', layout)
      renderer?.dispose()
      renderer = null
      if (import.meta.env.DEV) {
        delete window.__fog
        delete window.__ink
      }
    },
  }
}
