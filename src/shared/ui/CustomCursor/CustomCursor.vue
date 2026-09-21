<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { CLICK_SCALE, createSplashLayer, inkUnit, type SplashLayer } from './splash-layer'

defineOptions({ name: 'UiCustomCursor' })

/*
 * An ink brush drawn live every frame. The hotspot is the tip of the
 * bristles, pinned to the pointer. The handle sways on a spring as the pointer
 * moves; the bristles follow on a softer spring, so they visibly bend. A press
 * squashes and splays them. Ink is drawn by the hero's splash shader
 * (./splash-layer.ts): a resting brush lets ink gather and drip; a click drops
 * a drop of ink that splashes like the one on the hero scroll.
 * The native cursor is hidden while it is active, except over text fields.
 */

const brush = ref<SVGSVGElement | null>(null)
const bristles = ref<SVGPathElement | null>(null)
const glint = ref<SVGPathElement | null>(null)
const ferrule = ref<SVGPathElement | null>(null)
const handle = ref<SVGPathElement | null>(null)
const band = ref<SVGPathElement | null>(null)
const hairGrad = ref<SVGLinearGradientElement | null>(null)
const boneGrad = ref<SVGLinearGradientElement | null>(null)
const bloom = ref<HTMLElement | null>(null)
const splashCanvas = ref<HTMLCanvasElement | null>(null)
const dropTemplate = ref<HTMLElement | null>(null)

const INTERACTIVE = 'a, button, [role="button"], label, summary, [data-cursor-grow]'
const TEXT_FIELD = 'input, textarea, select, [contenteditable="true"]'
const ROOT_CLASS = 'has-brush-cursor'

// Angles are measured clockwise from "up", from the tip towards the handle.
// 150deg puts the handle down and to the right, so the tip points up-left like
// a regular arrow cursor and clicks land where people expect them.
const BASE_ANGLE = 150
const MAX_LEAN = 26
const BRISTLE_LEN = 23
const FERRULE_LEN = 4.5
const HANDLE_LEN = 34

let raf = 0
let reduced = false
let splashes: SplashLayer | null = null
const falling = new Set<Animation>()

// Resting brush: after DWELL_MS without moving, ink gathers under the tip.
const DWELL_MS = 200
let dwell = 0
let restAt: { x: number; y: number } | null = null

const pos = { x: 0, y: 0 }
const prev = { x: 0, y: 0 }
let lastT = 0
let vx = 0 // smoothed horizontal speed, px per 60 fps frame
let theta = BASE_ANGLE // handle angle
let omega = 0
let phi = BASE_ANGLE // bristle angle, lags the handle
let omegaPhi = 0
let press = 0
let pressed = false
let dipped = false
let visible = false

const rad = (deg: number) => (deg * Math.PI) / 180
const f = (n: number) => n.toFixed(2)

