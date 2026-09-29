<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { INK_IMAGE } from './hero/config'
import type { Caption, InkScene } from './hero/lib/scene'
import { onGraphicsChange } from '@/shared/lib/graphics'
import { pageHero, registerPageHero } from '@/shared/lib/pageHero'
import { LocaleSwitch } from '@/shared/ui'

const { t } = useI18n()
// the role in two parts, the title and the rest ("Fullstack · Team Lead"): on a narrow
// screen each takes a line of its own, instead of a dot left hanging at a line's end
const role = computed(() => {
  const [title, ...rest] = t('home.hero.role').split(' · ')
  return { title, rest: rest.join(' · ') }
})

const root = useTemplateRef<HTMLElement>('root')
const stage = useTemplateRef<HTMLElement>('stage')
const paper = useTemplateRef<HTMLElement>('paper')
const sheet = useTemplateRef<HTMLElement>('sheet')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const art = useTemplateRef<HTMLImageElement>('art')
const drop = useTemplateRef<HTMLElement>('drop')
const sunDrop = useTemplateRef<HTMLElement>('sunDrop')

// Everything below is client-only. The prerendered HTML carries the name, the
// role and the painting; the scroll logic and WebGL attach in onMounted.
const shown = reactive<Record<Caption, boolean>>({
  name: false,
  role: false,
  seal: false,
  controls: false,
})
const imageFallback = ref(false)
const artShown = ref(false)

let scene: InkScene | null = null
let unmounted = false
let offGraphics = () => {}

onMounted(async () => {
  // the page corner keeps its buttons off the hero while it is here
  registerPageHero(root.value)
  // Kept out of the initial chunk's critical path: the scroll is rolled up on
  // load, so nothing needs the renderer before the first scroll.
  const { mountInkScene } = await import('./hero/lib/scene')
  if (unmounted) return
  // the light mode drops the mist (the scene starts without it when already in it)
  offGraphics = onGraphicsChange((level) => {
    // off in the light mode, and back when it is turned off (not with reduced motion)
    scene?.setFog(level !== 'low' && !matchMedia('(prefers-reduced-motion: reduce)').matches)
  })
  scene = mountInkScene(
    {
      root: root.value!,
      stage: stage.value!,
      paper: paper.value!,
      sheet: sheet.value!,
      canvas: canvas.value!,
      art: art.value!,
      drop: drop.value!,
      sunDrop: sunDrop.value!,
    },
    {
      show: (caption) => (shown[caption] = true),
      hideCaptions: () => {
        for (const key of Object.keys(shown) as Caption[]) shown[key] = false
      },
      useImageFallback: () => (imageFallback.value = true),
      showArt: (on) => (artShown.value = on),
    }
  )
})

onBeforeUnmount(() => {
  if (pageHero.value === root.value) registerPageHero(null)
  unmounted = true
  offGraphics()
  scene?.destroy()
  scene = null
})
</script>

<template>
  <header
    id="top"
    ref="root"
    class="hero"
    :class="{ 'hero--flat': imageFallback }"
  >
    <svg
      class="hero__defs"
      width="0"
      height="0"
      aria-hidden="true"
    >
      <filter
        id="hero-rough"
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
          scale="3.2"
        />
      </filter>
    </svg>

    <div
      ref="stage"
      class="hero__stage"
    >
      <!-- the hanging scroll in 3D; the paper below only carries the captions -->
      <canvas
        v-if="!imageFallback"
        ref="canvas"
        class="hero__canvas"
        aria-hidden="true"
      ></canvas>

      <div
        ref="paper"
        class="hero__paper"
        data-ink-surface="paper"
      >
        <div
          ref="sheet"
          class="hero__sheet"
        >
          <!-- The WebGL texture source and the painting itself when WebGL2 is out. -->
          <picture>
            <source
              type="image/avif"
              :srcset="INK_IMAGE.avif"
            />
            <img
              ref="art"
              class="hero__art"
              :class="{ 'hero__art--fallback': imageFallback, 'hero__art--shown': artShown }"
              :src="INK_IMAGE.webp"
              :width="INK_IMAGE.width"
              :height="INK_IMAGE.height"
              :alt="t('home.hero.art')"
              decoding="async"
            />
          </picture>
          <!-- without WebGL: the sun the shader would paint, a disc of cinnabar -->
          <div
            v-if="imageFallback"
            class="hero__sun"
            :class="{ 'hero__sun--shown': artShown }"
            aria-hidden="true"
          ></div>
          <div
            ref="drop"
            class="hero__drop"
          ></div>
          <div
            ref="sunDrop"
            class="hero__drop hero__drop--sun"
          ></div>

          <div class="hero__title">
            <h1
              class="hero__name"
              :class="{ 'hero__name--shown': shown.name }"
            >
              <span class="hero__name-line">{{ t('home.hero.firstName') }}</span>
              <span class="hero__name-line">{{ t('home.hero.lastName') }}</span>
            </h1>
            <p
              class="hero__role"
              :class="{ 'hero__role--shown': shown.role }"
            >
              <span class="hero__role-part">{{ role.title }}</span>
              <template v-if="role.rest">
                <span class="hero__role-sep"> · </span>
                <span class="hero__role-part">{{ role.rest }}</span>
              </template>
            </p>
          </div>

          <div
            class="hero__seal"
            :class="{ 'hero__seal--shown': shown.seal }"
            aria-hidden="true"
          >
            {{ t('home.hero.seal') }}
          </div>
          <LocaleSwitch
            class="hero__control"
            :class="{ 'hero__control--shown': shown.controls }"
          />
        </div>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
