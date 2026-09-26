<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { projects, projectKinds, type Project, type ProjectKind } from '../../model/portfolio'
import type { Bleed, Painting, RippleFilter } from './work/lib/transitions'

const { t } = useI18n()

type Filter = 'all' | ProjectKind
type Tab = 'about' | 'tools' | 'role'
const filters: Filter[] = ['all', ...projectKinds]
const tabs: Tab[] = ['about', 'tools', 'role']
// sheets of different lengths, pinned a little askew, so the wall does not read as a grid
const RATIOS = ['2 / 3', '3 / 5', '3 / 4', '5 / 8', '2 / 3', '4 / 5']
const TILTS = [-1.6, 1.2, -0.8, 1.8, -1.3, 0.9]
// the gallery: details of the painting until each project gets its own set
const DETAILS = [
  { pos: '30% 25%', tilt: -2 },
  { pos: '70% 60%', tilt: 1.5 },
  { pos: '45% 85%', tilt: -1 },
]

const filter = ref<Filter>('all')
const live = ref(false)
const opened = reactive<Record<string, boolean>>({})
const current = ref<Project | null>(null)
const activeId = ref<string | null>(null)
const tab = ref<Tab>('about')
const lightbox = ref<string | null>(null)
const state = reactive({ on: false, ready: false, covering: false, bleeding: false, noFade: false })

const lines = (key: string) => t(key).split('\n').filter(Boolean)
const index = computed(() => (current.value ? projects.indexOf(current.value) : -1))
const neighbour = (step: number) =>
  projects[(index.value + step + projects.length) % projects.length]
const visible = (p: Project) => filter.value === 'all' || p.kind === filter.value

const section = useTemplateRef<HTMLElement>('section')
const sheetEls = useTemplateRef<HTMLElement[]>('sheetEls')
const inside = useTemplateRef<HTMLElement>('inside')
const artCanvas = useTemplateRef<HTMLCanvasElement>('artCanvas')
const bleedCanvas = useTemplateRef<HTMLCanvasElement>('bleedCanvas')
const scroller = useTemplateRef<HTMLElement>('scroller')
const closeBtn = useTemplateRef<HTMLButtonElement>('closeBtn')
const rippleImage = useTemplateRef<SVGFEImageElement>('rippleImage')
const rippleMove = useTemplateRef<SVGFEDisplacementMapElement>('rippleMove')
const rippleBlur = useTemplateRef<SVGFEGaussianBlurElement>('rippleBlur')

// Client-only machinery, loaded in onMounted: the prerendered HTML is the wall
// of sheets with every title, and it works as a plain list without it.
let lib: typeof import('./work/lib/transitions') | null = null
let painting: Painting | null = null
let bleed: Bleed | null = null
let rippler: RippleFilter | null = null
let observer: IntersectionObserver | null = null
let REDUCED = false
let busy = false
let pushed = false
let lastAt: [number, number] | null = null
const timers: number[] = []
const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)))

const sheetOf = (id: string) => sheetEls.value?.find((el) => el.dataset.id === id) ?? null
const pictureOf = (id: string) => sheetOf(id)?.querySelector<HTMLElement>('.work__art') ?? null

function lockPage(on: boolean) {
  const root = document.documentElement
  // the scrollbar's width becomes padding, so the page does not jump when it
  // stops scrolling (a stable gutter would leave a strip the painting cannot cover)
  const bar = window.innerWidth - root.clientWidth
  root.style.paddingRight = on && bar > 0 ? bar + 'px' : ''
  root.style.overflow = on ? 'hidden' : ''
}

/* ---------------- the wall ---------------- */

function unrollAll(stagger = 0) {
  projects.forEach((p, i) => {
    if (!visible(p)) return
    if (REDUCED || !stagger) opened[p.id] = true
    else timers.push(window.setTimeout(() => (opened[p.id] = true), i * stagger))
  })
}

function pick(f: Filter) {
  if (f === filter.value) return
  if (!live.value || REDUCED) {
    filter.value = f
    return
  }
  // roll them up, show the matching ones, unroll them again
  projects.forEach((p) => (opened[p.id] = false))
  timers.push(
    window.setTimeout(() => {
      filter.value = f
      nextTick(() => unrollAll(60))
    }, 420)
  )
}

/* ---------------- into a painting and back ---------------- */

const BLOOM_AT = (): [number, number] => (window.innerWidth < 900 ? [0.5, 0.45] : [0.55, 0.5])

