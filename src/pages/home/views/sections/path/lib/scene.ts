/**
 * The "Path" river outside of Vue. As the page scrolls, the ink runs down the
 * river's course a little ahead of the reader and the painting blooms along it
 * the way the hero does: soft and spread while wet, then drying into the sharp
 * drawing. When the ink reaches a bend a wolverine's print is painted on the
 * bank beside that step of the career, and the step appears. At the lake: the seal.
 *
 * Desktop: the painting is a column in the middle, descriptions sit in the
 * margins and the bends' empty pockets. The canvas scrolls with the page (it is
 * a band a bit taller than the screen, moved only when the reader nears its
 * edge), so the painting and the text never drift apart. Phones: the painting
 * takes the width and drifts up slower than the page, one step at a time; the
 * current step is reported through `hooks.current` and shown as a caption.
 *
 * Ported from the scroll3d prototype (river.html).
 */
import { RIVER_COURSE, RIVER_FLOW, RIVER_IMAGE, RIVER_SEAL, RIVER_STEPS } from '../config'
import { createRiverRenderer, type RiverRenderer } from './renderer'
import { makePaw, type PawSprite } from './paw'

export interface RiverElements {
  /** The tall scroll track; its height is set here. */
  root: HTMLElement
  /** Holds both canvases: a band that scrolls with the page on desktop, sticky on phones. */
  view: HTMLElement
  gl: HTMLCanvasElement
  marks: HTMLCanvasElement
  /** One description per step, oldest first. */
  steps: HTMLElement[]
  seal: HTMLElement
}

export interface RiverHooks {
  /** The scene took over the layout (false: WebGL is out, the plain list stays). */
  live(on: boolean): void
  /** The ink reached this step's print. */
  reach(step: number): void
  seal(): void
  /** Phones: the step to show in the caption. */
  current(step: number): void
}

export interface RiverScene {
  destroy(): void
}