function draw() {
  // Local frame: the tip at (0, 0). ub/uh point from the tip towards the handle.
  const ub = [Math.sin(rad(phi)), -Math.cos(rad(phi))]
  const uh = [Math.sin(rad(theta)), -Math.cos(rad(theta))]
  const n = [-uh[1], uh[0]] // across the handle

  const lb = BRISTLE_LEN * (1 - 0.22 * press)
  const hb = 3.3 * (1 + 0.55 * press) // a press splays the hair
  const F = [ub[0] * lb, ub[1] * lb] // where the hair meets the ferrule
  // the belly: the hair leaves the ferrule along the handle, then bends to the tip
  const C = [F[0] - uh[0] * lb * 0.55, F[1] - uh[1] * lb * 0.55]
  const bw = hb * 1.15
  const L = [F[0] - n[0] * hb, F[1] - n[1] * hb]
  const R = [F[0] + n[0] * hb, F[1] + n[1] * hb]
  const cap = [F[0] + uh[0] * 1.5, F[1] + uh[1] * 1.5]

  bristles.value?.setAttribute(
    'd',
    `M${f(L[0])} ${f(L[1])}Q${f(C[0] - n[0] * bw)} ${f(C[1] - n[1] * bw)} 0 0` +
      `Q${f(C[0] + n[0] * bw)} ${f(C[1] + n[1] * bw)} ${f(R[0])} ${f(R[1])}` +
      `Q${f(cap[0])} ${f(cap[1])} ${f(L[0])} ${f(L[1])}Z`
  )
  glint.value?.setAttribute(
    'd',
    `M${f(F[0] - n[0] * hb * 0.35)} ${f(F[1] - n[1] * hb * 0.35)}` +
      `Q${f(C[0] - n[0] * bw * 0.45)} ${f(C[1] - n[1] * bw * 0.45)} ${f(-n[0] * 0.4)} ${f(-n[1] * 0.4)}`
  )

  const G = [F[0] + uh[0] * FERRULE_LEN, F[1] + uh[1] * FERRULE_LEN]
  const H = [G[0] + uh[0] * HANDLE_LEN, G[1] + uh[1] * HANDLE_LEN]
  const quad = (a: number[], b: number[], wa: number, wb: number) =>
    `M${f(a[0] - n[0] * wa)} ${f(a[1] - n[1] * wa)}L${f(b[0] - n[0] * wb)} ${f(b[1] - n[1] * wb)}` +
    `L${f(b[0] + n[0] * wb)} ${f(b[1] + n[1] * wb)}L${f(a[0] + n[0] * wa)} ${f(a[1] + n[1] * wa)}Z`
  ferrule.value?.setAttribute('d', quad(F, G, 2.4, 2.3))
  // tapered handle with a rounded end
  handle.value?.setAttribute(
    'd',
    `M${f(G[0] - n[0] * 2.2)} ${f(G[1] - n[1] * 2.2)}L${f(H[0] - n[0] * 1.5)} ${f(H[1] - n[1] * 1.5)}` +
      `A1.5 1.5 0 0 1 ${f(H[0] + n[0] * 1.5)} ${f(H[1] + n[1] * 1.5)}` +
      `L${f(G[0] + n[0] * 2.2)} ${f(G[1] + n[1] * 2.2)}Z`
  )
  const b0 = [G[0] + uh[0] * 26, G[1] + uh[1] * 26]
  const b1 = [G[0] + uh[0] * 28, G[1] + uh[1] * 28]
  band.value?.setAttribute('d', quad(b0, b1, 1.85, 1.8))

  const hg = hairGrad.value
  if (hg) {
    hg.setAttribute('x1', f(F[0]))
    hg.setAttribute('y1', f(F[1]))
    hg.setAttribute('x2', '0')
    hg.setAttribute('y2', '0')
  }
  const bg = boneGrad.value
  if (bg) {
    bg.setAttribute('x1', f(G[0] - n[0] * 2.2))
    bg.setAttribute('y1', f(G[1] - n[1] * 2.2))
    bg.setAttribute('x2', f(G[0] + n[0] * 2.2))
    bg.setAttribute('y2', f(G[1] + n[1] * 2.2))
  }

  if (brush.value) brush.value.style.transform = `translate(${pos.x}px, ${pos.y}px)`
  if (bloom.value) bloom.value.style.transform = `translate(${pos.x}px, ${pos.y}px)`
}

function frame(now: number) {
  raf = 0
  const dt = lastT ? Math.min(0.033, (now - lastT) / 1000) : 1 / 60
  lastT = now
  const dx = pos.x - prev.x
  prev.x = pos.x
  prev.y = pos.y
  vx += ((dx / dt) * (1 / 60) - vx) * 0.35

  const target =
    BASE_ANGLE +
    (reduced ? 0 : Math.max(-MAX_LEAN, Math.min(MAX_LEAN, vx * 1.2))) +
    (dipped ? 6 : 0)
  if (reduced) {
    theta = phi = target
    omega = omegaPhi = 0
  } else {
    // handle: a lively spring that overshoots a little
    omega += ((target - theta) * 170 - omega * 13) * dt
    theta += omega * dt
    // hair: a softer spring trailing the handle, so it bends
    omegaPhi += ((theta - phi) * 95 - omegaPhi * 11) * dt
    phi += omegaPhi * dt
  }
  const want = pressed ? 1 : 0
  press += (want - press) * Math.min(1, dt * 18)
  draw()

  const busy =
    Math.abs(omega) + Math.abs(omegaPhi) > 0.4 ||
    Math.abs(target - theta) > 0.08 ||
    Math.abs(theta - phi) > 0.08 ||
    Math.abs(vx) > 0.05 ||
    Math.abs(want - press) > 0.01
  if (busy) schedule()
  else lastT = 0
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(frame)
}

