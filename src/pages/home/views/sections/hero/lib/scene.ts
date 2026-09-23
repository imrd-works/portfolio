/**
 * The hero scene outside of Vue: the scroll unrolls the hanging scroll (in 3D,
 * edge to edge), a drop of ink falls from the top, the painting blooms out of
 * the blot, then a cinnabar drop becomes the sun and the mist keeps drifting.
 * Without WebGL2 the flat CSS scroll unrolls with the plain image on it.
 *
 * Ported from `hero-prototype.html` with the logic unchanged. The only
 * structural difference: CSS custom properties are written to the section
 * root instead of `document.documentElement`, and caption visibility is
 * reported through `hooks` so Vue owns the classes.
 */
import { CAPTION_TIMING, FOG_DEFAULTS, INK, INK_RATIO as RATIO, type FogConfig } from '../config'
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
    draw()
    onScroll()
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

  /* render loop: reveal and sun, then the quiet life of the mist; stops off-screen */
  let t0 = 0
  let sunT0 = 0
  let ticking = false
  let visible = true
  let lastTick = 0

  function tick(now: number) {
    ticking = false
    if (phase !== 'playing' && phase !== 'done') return
    const calm = phase === 'done' && sunT0 && state.sunT >= INK.sunSettleS
    if (calm && now - lastTick < 32) {
      // ~30 fps is plenty at rest
      schedule()
      return
    }
    lastTick = now
    if (phase === 'playing' && frame((now - t0) / 1000) >= 1) {
      phase = 'done'
      hooks.show('controls')
    }
    if (sunT0) state.sunT = (now - sunT0) / 1000
    state.time = now / 1000
    const want = FOG.on ? 1 : 0
    state.fogIn += (want - state.fogIn) * 0.02 // mist fades in and out smoothly
    draw()
    if (
      phase === 'playing' ||
      !sunT0 ||
      state.sunT < INK.sunSettleS ||
      FOG.on ||
      state.fogIn > 0.01
    )
      schedule()
  }

  function schedule() {
    if (ticking || !visible || document.hidden || destroyed) return
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
      { duration: 800, fill: 'forwards' }
    )
    fall.onfinish = () => {
      sunEl.style.opacity = '0'
      sunT0 = performance.now()
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
    schedule()
    const base = INK.revealDelayMs
    later(() => hooks.show('name'), base + CAPTION_TIMING.name)
    later(() => hooks.show('role'), base + CAPTION_TIMING.role)
    later(sunDrop, base + INK.sunAtMs)
    later(() => hooks.show('seal'), base + CAPTION_TIMING.seal)
    later(() => hooks.show('controls'), base + CAPTION_TIMING.controls)
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
      { duration: 1050, fill: 'forwards' }
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
    state.p = -0.1
    state.blotR = 0
    state.t = 0
    state.rad.fill(0)
    state.sunT = -1
    state.fogIn = 0
    hooks.hideCaptions()
    if (fallback) hooks.showArt(false)
    phase = 'idle'
    draw()
  }

  /* ---------- scroll: unrolling the scroll ---------- */
  function onScroll() {
    const range = root.offsetHeight - stage.clientHeight
    const s = Math.min(1, Math.max(0, -root.getBoundingClientRect().top / range))
    // the paper unrolls over most of the track: a long stretch where the
    // scroll moved and nothing on screen did read as the page being stuck
    const u = Math.min(1, s / 0.85)
    setVar('--hero-u', u.toFixed(4))
    if (renderer) {
      // captions and drops live on the paper overlay, cut where the 3D sheet ends
      setVar('--hero-h', Math.max(0, renderer.setUnroll(u)).toFixed(1) + 'px')
    } else {
      const h = u * sheetH
      setVar('--hero-h', h.toFixed(1) + 'px')
      setVar('--hero-roll', h.toFixed(1) + 'px') // the roller surface travels 1:1 with the paper
      setVar('--hero-d', (58 - 24 * u).toFixed(1) + 'px') // the roller gets thinner
    }
    if (u >= 0.985 && phase === 'idle') play()
    if (u < 0.15 && phase !== 'idle') reset()
  }

  /* ---------- wiring ---------- */
  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting
    schedule()
  })
  io.observe(stage)
  document.addEventListener('visibilitychange', schedule)
  window.addEventListener('scroll', onScroll, { passive: true })
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
    if (renderer) renderer.loadTexture(art)
    else {
      fallback = true
      hooks.useImageFallback()
    }
    layout()
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
      reset()
      io.disconnect()
      art.removeEventListener('load', start)
      document.removeEventListener('visibilitychange', schedule)
      window.removeEventListener('scroll', onScroll)
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