async function drawPainting(p: Project, instant = false, from?: [number, number]) {
  if (!painting || !lib) return
  if (!p.art) {
    painting.clear()
    return
  }
  painting.load(await lib.loadImage(p.art))
  // the ink follows the water: it spreads from where the water came from
  let at = BLOOM_AT()
  if (from && artCanvas.value) {
    const r = artCanvas.value.getBoundingClientRect()
    at = [
      Math.min(1.2, Math.max(-0.2, (from[0] - r.left) / r.width)),
      1 - (from[1] - r.top) / r.height,
    ]
  }
  painting.set(0.03, at) // the first ink is already there: no dead pause on blank paper
  if (instant || REDUCED) painting.set(1.45)
  else await painting.to(1.45, 3000)
}

async function enter(p: Project, e?: MouseEvent, { push = true, instant = false } = {}) {
  if (busy) return
  busy = true
  current.value = p
  activeId.value = p.id
  tab.value = 'about'
  lightbox.value = null
  if (push) history.pushState({ work: p.id }, '', `#/work/${p.id}`)
  pushed = push
  lockPage(true)
  const fast = instant || REDUCED || !bleed
  state.on = true
  state.ready = false
  if (!fast) Object.assign(state, { bleeding: true, covering: true, noFade: true })
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = 0
  painting?.fit()
  painting?.set(-0.1)
  const img = pictureOf(p.id)
  if (!fast && img && bleed && rippler && lib) {
    // the picture ripples where it was touched; wet paper spreads from there over the page
    const ir = img.getBoundingClientRect()
    const x = e && e.detail ? e.clientX : ir.left + ir.width / 2
    const y = e && e.detail ? e.clientY : ir.top + ir.height / 2
    lastAt = [x, y]
    lib.ripple(rippler, img, x - ir.left, y - ir.top, { ms: 700 })
    // once the water has covered about 60% of the screen, the painting starts to come through
    await bleed.run(x, y, 0, 1, 2200, 0.3)
    timers.push(
      window.setTimeout(
        () => Object.assign(state, { bleeding: false, covering: false }),
        2200 * 0.7 + 30
      )
    )
    state.noFade = false // the soft edge is there before the first ink
    drawPainting(p, false, [x, y])
    await wait(900)
  } else {
    Object.assign(state, { bleeding: false, covering: false, noFade: false })
    drawPainting(p, true)
  }
  state.ready = true
  closeBtn.value?.focus({ preventScroll: true })
  busy = false
}

async function leave({ pop = false } = {}) {
  if (!current.value || busy) return
  busy = true
  const id = current.value.id
  const sheet = sheetOf(id)
  const img = pictureOf(id)
  lightbox.value = null
  state.ready = false
  // keep the history in step (popstate is ignored while busy); a deep link just drops its hash
  if (!pop) {
    if (pushed) history.back()
    else history.replaceState(null, '', location.pathname + location.search)
  }
  if (!REDUCED && img && bleed && painting && rippler && lib && sheet?.offsetParent) {
    // all at once: the text blurs away, the ink washes off and the water draws back into the sheet
    const wash = painting.to(-0.1, 800)
    const ir = img.getBoundingClientRect()
    const [x, y] =
      lastAt && lastAt[0] >= ir.left && lastAt[0] <= ir.right
        ? lastAt
        : [ir.left + ir.width / 2, ir.top + ir.height / 2]
    Object.assign(state, { bleeding: true, covering: true, noFade: true })
    const settle = lib.ripple(rippler, img, x - ir.left, y - ir.top, { ms: 1300, settle: true })
    await bleed.run(x, y, 1, 0, 1250)
    await wash
    state.on = false
    await settle
  } else if (img) {
    img.style.filter = ''
    img.style.opacity = ''
  }
  Object.assign(state, { on: false, bleeding: false, covering: false, noFade: false })
  painting?.set(-0.1)
  lockPage(false)
  current.value = null
  activeId.value = null
  sheet?.focus({ preventScroll: true })
  busy = false
}

// from one painting to the next without leaving: the ink washes off, the next one blooms
async function switchTo(p: Project) {
  if (busy || !current.value) return
  busy = true
  state.ready = false
  lightbox.value = null
  await painting?.to(-0.1, 600)
  current.value = p
  tab.value = 'about'
  history.replaceState({ work: p.id }, '', `#/work/${p.id}`)
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = 0
  drawPainting(p)
  await wait(REDUCED ? 0 : 1000)
  state.ready = true
  busy = false
}