const MOBILE = 768 // bp-down(md)
const INK = '22,23,25'
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (x: number) => {
  x = clamp01(x)
  return x * x * (3 - 2 * x)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Flow value where the river is at a given height of the painting. */
function flowAtY(y: number) {
  const c = RIVER_COURSE
  if (y <= c[0][0]) return 0
  for (let i = 1; i < c.length; i++) {
    if (c[i][0] >= y) {
      const t = (y - c[i - 1][0]) / (c[i][0] - c[i - 1][0] || 1)
      return c[i - 1][1] + (c[i][1] - c[i - 1][1]) * t
    }
  }
  return 1
}

export function mountRiver(els: RiverElements, hooks: RiverHooks): RiverScene {
  const { root, view, marks, steps, seal } = els
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const N = RIVER_STEPS.length

  let renderer: RiverRenderer | null = null
  try {
    renderer = createRiverRenderer(els.gl)
  } catch (e) {
    console.error(e)
  }
  if (!renderer) {
    hooks.live(false)
    return { destroy() {} }
  }
  const mg = marks.getContext('2d')!
  const paws: PawSprite[] = RIVER_STEPS.map((_, i) => makePaw(11 + i * 7, i % 2 === 1))
  /* ---------- layout ---------- */
  let W = 0
  let VH = 0
  let DPR = 1
  let mobile = false
  let s = 1
  let px0 = 0
  let pw = 0
  let ph = 0
  let padTop = 0
  let H = 0
  /**
   * Where each print sits (painting px) and the flow value that brings it. On
   * desktop the print stands by its description, level with its heading, so
   * the two read together; on phones (no descriptions beside it) it stays on
   * the bank of its bend.
   */
  const prints = RIVER_STEPS.map((st) => ({ x: st.print[0], y: st.print[1], at: st.at }))
  /** Desktop: the canvas band's height and where it sits in the section. */
  let bandH = 0
  let bandTop = -1

  function layout() {
    W = root.clientWidth
    VH = window.innerHeight
    DPR = Math.min(window.devicePixelRatio || 1, 2)
    mobile = W < MOBILE
    const F = RIVER_FLOW
    pw = mobile ? W : Math.min(W * (W > 1600 ? F.columnWide : F.column), F.columnMax)
    s = pw / RIVER_IMAGE.width
    px0 = (W - pw) / 2
    ph = RIVER_IMAGE.height * s
    padTop = mobile ? 0 : 20
    // on phones the scroll is longer than the painting: it drifts up slower
    H = mobile ? Math.max(ph, N * VH * 0.75 + VH) : ph + padTop + 40
    root.style.height = H + 'px'

    bandH = mobile ? VH : Math.min(H, Math.round(VH * 1.6))
    bandTop = -1
    view.style.height = mobile ? '' : bandH + 'px'
    view.style.transform = ''
    renderer!.resize(W, bandH, DPR)
    marks.width = Math.round(W * DPR)
    marks.height = Math.round(bandH * DPR)

    RIVER_STEPS.forEach((st, i) => {
      const el = steps[i]
      if (!el) return
      const inner = px0 + st.edge * s
      let left: number
      let width: number
      if (st.side === 'left') {
        const right = inner - 20
        width = Math.min(400, right - 24)
        left = right - width
      } else {
        left = inner + 20
        width = Math.min(400, W - 24 - left)
      }
      const cy = padTop + st.cy * s
      Object.assign(el.style, {
        left: left + 'px',
        width: width + 'px',
        top: cy + 'px',
      })
      if (mobile) {
        prints[i] = { x: st.print[0], y: st.print[1], at: st.at }
        return
      }
      // on the river side of the text, level with the heading (the card is centred on cy)
      const x = st.side === 'left' ? left + width + 58 : left - 58
      const y = cy - el.offsetHeight / 2 + 52
      const src = { x: (x - px0) / s, y: (y - padTop) / s }
      prints[i] = { ...src, at: flowAtY(src.y) }
    })
    Object.assign(seal.style, {
      left: px0 + RIVER_SEAL.x * s + 'px',
      top: (mobile ? H - 90 : padTop + RIVER_SEAL.y * s) + 'px',
    })
    schedule()
  }

  /** Desktop: keep the band around the screen; it only moves near its edge. */
  function placeBand(scrolled: number) {
    const margin = (bandH - VH) * 0.2
    if (bandTop >= 0 && scrolled >= bandTop + margin && scrolled + VH <= bandTop + bandH - margin)
      return
    bandTop = Math.min(Math.max(scrolled - (bandH - VH) / 2, 0), H - bandH)
    view.style.transform = `translate3d(0, ${bandTop}px, 0)`
  }

  /** Where the painting's top is in the canvas, css px. */
  function paintTop(rectTop: number) {
    if (!mobile) return padTop - bandTop
    const p = clamp01(-rectTop / (H - VH))
    return VH * 0.3 + p * (VH * 0.7 - ph - VH * 0.3)
  }

  /* ---------- the flow ---------- */
  let head = REDUCED ? 1 : 0
  let dry = REDUCED ? 1 : 0
  const reached: number[] = []
  let sealed = false
  let shown = -1
  let last = 0
  let raf = 0
  let visible = false
  let ticking = false
  let destroyed = false
  let ready = false

  function schedule() {
    if (ticking || !visible || !ready || destroyed || document.hidden) return
    ticking = true
    raf = requestAnimationFrame(tick)
  }

  function tick(now: number) {
    ticking = false
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
    last = now
    const r = root.getBoundingClientRect()
    if (!mobile) placeBand(-r.top)
    const top = paintTop(r.top)
    // the painting's top on screen
    const screenTop = mobile ? top : r.top + padTop

    // the ink runs to about two thirds down the screen, never back up
    let target = flowAtY((VH * RIVER_FLOW.lead - screenTop) / s)
    if (r.bottom < VH * 1.02) target = 1 // the end of the section: let it all run out
    if (target - head > RIVER_FLOW.catchUp) head = target - RIVER_FLOW.catchUp / 2
    if (target > head) head += Math.min(target - head, Math.max(0.004, (target - head) * 2.2) * dt)
    // the paper dries behind the ink at its own pace, so a pause lets it settle
    if (head > dry) dry += Math.min(head - dry, RIVER_FLOW.drySpeed * dt)
    dry = Math.max(dry, head - RIVER_FLOW.wetMax)

    prints.forEach((pr, i) => {
      if (!reached[i] && head >= pr.at + 0.004) {
        reached[i] = now
        hooks.reach(i)
      }
    })
    if (!sealed && head >= RIVER_SEAL.at) {
      sealed = true
      hooks.seal()
    }
    if (mobile) {
      const cur = reached.reduce((m, v, i) => (v ? i : m), -1)
      if (cur !== shown && cur >= 0) {
        shown = cur
        hooks.current(cur)
      }
    }

    renderer!.draw({ rect: { left: px0, top, width: pw, height: ph }, head, dry })
    const wet = drawPrints(now, top)

    // keep going while the ink moves or dries, or a print is still wet
    if (target > head + 0.0005 || dry < head - 0.0005 || wet) schedule()
  }

  function drawPrints(now: number, top: number) {
    mg.setTransform(DPR, 0, 0, DPR, 0, 0)
    mg.clearRect(0, 0, W, bandH)
    let wet = false
    RIVER_STEPS.forEach((st, i) => {
      const t0 = reached[i]
      if (!t0) return
      const age = REDUCED ? 30 : (now - t0) / 1000
      if (age < 6) wet = true
      const x = px0 + prints[i].x * s
      const y = top + prints[i].y * s
      if (y < -120 || y > bandH + 120) return
      const size = Math.max(0.55, Math.min(1, s * 1.35))

      // the wet ring soaking into the paper
      const R = 46 * size * (1 + 0.25 * smooth(age / 1.5))
      const soak = 0.09 * Math.exp(-age * 0.8) + 0.025
      const gr = mg.createRadialGradient(x, y, R * 0.2, x, y, R)
      gr.addColorStop(0, `rgba(${INK},${soak})`)
      gr.addColorStop(1, `rgba(${INK},0)`)
      mg.fillStyle = gr
      mg.beginPath()
      mg.arc(x, y, R, 0, Math.PI * 2)
      mg.fill()

      // the print, painted on: a touch large at first, then settles
      const paw = paws[i]
      const rot = Math.PI + (st.side === 'left' ? 0.35 : -0.35) // toes downstream
      const sc = size * (1 + 0.18 * Math.exp(-age * 10))
      mg.save()
      mg.translate(x, y)
      mg.rotate(rot)
      mg.scale(sc, sc)
      mg.globalAlpha = Math.min(1, age * 6) * 0.95
      mg.drawImage(paw.canvas, -paw.width / 2, -paw.height * 0.58, paw.width, paw.height)
      mg.restore()
    })
    return wet
  }

  /* ---------- wiring ---------- */
  const io = new IntersectionObserver(
    (es) => {
      visible = es[0].isIntersecting
      schedule()
    },
    { rootMargin: '20% 0px' }
  )
  io.observe(root)
  const onScroll = () => schedule()
  document.addEventListener('visibilitychange', onScroll)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', layout)

  Promise.all([loadImage(RIVER_IMAGE.ink), loadImage(RIVER_IMAGE.flow)])
    .then(([ink, flow]) => {
      if (destroyed) return
      renderer!.loadTextures(ink, flow)
      ready = true
      hooks.live(true)
      layout()
      // the prints are placed by the descriptions' height, which the web fonts change
      document.fonts?.ready.then(() => !destroyed && layout())
    })
    .catch((e) => {
      console.error(e)
      hooks.live(false)
    })

  return {
    destroy() {
      destroyed = true
      cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener('visibilitychange', onScroll)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', layout)
      root.style.height = ''
      view.style.height = ''
      view.style.transform = ''
      renderer?.dispose()
      renderer = null
    },
  }
}
