<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'
import { localeUrlPath } from '@/app/config/site'
import { usePageSeo } from '../seo/usePageSeo'

/*
 * A page that is not there: the taiga in the mist, the number painted beside it,
 * and the wolverine's trail that walks out of the mist and ends before it, where
 * the birds take off. The trail is laid a step at a time once the painting has
 * loaded; the way back leads home, in the language of the address.
 */
usePageSeo()
const { t } = useI18n()
const { locale } = useLocale()
const home = computed(() => localeUrlPath(locale.value))

const scene = useTemplateRef<HTMLElement>('scene')
const canvas = useTemplateRef<HTMLCanvasElement>('trail')
const STEP_MS = 220

let shown = 0
let timer = 0
let observer: ResizeObserver | null = null
let draw = () => {}

onMounted(async () => {
  const { createTrail } = await import('../lib/trail')
  const box = scene.value
  const host = canvas.value
  if (!box || !host) return

  const trail = createTrail()
  draw = () => trail.draw(host, box.clientWidth, box.clientHeight, shown)
  observer = new ResizeObserver(() => draw())
  observer.observe(box)

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shown = trail.steps
    draw()
    return
  }
  // one step at a time, as it walked
  const walk = () => {
    shown += 1
    draw()
    if (shown < trail.steps) timer = window.setTimeout(walk, STEP_MS)
  }
  timer = window.setTimeout(walk, 500)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  observer?.disconnect()
})
</script>

<template>
  <div class="not-found">
    <div
      ref="scene"
      class="not-found__scene"
    >
      <img
        class="not-found__painting"
        src="/not-found/taiga-404.webp"
        srcset="/not-found/taiga-404-1200.webp 1200w, /not-found/taiga-404.webp 2000w"
        sizes="(max-width: 1400px) 100vw, 1400px"
        width="2000"
        height="1333"
        alt=""
        fetchpriority="high"
      />
      <canvas
        ref="trail"
        class="not-found__trail"
        aria-hidden="true"
      ></canvas>
    </div>

    <div class="not-found__copy">
      <h1 class="not-found__heading">
        <span class="not-found__sr">404. </span>{{ t('notFound.heading') }}
      </h1>
      <p class="not-found__text">{{ t('notFound.text') }}</p>
      <RouterLink
        class="not-found__home"
        :to="home"
      >
        <span aria-hidden="true">←</span> {{ t('notFound.btnHome') }}
      </RouterLink>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/** @define not-found */
.not-found {
  // the same paper and ink as the rest of the site, and the seal's cinnabar
  --not-found-paper: #ece8e1;
  --not-found-ink: #101214;
  --not-found-ink-soft: #3a4454;
  --not-found-sun: #c73826;

  /* the painting as large as the screen lets it be with the words under it:
     the whole page fits in one screen, no scrolling */
  --not-found-scene: min(100%, 1400px, calc((var(--app-height, 100svh) - 360px) * 1.6));

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: var(--app-height, 100svh);
  padding: 24px 0 56px;
  overflow: hidden;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--not-found-ink);
  background: var(--not-found-paper);
  -webkit-font-smoothing: antialiased;

  &__scene {
    position: relative;
    flex: none;
    width: var(--not-found-scene);
    aspect-ratio: 3 / 2;
    // the taiga and the number fill the left three quarters of the painting:
    // moved right by the difference, they stand in the middle of the page
    transform: translateX(9%);
    // its edges melt into the page's paper, with no seam whatever the tone
    mask-image:
      linear-gradient(to right, transparent, #000 8%, #000 92%, transparent),
      linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent);
    mask-composite: intersect;
  }

  &__painting,
  &__trail {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  &__painting {
    display: block;
    object-fit: cover;
  }

  // the empty paper under the number: the words sit in it
  &__copy {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 720px;
    padding: 0 var(--page-gutter);
    // into the empty paper at the bottom of the painting
    margin-top: calc(var(--not-found-scene) / -15);
    text-align: center;
  }

  &__heading {
    margin: 0;
    font-family: var(--type-display);
    font-size: clamp(22px, 2.6vw, 34px);
    font-weight: 300;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  &__text {
    max-width: 44ch;
    margin: 16px 0 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--not-found-ink-soft);
  }

  // the site nav's call to action: a cinnabar outline that fills on hover
  &__home {
    margin-top: 28px;
    padding: 9px 16px 8px;
    font-size: 11.5px;
    color: var(--not-found-sun);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border: 1px solid rgb(199 56 38 / 60%);
    border-radius: 2px;
    transition:
      color 0.2s,
      background-color 0.2s;
  }

  &__home:hover {
    color: var(--not-found-paper);
    background: var(--not-found-sun);
  }

  &__home:focus-visible {
    outline: 2px solid var(--not-found-sun);
    outline-offset: 3px;
  }

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* on a phone the painting is narrow: larger than the screen, its empty paper
     off the sides, the taiga and the number kept in view */
  @media (width <= 700px) {
    &__scene {
      width: 135%;
    }

    &__copy {
      margin-top: -4%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__home {
      transition: none;
    }
  }
}
</style>