/* ---------------- keyboard and history ---------------- */

function onTabKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const i = tabs.indexOf(tab.value)
  tab.value = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
  nextTick(() => inside.value?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus())
}

function onKey(e: KeyboardEvent) {
  if (!current.value) return
  if (e.key === 'Escape') {
    if (lightbox.value) lightbox.value = null
    else leave()
  }
  // keep the focus inside the painting
  if (e.key === 'Tab' && inside.value) {
    const f = [
      ...inside.value.querySelectorAll<HTMLElement>('button:not([tabindex="-1"]), [tabindex="0"]'),
    ].filter((x) => x.offsetParent)
    if (!f.length) return
    if (e.shiftKey && document.activeElement === f[0]) {
      e.preventDefault()
      f[f.length - 1].focus()
    } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
      e.preventDefault()
      f[0].focus()
    }
  }
}

const fromHash = () => {
  const m = location.hash.match(/^#\/work\/(.+)$/)
  return m ? (projects.find((p) => p.id === m[1]) ?? null) : null
}
function onPop() {
  const p = fromHash()
  if (p && !current.value) enter(p, undefined, { push: false })
  else if (!p && current.value && !busy) leave({ pop: true })
}
function onResize() {
  if (current.value) painting?.fit()
}

onMounted(async () => {
  REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  lib = await import('./work/lib/transitions')
  if (!section.value) return
  try {
    painting = lib.createPainting(artCanvas.value!)
    bleed = lib.createBleed(bleedCanvas.value!)
  } catch (err) {
    console.error(err)
  }
  rippleImage.value?.setAttribute('href', lib.rippleMap())
  rippler = { image: rippleImage.value!, move: rippleMove.value!, blur: rippleBlur.value! }

  live.value = true
  if (REDUCED || !('IntersectionObserver' in window)) unrollAll()
  else {
    // each sheet unrolls as it comes into view
    observer = new IntersectionObserver(
      (es) =>
        es.forEach((en) => {
          const id = (en.target as HTMLElement).dataset.id
          if (en.isIntersecting && id) {
            opened[id] = true
            observer?.unobserve(en.target)
          }
        }),
      { threshold: 0.15 }
    )
    sheetEls.value?.forEach((el) => observer!.observe(el))
  }
  window.addEventListener('keydown', onKey)
  window.addEventListener('popstate', onPop)
  window.addEventListener('resize', onResize)
  // a link straight into a painting opens it at once
  const p = fromHash()
  if (p) enter(p, undefined, { push: false, instant: true })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  timers.forEach(clearTimeout)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('popstate', onPop)
  window.removeEventListener('resize', onResize)
  if (current.value) lockPage(false)
})
</script>

<template>
  <section
    id="work"
    ref="section"
    class="work"
    :class="{ 'work--live': live }"
    data-ink-surface="paper"
  >
    <svg
      class="work__defs"
      width="0"
      height="0"
      aria-hidden="true"
    >
      <filter
        id="work-rough"
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency=".9"
          numOctaves="2"
          seed="4"
          result="n"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n"
          scale="2.6"
        />
      </filter>
      <!-- the ripple: rings around the touch point, a neutral map everywhere else -->
      <filter
        id="work-ripple"
        x="0"
        y="0"
        width="100%"
        height="100%"
        color-interpolation-filters="sRGB"
      >
        <feFlood
          flood-color="rgb(128,128,128)"
          result="flat"
        />
        <feImage
          ref="rippleImage"
          preserveAspectRatio="none"
          result="rings"
        />
        <feMerge result="map">
          <feMergeNode in="flat" />
          <feMergeNode in="rings" />
        </feMerge>
        <feDisplacementMap
          ref="rippleMove"
          in="SourceGraphic"
          in2="map"
          scale="0"
          xChannelSelector="R"
          yChannelSelector="G"
          result="moved"
        />
        <feGaussianBlur
          ref="rippleBlur"
          in="moved"
          stdDeviation="0"
        />
      </filter>
    </svg>

    <div class="work__inner">
      <p class="work__eyebrow">{{ t('home.work.eyebrow') }}</p>
      <h2 class="work__title">{{ t('home.work.title') }}</h2>
      <p class="work__lead">{{ t('home.work.lead') }}</p>

      <div
        class="work__filters"
        role="group"
        :aria-label="t('home.work.filterLabel')"
      >
        <button
          v-for="f in filters"
          :key="f"
          class="work__stamp work__filter"
          :class="{ 'work__filter--on': filter === f }"
          type="button"
          :aria-pressed="filter === f"
          @click="pick(f)"
        >
          {{ t(`home.work.filters.${f}`) }}
        </button>
      </div>

      <div class="work__wall">
        <button
          v-for="(p, i) in projects"
          v-show="visible(p)"
          :key="p.id"
          ref="sheetEls"
          class="work__sheet"
          :class="{
            'work__sheet--open': opened[p.id],
            'work__sheet--active': activeId === p.id,
          }"
          :style="{
            '--work-ratio': RATIOS[i % RATIOS.length],
            '--work-tilt': TILTS[i % TILTS.length] + 'deg',
            transitionDelay: (i % 4) * 0.08 + 's',
          }"
          :data-id="p.id"
          type="button"
          @click="enter(p, $event)"
        >
          <span class="work__hang">
            <span
              class="work__nail"
              aria-hidden="true"
              >{{ t('home.hero.seal') }}</span
            >
            <span class="work__paper">
              <span class="work__frame">
                <img
                  v-if="p.art"
                  class="work__art"
                  :src="p.art"
                  alt=""
                  width="1333"
                  height="2000"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  v-else
                  class="work__art work__art--blank"
                ></span>
                <span
                  v-if="!p.art"
                  class="work__soon"
                  >{{ t('home.work.soon') }}</span
                >
                <span class="work__mist"></span>
              </span>
              <span
                class="work__curl"
                aria-hidden="true"
              ></span>
            </span>
          </span>
          <span class="work__label">
            <span class="work__year">{{ p.years }}</span>
            <span class="work__name">{{ t(`home.work.items.${p.id}.title`) }}</span>
          </span>
          <span class="work__kind">{{ t(`home.work.kinds.${p.kind}`) }}</span>
        </button>
      </div>
    </div>

    <!-- inside a painting -->
    <div
      ref="inside"
      class="work__inside"
      :class="{
        'work__inside--on': state.on,
        'work__inside--ready': state.ready,
        'work__inside--covering': state.covering,
        'work__inside--bleeding': state.bleeding,
        'work__inside--no-fade': state.noFade,
      }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="work-inside-title"
    >
      <div class="work__inside-paper"></div>
      <canvas
        ref="bleedCanvas"
        class="work__bleed"
        aria-hidden="true"
      ></canvas>
      <canvas
        ref="artCanvas"
        class="work__scene"
        aria-hidden="true"
      ></canvas>
      <div class="work__fade"></div>
      <div
        ref="scroller"
        class="work__scroller"
      >
        <div
          v-if="current"
          class="work__body"
        >
          <div class="work__meta">
            <b class="work__meta-num">{{ String(index + 1).padStart(2, '0') }}</b> ·
            {{ t(`home.work.kinds.${current.kind}`) }} · {{ current.years }}
          </div>
          <h2
            id="work-inside-title"
            class="work__inside-title"
          >
            {{ t(`home.work.items.${current.id}.title`) }}
          </h2>
          <div
            class="work__tabs"
            role="tablist"
            :aria-label="t('home.work.tabsLabel')"
          >
            <button
              v-for="id in tabs"
              :id="`work-tab-${id}`"
              :key="id"
              class="work__stamp work__tab"
              role="tab"
              type="button"
              :aria-selected="tab === id"
              :tabindex="tab === id ? 0 : -1"
              aria-controls="work-panel"
              @click="tab = id"
              @keydown="onTabKey"
            >
              {{ t(`home.work.tabs.${id}`) }}
            </button>
          </div>
          <div
            id="work-panel"
            :key="current.id + tab"
            class="work__panel"
            role="tabpanel"
            tabindex="0"
            :aria-labelledby="`work-tab-${tab}`"
          >
            <template v-if="tab === 'about'">
              <p
                v-for="(para, k) in t(`home.work.items.${current.id}.about`).split('\n\n')"
                :key="k"
                class="work__para"
              >
                {{ para }}
              </p>
            </template>
            <div
              v-else-if="tab === 'tools'"
              class="work__brands"
            >
              <span
                v-for="x in current.tools.main"
                :key="x"
                class="work__stamp work__brand work__brand--main"
                >{{ x }}</span
              >
              <span
                v-for="x in current.tools.rest"
                :key="x"
                class="work__stamp work__brand"
                >{{ x }}</span
              >
            </div>
            <template v-else>
              <p class="work__para work__role">{{ t(`home.work.items.${current.id}.role`) }}</p>
              <ul class="work__did">
                <li
                  v-for="line in lines(`home.work.items.${current.id}.did`)"
                  :key="line"
                  class="work__did-item"
                >
                  {{ line }}
                </li>
              </ul>
            </template>
          </div>
          <div
            v-if="current.art"
            class="work__gallery"
          >
            <button
              v-for="d in DETAILS"
              :key="d.pos"
              class="work__detail"
              type="button"
              :style="{ '--work-tilt': d.tilt + 'deg' }"
              :aria-label="t('home.work.zoom')"
              @click="lightbox = current.art!"
            >
              <img
                class="work__detail-img"
                :src="current.art"
                :style="{ objectPosition: d.pos }"
                alt=""
              />
            </button>
          </div>
          <div class="work__nav">
            <button
              class="work__nav-btn"
              type="button"
              @click="switchTo(neighbour(-1))"
            >
              ← {{ t('home.work.prev') }}
              <small class="work__nav-name">{{
                t(`home.work.items.${neighbour(-1).id}.title`)
              }}</small>
            </button>
            <button
              class="work__nav-btn work__nav-btn--next"
              type="button"
              @click="switchTo(neighbour(1))"
            >
              {{ t('home.work.next') }} →
              <small class="work__nav-name">{{
                t(`home.work.items.${neighbour(1).id}.title`)
              }}</small>
            </button>
          </div>
        </div>
      </div>
      <button
        ref="closeBtn"
        class="work__close"
        type="button"
        :aria-label="t('home.work.close')"
        @click="leave()"
      >
        ✕
      </button>
      <button
        v-if="lightbox"
        class="work__lightbox"
        type="button"
        :aria-label="t('home.work.close')"
        @click="lightbox = null"
      >
        <img
          class="work__lightbox-img"
          :src="lightbox"
          alt=""
        />
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
/** @define work */
.work {
  // The wall continues the hero's and the river's paper.
  --work-paper: #ece8e1;
  --work-sheet: #f4f1ec;
  --work-ink: #101214;
  --work-ink-soft: #3a4454;
  --work-text: #2a2f36;
  --work-seal: #c23b2a;
  /* inside a painting the scene and the text sit in the page's column too:
     the margin of the column, and the painting's share of it */
  --work-inset: max(var(--page-gutter), calc((100vw - var(--page-width)) / 2));
  --work-scene: min(calc((100vw - 2 * var(--work-inset)) * 0.56), 820px);

  position: relative;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: normal;
  color: var(--work-ink);
  background-color: var(--work-paper);
  -webkit-font-smoothing: antialiased;

  &__defs {
    position: absolute;
  }

  &__inner {
    padding: 120px var(--page-pad) 120px;
  }

  &__eyebrow {
    margin: 0;
    font-size: var(--type-eyebrow-size);
    color: var(--work-ink-soft);
    text-transform: uppercase;
    letter-spacing: var(--type-eyebrow-tracking);
  }

  &__title {
    margin: 10px 0 0;
    font-family: var(--type-display);
    font-size: var(--type-title-size);
    font-weight: var(--type-title-weight);
    line-height: var(--type-title-leading);
    letter-spacing: var(--type-title-tracking);
  }

  &__lead {
    max-width: 520px;
    margin: 18px 0 0;
    font-size: 13px;
    line-height: 1.62;
    color: var(--work-text);
  }

  /* ---------- stamps: a rough seal outline, crisp text ---------- */
  &__stamp {
    position: relative;
    isolation: isolate;

    &::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      content: '';
      background: var(--work-stamp-bg, none);
      filter: url('#work-rough');
      border: 1.5px solid currentcolor;
      border-radius: 3px;
    }
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 36px 0 48px;
  }

  &__filter,
  &__tab {
    padding: 8px 12px 7px;
    font: inherit;
    font-size: 11.5px;
    color: var(--work-seal);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    background: none;
    border: 0;
  }

  &__filter {
    opacity: 0.75;
    transition:
      opacity 0.2s,
      transform 0.25s cubic-bezier(0.2, 1.4, 0.4, 1);

    /* half pressed on hover: turned like the chosen stamp, a pale wash of ink */
    &:hover:not(&--on) {
      --work-stamp-bg: rgb(194 59 42 / 16%);

      opacity: 1;
      transform: rotate(-2deg);
    }

    &--on {
      --work-stamp-bg: var(--work-seal);

      color: var(--work-paper);
      opacity: 0.95;
      transform: rotate(-2deg);
    }
  }

  /* ---------- the wall of pinned sheets ---------- */
  &__wall {
    column-gap: clamp(28px, 4vw, 64px);
    columns: 4 220px;
  }

  &__sheet {
    display: block;
    width: 100%;
    padding: 0;
    margin: 0 0 56px;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
    background: none;
    border: 0;
    break-inside: avoid;
  }

  &__hang {
    position: relative;
    display: block;
    padding-top: 12px;
    transform: rotate(var(--work-tilt, 0deg));
    transform-origin: 50% 12px; // it turns on the pin
    transition: transform 0.9s cubic-bezier(0.2, 1.5, 0.4, 1);
  }

  &__sheet:hover &__hang,
  &__sheet:focus-visible &__hang,
  &__sheet--active &__hang {
    transform: rotate(0deg) translateY(-3px);
  }

  &__nail {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 3;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    margin-left: -13px;
    font-family: Unbounded, sans-serif;
    font-size: 8.5px;
    font-weight: 500;
    color: var(--work-paper);
    letter-spacing: -0.04em;
    background: var(--work-seal);
    filter: url('#work-rough');
    border-radius: 50%;
    box-shadow: 0 3px 4px rgb(0 0 0 / 28%);
  }

  &__paper {
    position: relative;
    display: block;
  }

  &__frame {
    position: relative;
    display: block;
    padding: 10px;
    overflow: hidden;
    clip-path: inset(0 0 100% 0);
    background: var(--work-sheet);
    box-shadow:
      0 12px 24px -10px rgb(0 0 0 / 30%),
      0 1px 2px rgb(0 0 0 / 8%);
    transition:
      clip-path 1.1s cubic-bezier(0.3, 0.7, 0.2, 1),
      box-shadow 0.6s ease;
  }

  &__sheet:hover &__frame {
    box-shadow:
      0 20px 34px -12px rgb(0 0 0 / 34%),
      0 1px 2px rgb(0 0 0 / 8%);
  }

  &__art {
    display: block;
    width: 100%;
    max-width: none;
    height: auto;
    aspect-ratio: var(--work-ratio, 2 / 3);
    object-fit: cover;
    filter: contrast(0.9) brightness(1.04) blur(0.3px);
    mix-blend-mode: multiply;
    transition: filter 0.8s ease;

    &--blank {
      background: linear-gradient(#f1ede6, #e6e1d8);
    }
  }

  &__sheet:hover &__art,
  &__sheet--active &__art {
    filter: contrast(1.05) brightness(1) blur(0);
  }

  // a mist over the painting that clears on hover
  &__mist {
    position: absolute;
    inset: 10px;
    pointer-events: none;
    background: radial-gradient(
      120% 60% at 50% 70%,
      rgb(241 237 230 / 0%) 40%,
      rgb(241 237 230 / 55%) 100%
    );
    transition: opacity 0.8s ease;
  }

  &__sheet:hover &__mist,
  &__sheet--active &__mist {
    opacity: 0;
  }

  &__soon {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 11px;
    color: #9a958c;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  // the roll of paper that travels down as the sheet unrolls
  &__curl {
    position: absolute;
    top: 0;
    right: -2px;
    left: -2px;
    z-index: 2;
    height: 16px;
    margin-top: -8px;
    background: linear-gradient(to bottom, #d9d4cb 0%, #fbf9f5 38%, #efebe4 60%, #c9c3b8 100%);
    border-radius: 8px;
    box-shadow: 0 6px 8px -3px rgb(0 0 0 / 25%);
    transition:
      top 1.1s cubic-bezier(0.3, 0.7, 0.2, 1),
      opacity 0.25s ease 1.05s;
  }

  // Every sheet is rolled up until it comes into view; the roll then travels
  // down and the painting appears behind it. Without JavaScript the <noscript>
  // rule below leaves them open.
  &__sheet--open &__frame {
    clip-path: inset(0 0 0 0);
  }

  &__sheet--open &__curl {
    top: 100%;
    opacity: 0;
  }

  // the years over the title, like a line of a label: the title has the card's whole width
  &__label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 18px;
  }

  &__name {
    // a word longer than the card ("документооборотом" on a narrow one) breaks, not overflows
    overflow-wrap: break-word;
    font-family: Unbounded, sans-serif;
    font-size: 15px;
    font-weight: 300;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }

  &__year {
    font-size: 11px;
    color: var(--work-seal);
    letter-spacing: 0.1em;
  }

  &__kind {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    color: var(--work-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* ---------- inside a painting ---------- */
  &__inside {
    position: fixed;
    inset: 0;
    /* over the page's header: a painting takes the whole screen */
    z-index: 7100;
    display: none;
    overflow: hidden;

    &--on {
      display: block;
    }
  }

  &__inside-paper {
    position: absolute;
    inset: 0;
    background: var(--work-paper);
  }

  &__bleed {
    position: absolute;
    inset: 0;
    display: none;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  &__inside--bleeding &__bleed {
    display: block;
  }

  &__inside--bleeding &__inside-paper {
    opacity: 0;
  }

  &__scene {
    position: absolute;
    top: 0;
    left: var(--work-inset);
    width: var(--work-scene);
    height: 100%;
    /* its paper meets the page's paper without a seam on the column side */
    mask-image: linear-gradient(to right, transparent, #000 140px);
  }

  &__fade {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(var(--work-inset) + var(--work-scene) - 140px);
    width: 142px;
    pointer-events: none;
    background: linear-gradient(to right, rgb(236 232 225 / 0%), var(--work-paper));
    transition: opacity 0.5s ease;
  }

  &__inside--no-fade &__fade {
    opacity: 0;
  }

  &__scroller {
    position: absolute;
    inset: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* the text stands level with the painting: centred on the screen's height,
     and only scrolls when it is taller than the screen */
  &__body {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
    min-height: 100%;
    max-width: min(720px, calc(100vw - 2 * var(--work-inset) - var(--work-scene)));
    padding: 90px 0 80px clamp(20px, 2.5vw, 40px);
    margin-left: calc(var(--work-inset) + var(--work-scene));

    > * {
      filter: blur(10px);
      opacity: 0;
      transition:
        opacity 0.9s ease,
        filter 1.3s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
  }

  &__inside--ready &__body > * {
    filter: blur(0);
    opacity: 1;
  }

  @for $i from 2 through 6 {
    &__inside--ready &__body > :nth-child(#{$i}) {
      transition-delay: ($i - 1) * 0.08s;
    }
  }

  &__meta {
    font-size: 11.5px;
    color: var(--work-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__meta-num {
    font-weight: 400;
    color: var(--work-seal);
  }

  &__inside-title {
    margin: 12px 0 0;
    font-family: Unbounded, sans-serif;
    font-size: clamp(28px, 3.4vw, 50px);
    font-weight: 300;
    line-height: 1.08;
    letter-spacing: -0.02em;
  }

  &__tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 34px 0 0;
  }

  &__tab {
    padding: 9px 13px 8px;
    transition:
      color 0.25s,
      transform 0.25s cubic-bezier(0.2, 1.4, 0.4, 1);

    &::before {
      opacity: 0.6;
      transition: opacity 0.25s;
    }

    &:hover::before {
      opacity: 1;
    }

    &:hover:not([aria-selected='true']) {
      --work-stamp-bg: rgb(194 59 42 / 16%);

      transform: rotate(-2deg);
    }

    &[aria-selected='true'] {
      --work-stamp-bg: var(--work-seal);

      color: var(--work-paper);
      transform: rotate(-2deg);

      &::before {
        opacity: 1;
      }
    }
  }

  &__filter:focus-visible,
  &__tab:focus-visible,
  &__sheet:focus-visible,
  &__close:focus-visible,
  &__nav-btn:focus-visible,
  &__detail:focus-visible {
    outline: 2px solid var(--work-seal);
    outline-offset: 4px;
  }

  &__panel {
    min-height: 190px;
    margin-top: 28px;
    font-size: 13.5px;
    line-height: 1.7;
    color: var(--work-text);
  }

  // the wet switch between tabs; until the painting is drawn the panel waits
  // with the rest of the text, so the animation must not show it early
  &__inside--ready &__panel {
    animation: work-wet 0.55s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  &__para {
    margin: 0 0 12px;
  }

  &__role {
    font-weight: 500;
  }

  &__did {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  &__did-item {
    position: relative;
    padding-left: 20px;
    margin: 0 0 10px;

    &::before {
      position: absolute;
      top: 0.62em;
      left: 0;
      width: 9px;
      height: 2px;
      content: '';
      background: var(--work-ink);
      border-radius: 2px;
    }
  }

  // tools as small ink brands
  &__brands {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__brand {
    padding: 7px 11px 6px;
    font-size: 12px;
    color: var(--work-ink);

    &--main {
      --work-stamp-bg: var(--work-ink);

      color: var(--work-paper);
    }
  }

  &__gallery {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 44px;
  }

  &__detail {
    position: relative;
    padding: 0;
    cursor: zoom-in;
    background: var(--work-sheet);
    border: 0;
    box-shadow: 0 10px 20px -10px rgb(0 0 0 / 30%);
    transform: rotate(var(--work-tilt, 0deg));
    transition: transform 0.4s cubic-bezier(0.2, 1.4, 0.4, 1);

    &::before {
      position: absolute;
      top: -6px;
      left: 50%;
      z-index: 1;
      width: 9px;
      height: 9px;
      margin-left: -4.5px;
      content: '';
      background: var(--work-seal);
      filter: url('#work-rough');
      border-radius: 50%;
    }

    &:hover {
      transform: rotate(0) scale(1.04);
    }
  }

  &__detail-img {
    display: block;
    width: 100%;
    max-width: none;
    aspect-ratio: 1;
    object-fit: cover;
    mix-blend-mode: multiply;
  }

  &__nav {
    display: flex;
    gap: 20px;
    justify-content: space-between;
    padding-top: 20px;
    margin-top: 56px;
    border-top: 1px solid rgb(16 18 20 / 15%);
  }

  &__nav-btn {
    padding: 6px 0;
    font: inherit;
    font-size: 12px;
    color: var(--work-ink);
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    background: none;
    border: 0;
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }

    &--next {
      text-align: right;
    }
  }

  &__nav-name {
    display: block;
    margin-top: 4px;
    font-family: Unbounded, sans-serif;
    font-size: 14px;
    font-weight: 300;
    text-transform: none;
    letter-spacing: 0;
  }

  &__close {
    position: absolute;
    top: 26px;
    right: var(--work-inset);
    z-index: 2;
    display: grid;
    place-items: center;
    width: 50px;
    aspect-ratio: 1;
    font-family: Unbounded, sans-serif;
    font-size: 15px;
    color: var(--work-paper);
    cursor: pointer;
    background: var(--work-seal);
    filter: url('#work-rough');
    border: 0;
    border-radius: 4px;
    opacity: 0;
    transform: rotate(-5deg);
    transition:
      opacity 0.4s ease 0.3s,
      transform 0.3s cubic-bezier(0.2, 1.4, 0.4, 1);

    &:hover {
      transform: rotate(0) scale(1.06);
    }
  }

  &__inside--ready &__close {
    opacity: 0.92;
  }

  &__inside--covering &__close {
    opacity: 0;
  }

  &__lightbox {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: grid;
    place-items: center;
    padding: 0;
    cursor: zoom-out;
    background: rgb(236 232 225 / 94%);
    border: 0;
    animation: work-wet 0.4s ease;
  }

  &__lightbox-img {
    max-width: 86vw;
    max-height: 86vh;
    mix-blend-mode: multiply;
    box-shadow: 0 20px 40px -20px rgb(0 0 0 / 35%);
  }

  @media (width < 900px) {
    &__scene {
      left: 0;
      width: 100%;
      height: 52vh;
      mask-image: none;
    }

    &__fade {
      top: calc(52vh - 160px);
      bottom: auto;
      left: 0;
      width: 100%;
      height: 162px;
      background: linear-gradient(to bottom, rgb(236 232 225 / 0%), var(--work-paper));
    }

    &__body {
      justify-content: flex-start;
      max-width: none;
      padding: calc(52vh - 30px) var(--work-inset) 60px;
      margin-left: 0;
    }

    &__gallery {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (width < 600px) {
    &__wall {
      column-gap: 18px;
      columns: 2;
    }

    &__sheet {
      margin-bottom: 36px;
    }

    &__name {
      font-size: 13px;
    }

    &__label {
      gap: 4px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__frame,
    &__curl,
    &__hang,
    &__body > * {
      transition: none;
    }
  }
}

@keyframes work-wet {
  from {
    filter: blur(8px);
    opacity: 0;
  }

  to {
    filter: blur(0);
    opacity: 1;
  }
}
</style>
