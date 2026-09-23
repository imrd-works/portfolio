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
import { CINNABAR, makePaw, type PawSprite } from './paw'

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

// Below this the steps beside the river get too narrow to read: their text
// runs tall into the next step and over the painting. Tablets get the phone
// layout, a caption at a time over the drifting painting. Keep it in step
// with the media query in ExperienceSection.vue.
const MOBILE = 1100
const WET = CINNABAR.join(',')
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
  // the small prints of the trails: a left paw and a right one, in turn
  const small: PawSprite[] = [makePaw(101, false), makePaw(113, true)]
  /* ---------- layout ---------- */
  let W = 0
  let VH = 0
  let DPR = 1
  let mobile = false
  let s = 1
  let px0 = 0
  let pw = 0
  let ph = 0
  /** Where the painting's top edge is in the section (above it: the cropped sky). */
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
    trailScale = -1 // the trails are laid out again for the new size
    px0 = (W - pw) / 2
    ph = RIVER_IMAGE.height * s
    padTop = (mobile ? 0 : 20) - RIVER_IMAGE.cropTop * s
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

    // the steps stay inside the page's content column, however wide the river:
    // the same column as --page-pad in _portfolio.scss (the river itself runs
    // edge to edge while it is live, so its own padding is zero)
    const colWidth = parseFloat(getComputedStyle(root).getPropertyValue('--page-width')) || 1280
    const gutter = Math.min(96, Math.max(20, W * 0.06))
    const colLeft = Math.max(gutter, (W - colWidth) / 2)
    const colRight = W - colLeft

    RIVER_STEPS.forEach((st, i) => {
      const el = steps[i]
      if (!el) return
      const inner = px0 + st.edge * s
      let left: number
      let width: number
      if (st.side === 'left') {
        const right = inner - 20
        width = Math.min(400, right - colLeft)
        left = right - width
      } else {
        left = inner + 20
        width = Math.min(400, colRight - left)
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
    const start = VH * 0.3 - RIVER_IMAGE.cropTop * s // the source of the river at 30% of the screen
    return start + p * (VH * 0.7 - ph - start)
  }

  /* ---------- the trail ---------- */
  /**
   * Where the reader is on the way between two steps: `next` is the step
   * being walked to, `walked` how much of the way to it is done (0..1).
   */
  let next = 0
  let walked = 0

  /** The river is seen from above its mouth: prints far upstream are smaller. */
  const depth = (i: number) => 0.6 + 0.4 * (i / Math.max(1, N - 1))
  /** Where the trail to the first step comes from: upstream, on the left. */
  const source = () => ({ x: prints[0].x - 170, y: prints[0].y - 320 })

  interface TrailPrint {
    x: number
    y: number
    rot: number
    size: number
    paw: PawSprite
  }
  let trails: TrailPrint[][] = []
  let trailScale = -1

  /**
   * The prints walking to step `i`, in painting px, the way an animal walks:
   * a left paw and a right one in turn, close together, each one about a
   * paw's length further on, along a gentle arc from the step before. They
   * grow as they come nearer, and the stride grows with them.
   */
  function trailTo(i: number, scale: number): TrailPrint[] {
    const b = prints[i]
    const a = i > 0 ? prints[i - 1] : source()
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const bend = len * 0.16 * (i % 2 ? 1 : -1)
    const cx = (a.x + b.x) / 2 + (-dy / len) * bend
    const cy = (a.y + b.y) / 2 + (dx / len) * bend
    const at = (t: number) => {
      const u = 1 - t
      return {
        x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
        y: u * u * a.y + 2 * u * t * cy + t * t * b.y,
        tx: 2 * u * (cx - a.x) + 2 * t * (b.x - cx),
        ty: 2 * u * (cy - a.y) + 2 * t * (b.y - cy),
      }
    }
    // the arc, measured, so the prints can be spaced by distance
    const M = 240
    const cum = [0]
    let prev = at(0)
    for (let m = 1; m <= M; m++) {
      const q = at(m / M)
      cum.push(cum[m - 1] + Math.hypot(q.x - prev.x, q.y - prev.y))
      prev = q
    }
    const total = cum[M]
    const tAt = (d: number) => {
      let m = 1
      while (m < M && cum[m] < d) m++
      return (m - 1 + (d - cum[m - 1]) / Math.max(1e-6, cum[m] - cum[m - 1])) / M
    }
    const from = i > 0 ? depth(i - 1) * 0.36 : depth(0) * 0.26
    const to = depth(i) * 0.58
    // a paw's length on the painting at a given print size
    const pawLen = (size: number) => (small[0].height * scale * size) / s
    const out: TrailPrint[] = []
    let d = pawLen(from) * 1.6 // clear of the step it leaves
    const end = total - pawLen(to) * 1.8 // and of the one it walks to
    for (let k = 0; d < end; k++) {
      const size = from + (to - from) * (d / total)
      const q = at(tAt(d))
      const tl = Math.hypot(q.tx, q.ty) || 1
      const side = k % 2 ? 1 : -1
      const spread = pawLen(size) * 0.34 // left and right of the line it walks
      out.push({
        x: q.x + (-q.ty / tl) * side * spread,
        y: q.y + (q.tx / tl) * side * spread,
        rot: Math.atan2(q.ty, q.tx) + Math.PI / 2,
        size,
        paw: small[k % 2],
      })
      d += pawLen(size) * 0.95 // one stretched paw further on
    }
    return out
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

  // at rest, ~30 fps is plenty for the current
  let calmTimer = 0
  function calmLater() {
    window.clearTimeout(calmTimer)
    calmTimer = window.setTimeout(schedule, 33)
  }

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
    // how far the reader has walked towards the next step
    if (mobile) {
      // phones and tablets: each step holds an equal share of the scroll
      const readAt = r.top > 0 ? 0 : clamp01(-r.top / Math.max(1, H - VH)) * N
      const here = Math.min(N - 1, Math.floor(readAt))
      next = here + 1
      walked = readAt - here
    } else {
      // desktop: by the reading line, the line the ink runs to
      const readY = (VH * RIVER_FLOW.lead - screenTop) / s
      next = prints.findIndex((pr) => pr.y > readY)
      if (next < 0) next = N
      const fromY = next > 0 ? prints[next - 1].y : source().y
      const toY = next < N ? prints[next].y : fromY + 1
      walked = clamp01((readY - fromY) / Math.max(1, toY - fromY))
    }
    if (mobile) {
      // the caption follows the reader, not the ink: the ink never runs back,
      // but scrolling up brings the earlier steps back. Each step holds an
      // equal share of the section's scroll (the section is sized for that),
      // so the first one is read too instead of flashing past on the way in
      const p = clamp01(-r.top / Math.max(1, H - VH))
      const at = r.top > 0 ? 0 : Math.min(N - 1, Math.floor(p * N))
      let cur = at
      while (cur >= 0 && !reached[cur]) cur--
      if (cur !== shown) {
        shown = cur
        hooks.current(cur)
      }
    }

    // the current keeps the water moving; with reduced motion it stands still
    const time = REDUCED ? 0 : now / 1000
    renderer!.draw({ rect: { left: px0, top, width: pw, height: ph }, head, dry, time })
    const wet = drawPrints(now, top)

    // keep going while the ink moves or dries, or a print is still wet
    if (target > head + 0.0005 || dry < head - 0.0005 || wet) schedule()
    else if (!REDUCED) calmLater() // the water keeps running, at a calmer frame rate
  }

  function drawPaw(paw: PawSprite, x: number, y: number, rot: number, sc: number, alpha: number) {
    mg.save()
    mg.translate(x, y)
    mg.rotate(rot)
    mg.scale(sc, sc)
    mg.globalAlpha = alpha
    mg.drawImage(paw.canvas, -paw.width / 2, -paw.height * 0.58, paw.width, paw.height)
    mg.restore()
  }

  function drawPrints(now: number, top: number) {
    mg.setTransform(DPR, 0, 0, DPR, 0, 0)
    mg.clearRect(0, 0, W, bandH)
    let wet = false
    const scale = Math.max(0.55, Math.min(1, s * 1.35))
    const toScreen = (x: number, y: number) => [px0 + x * s, top + y * s] as const
    const here = next - 1 // the step being read
    if (trailScale !== scale) {
      trails = RIVER_STEPS.map((_, i) => trailTo(i, scale))
      trailScale = scale
    }

    /* the trails, laid down by the scroll: the one to the step being walked
       to, and the one just walked, fading as the next is begun */
    const drawTrail = (i: number, shown: number, alpha: number) => {
      if (i < 0 || i >= N || alpha <= 0) return
      trails[i].forEach((st, k) => {
        const on = clamp01(shown - k)
        if (on <= 0) return
        const [x, y] = toScreen(st.x, st.y)
        if (y < -60 || y > bandH + 60) return
        // pressed down a touch large, then the paint settles
        const sc = scale * st.size * (1 + 0.25 * (1 - on))
        drawPaw(st.paw, x, y - 3 * (1 - on), st.rot, sc, on * alpha * 0.85)
      })
    }
    if (next < N && (next === 0 || reached[next - 1])) {
      drawTrail(next, walked * (trails[next].length + 1), 1)
    }
    if (here >= 0) drawTrail(here, trails[here].length + 1, 1 - walked * 3)

    /* the steps' own prints, full size by their descriptions */
    RIVER_STEPS.forEach((st, i) => {
      const t0 = reached[i]
      if (!t0) return
      const age = REDUCED ? 30 : (now - t0) / 1000
      if (age < 6) wet = true
      if (age < 0) return
      const [x, y] = toScreen(prints[i].x, prints[i].y)
      if (y < -120 || y > bandH + 120) return
      const size = scale * depth(i)
      // the step being read stands out, the others step back
      const dim = i === here || (here < 0 && i === 0) ? 1 : 0.4

      // the wet ring soaking into the paper
      const R = 46 * size * (1 + 0.25 * smooth(age / 1.5))
      const soak = (0.09 * Math.exp(-age * 0.8) + 0.025) * dim
      const gr = mg.createRadialGradient(x, y, R * 0.2, x, y, R)
      gr.addColorStop(0, `rgba(${WET},${soak})`)
      gr.addColorStop(1, `rgba(${WET},0)`)
      mg.fillStyle = gr
      mg.beginPath()
      mg.arc(x, y, R, 0, Math.PI * 2)
      mg.fill()

      // the print, painted on: a touch large at first, then settles
      const rot = Math.PI + (st.side === 'left' ? 0.35 : -0.35) // toes downstream
      const sc = size * (1 + 0.18 * Math.exp(-age * 10))
      drawPaw(paws[i], x, y, rot, sc, Math.min(1, age * 6) * 0.95 * dim)
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

  Promise.all([
    loadImage(RIVER_IMAGE.ink),
    loadImage(RIVER_IMAGE.flow),
    loadImage(RIVER_IMAGE.water),
  ])
    .then(([ink, flow, water]) => {
      if (destroyed) return
      renderer!.loadTextures(ink, flow, water)
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
      window.clearTimeout(calmTimer)
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