function setVisible(on: boolean) {
  visible = on
  if (brush.value) brush.value.style.opacity = on ? '1' : '0'
  if (!on && bloom.value) bloom.value.style.opacity = '0'
}

function onPaper(x: number, y: number): boolean {
  return !!document.elementFromPoint(x, y)?.closest('[data-ink-surface="paper"]')
}

function onMove(event: MouseEvent) {
  pos.x = event.clientX
  pos.y = event.clientY
  if (!visible) {
    prev.x = pos.x
    prev.y = pos.y
    setVisible(true)
  }
  if (splashes) {
    // moved away from the resting ink: it dries; start waiting for the next rest
    if (restAt && Math.hypot(pos.x - restAt.x, pos.y - restAt.y) > 3) {
      restAt = null
      splashes.release()
    }
    clearTimeout(dwell)
    dwell = window.setTimeout(onRest, DWELL_MS)
  }
  schedule()
}

// Scrolling moves the paper under a still brush: resting ink dries where it
// is (it is pinned to the page), and a new rest starts once scrolling stops.
function onScroll() {
  if (!splashes) return
  restAt = null
  splashes.scrolled()
  clearTimeout(dwell)
  dwell = window.setTimeout(onRest, DWELL_MS)
}

function onRest() {
  if (!splashes || !visible || restAt) return
  restAt = { x: pos.x, y: pos.y }
  splashes.rest(pos.x, pos.y, onPaper(pos.x, pos.y))
}

function onOver(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest(TEXT_FIELD)) {
    setVisible(false)
    return
  }
  if (!visible) setVisible(true)
  dipped = !!target?.closest(INTERACTIVE)
  if (bloom.value) bloom.value.style.opacity = dipped ? '1' : '0'
  schedule()
}

function onLeaveWindow(event: MouseEvent) {
  if (!event.relatedTarget) setVisible(false)
}

/**
 * A drop of ink falls onto the click point from a random height, stretching
 * as it goes (the hero drop's shape and easing), and splashes there.
 */
function dropInk(x: number, y: number) {
  const tpl = dropTemplate.value
  if (!tpl || !splashes) return
  const layer = splashes
  const paper = onPaper(x, y)
  const scale = (inkUnit() * CLICK_SCALE) / 840 // the hero drop is drawn for a ~840px painting
  const fall = Math.min(y + 30, (140 + Math.random() * 140) * scale)
  const el = tpl.cloneNode() as HTMLElement
  tpl.parentElement?.appendChild(el)
  el.style.opacity = '1'
  const at = (dy: number, sx: number, sy: number) =>
    `translate(${x}px, ${y - dy}px) scale(${sx * scale}, ${sy * scale})`
  const anim = el.animate(
    [
      { transform: at(fall, 0.6, 0.6), offset: 0, easing: 'ease-out' },
      { transform: at(fall - 8, 1, 1.15), offset: 0.22, easing: 'cubic-bezier(.6,0,1,.6)' },
      { transform: at(0, 0.8, 2.3), offset: 1 },
    ],
    { duration: 260 + Math.sqrt(fall) * 22, fill: 'forwards' }
  )
  falling.add(anim)
  anim.onfinish = () => {
    falling.delete(anim)
    el.remove()
    layer.hit(x, y, paper)
  }
  anim.oncancel = () => {
    falling.delete(anim)
    el.remove()
  }
}

function onDown(event: MouseEvent) {
  pressed = true
  if (visible && event.button === 0) dropInk(event.clientX, event.clientY)
  schedule()
}

function onUp() {
  pressed = false
  schedule()
}