/** @define hero */
.hero {
  // Tokens from the prototype. The site is dark-only, so the desk takes the
  // prototype's dark variant.
  --hero-desk: #14161a;
  --hero-paper: #ece8e1;
  --hero-ink: #101214;
  --hero-ink-soft: #3a4454;
  --hero-seal: #c23b2a;
  --hero-grain: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'320'%20height%3D'320'%3E%3Cfilter%20id%3D'a'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.85'%20numOctaves%3D'3'%20stitchTiles%3D'stitch'%2F%3E%3CfeColorMatrix%20values%3D'0%200%200%200%20.34%20%200%200%200%200%20.30%20%200%200%200%200%20.25%20%200%200%200%20.11%200'%2F%3E%3C%2Ffilter%3E%3Cfilter%20id%3D'b'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.006%20.18'%20numOctaves%3D'2'%20seed%3D'7'%20stitchTiles%3D'stitch'%2F%3E%3CfeColorMatrix%20values%3D'0%200%200%200%20.34%20%200%200%200%200%20.30%20%200%200%200%200%20.25%20%200%200%200%20.04%200'%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23a)'%2F%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23b)'%2F%3E%3C%2Fsvg%3E");

  position: relative;
  z-index: 2;
  // one screen: the scroll unrolls by itself on load (hero/lib/scene.ts). The screen's
  // height is taken once (App.vue), not the dynamic one: a phone's browser bar coming and
  // going would change it on every turn of the scroll and jolt the whole page below
  height: 100vh;
  height: var(--app-height, 100svh);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  // The site body sets its own line-height; the prototype's geometry is built on `normal`.
  line-height: normal;
  color: var(--hero-ink);
  background: var(--hero-desk);
  -webkit-font-smoothing: antialiased;

  &__defs {
    position: absolute;
  }

  &__stage {
    position: sticky;
    top: 0;
    height: 100vh;
    height: var(--app-height, 100svh);
    overflow: hidden;
  }

  // Without WebGL2 the scroll is flat CSS: rod, paper window and roller.
  // In 3D the canvas draws all of it and the paper is a clear overlay.
  // the paper: a window that grows downwards
  &__paper {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 1;
    height: var(--hero-h, 0);
    overflow: hidden;
  }

  // without WebGL the paper itself is the sheet, edge to edge like the 3D one
  &--flat &__paper {
    background-color: var(--hero-paper);
    background-image: var(--hero-grain);
  }

  &__sun {
    position: absolute;
    top: var(--hero-sun-y);
    left: var(--hero-sun-x);
    z-index: 1;
    width: calc(var(--hero-sun-r) * 2);
    aspect-ratio: 1;
    pointer-events: none;
    background: radial-gradient(
      circle,
      rgb(199 56 38 / 88%) 0 58%,
      rgb(199 56 38 / 70%) 66%,
      rgb(199 56 38 / 0%) 72%
    );
    border-radius: 50%;
    opacity: 0;
    transform: translate(-50%, -50%);
    transition: opacity 3s ease 0.6s;

    &--shown {
      opacity: 1;
    }
  }

  &__sheet {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: var(--hero-sheet-h, 100%);
  }

  // The global reset caps media at `max-width: 100%`; the painting is
  // deliberately wider than the sheet (cover), so the cap would squash it.
  &__canvas,
  &__art {
    position: absolute;
    display: block;
    max-width: none;
  }

  &__canvas {
    inset: 0;
    width: 100%;
    height: 100%;
  }

  // Until the scene takes over, the image is only a texture source.
  &__art {
    pointer-events: none;
    opacity: 0;

    &--fallback {
      mix-blend-mode: multiply;
      transition: opacity 3s ease;
    }

    &--shown {
      opacity: 1;
    }
  }

  /* the hero keeps its own margins rather than the page column: the name, the
     seal and the controls are placed on the full-screen painting, around the
     sun and the valley, not on the text column of the sections below */
  &__title {
    position: absolute;
    top: clamp(28px, 9vh, 110px);
    left: clamp(20px, 5.5vw, 96px);
    z-index: 2;
    max-width: min(86%, 760px);
  }

  // ink bleeding in: blurred and faint, then sharp
  &__name,
  &__role {
    filter: blur(14px);
    opacity: 0;
    // --hero-pace: halved when a try to scroll hurries the hero up
    transition:
      opacity calc(1.6s * var(--hero-pace, 1)) ease,
      filter calc(2.2s * var(--hero-pace, 1)) cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  &__name {
    margin: 0;
    font-family: Unbounded, 'Arial Black', system-ui, sans-serif;
    font-size: clamp(26px, 4.4vw, 66px);
    font-weight: 300;
    line-height: 1.04;
    letter-spacing: -0.02em;
    text-wrap: balance;

    &--shown {
      filter: blur(0);
      opacity: 1;
    }
  }

  // Block lines, not <br>: the two words stay separate in extracted text.
  &__name-line {
    display: block;
  }

  &__role {
    margin: clamp(14px, 2vh, 22px) 0 0;
    font-size: clamp(11px, 1.05vw, 14px);
    color: var(--hero-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;

    &--shown {
      filter: blur(0);
      opacity: 1;
    }
  }

  &__seal {
    position: absolute;
    right: clamp(20px, 5vw, 84px);
    bottom: clamp(64px, 11vh, 120px);
    z-index: 2;
    display: grid;
    place-items: center;
    width: clamp(46px, 4.6vw, 66px);
    aspect-ratio: 1;
    font-family: Unbounded, sans-serif;
    font-size: clamp(15px, 1.5vw, 22px);
    font-weight: 500;
    color: var(--hero-paper);
    letter-spacing: -0.04em;
    background: var(--hero-seal);
    filter: url('#hero-rough');
    border-radius: 4px;
    opacity: 0;
    mix-blend-mode: multiply;
    transform: rotate(-5deg) scale(1.5);

    &--shown {
      opacity: 0.92;
      transform: rotate(-5deg) scale(1);
      transition:
        opacity 0.12s linear,
        transform 0.28s cubic-bezier(0.2, 1.4, 0.4, 1);
    }
  }

  // the language switch, a link, in the scroll's top corner
  &__control {
    position: absolute;
    top: clamp(30px, 9.4vh, 114px);
    right: clamp(20px, 5vw, 84px);
    z-index: 2;
    padding: 4px 0;
    font-size: 12px;
    color: var(--hero-ink);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-bottom: 1px solid currentcolor;
    opacity: 0;
    transition: opacity 0.6s ease;
    pointer-events: none;

    &--shown {
      pointer-events: auto;
      opacity: 0.75;

      &:hover {
        opacity: 1;
      }
    }

    &:focus-visible {
      outline: 2px solid var(--hero-seal);
      outline-offset: 4px;
    }
  }

  &__drop {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    width: 13px;
    height: 19px;
    margin: -19px 0 0 -6.5px;
    pointer-events: none;
    background: radial-gradient(circle at 35% 70%, #3a3f48 0 8%, var(--hero-ink) 30%);
    border-radius: 50% 50% 50% 50% / 72% 72% 34% 34%;
    opacity: 0;
    transform-origin: 50% 0;

    &--sun {
      width: 9px;
      height: 13px;
      margin: -13px 0 0 -4.5px;
      background: radial-gradient(circle at 35% 70%, #e0604e 0 10%, var(--hero-seal) 34%);
    }
  }

  &__role-part {
    white-space: nowrap;
  }

  @media (width <= 700px) {
    &__role-sep {
      display: none;
    }

    &__role-part {
      display: block;
    }

    &__control {
      top: auto;
      right: auto;
      bottom: 52px;
      left: clamp(20px, 5.5vw, 96px);
    }

    &__seal {
      bottom: 40px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__name,
    &__role,
    &__seal--shown {
      transition: none;
    }
  }
}
</style>