function onResize() {
  splashes?.resize()
}

onMounted(() => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.documentElement.classList.add(ROOT_CLASS)
  if (!reduced && splashCanvas.value) {
    try {
      splashes = createSplashLayer(splashCanvas.value)
    } catch (e) {
      console.error(e)
      splashes = null
    }
    window.addEventListener('resize', onResize)
  }
  draw()
  window.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('mouseover', onOver, { passive: true })
  document.addEventListener('mouseout', onLeaveWindow, { passive: true })
  window.addEventListener('mousedown', onDown, { passive: true })
  window.addEventListener('mouseup', onUp, { passive: true })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearTimeout(dwell)
  falling.forEach((a) => a.cancel())
  splashes?.destroy()
  splashes = null
  document.documentElement.classList.remove(ROOT_CLASS)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('mouseover', onOver)
  document.removeEventListener('mouseout', onLeaveWindow)
  window.removeEventListener('mousedown', onDown)
  window.removeEventListener('mouseup', onUp)
})
</script>

<template>
  <div aria-hidden="true">
    <canvas
      ref="splashCanvas"
      class="custom-cursor custom-cursor__layer"
    ></canvas>
    <!-- cloned for every click; the clone falls and splashes -->
    <div
      ref="dropTemplate"
      class="custom-cursor custom-cursor__drop"
    ></div>
    <div
      ref="bloom"
      class="custom-cursor custom-cursor__bloom"
    ></div>
    <svg
      ref="brush"
      class="custom-cursor custom-cursor__brush"
      width="1"
      height="1"
    >
      <defs>
        <linearGradient
          id="custom-cursor-hair"
          ref="hairGrad"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stop-color="#f1ebdf"
          />
          <stop
            offset=".32"
            stop-color="#b9ad99"
          />
          <stop
            offset=".55"
            stop-color="#27282c"
          />
          <stop
            offset="1"
            stop-color="#08090b"
          />
        </linearGradient>
        <linearGradient
          id="custom-cursor-bone"
          ref="boneGrad"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stop-color="#b9af9b"
          />
          <stop
            offset=".45"
            stop-color="#f6f1e6"
          />
          <stop
            offset="1"
            stop-color="#a99f8b"
          />
        </linearGradient>
      </defs>
      <path
        ref="handle"
        fill="url(#custom-cursor-bone)"
      />
      <path
        ref="band"
        fill="#c23b2a"
      />
      <path
        ref="ferrule"
        fill="#2a2724"
      />
      <path
        ref="bristles"
        fill="url(#custom-cursor-hair)"
        stroke="#fff"
        stroke-opacity=".25"
        stroke-width=".5"
      />
      <path
        ref="glint"
        fill="none"
        stroke="#fff"
        stroke-opacity=".45"
        stroke-width=".6"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<style lang="scss" scoped>
/** @define custom-cursor */
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  pointer-events: none;

  // Drawn around its own origin (the bristle tip), which sits on the pointer.
  &__brush {
    overflow: visible;
    filter: drop-shadow(0 2px 2.5px rgb(0 0 0 / 38%));
    opacity: 0;
    transition: opacity 0.2s;
    will-change: transform;
  }

  // full-viewport ink layers under the brush; sized in JS to device pixels
  &__layer {
    width: 100vw;
    max-width: none;
    height: 100vh;
  }

  // the hero's falling drop
  &__drop {
    width: 13px;
    height: 19px;
    margin: -19px 0 0 -6.5px;
    background: radial-gradient(circle at 35% 70%, #3a3f48 0 8%, #101214 30%);
    border-radius: 50% 50% 50% 50% / 72% 72% 34% 34%;
    opacity: 0;
    transform-origin: 50% 0;
    will-change: transform;
  }

  // soft cinnabar bloom under the tip over links and buttons
  &__bloom {
    width: 30px;
    height: 30px;
    margin: -15px 0 0 -15px;
    background: radial-gradient(circle, rgb(194 59 42 / 32%) 0 35%, rgb(194 59 42 / 0%) 70%);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.25s;
    will-change: transform;
  }
}
</style>
