<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { INK_IMAGE } from './hero/config'
import type { Caption, InkScene } from './hero/lib/scene'

const { t } = useI18n()

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
const fogOn = ref(true)
const imageFallback = ref(false)
const artShown = ref(false)

let scene: InkScene | null = null
let unmounted = false

onMounted(async () => {
  // Kept out of the initial chunk's critical path: the scroll is rolled up on
  // load, so nothing needs the renderer before the first scroll.
  const { mountInkScene } = await import('./hero/lib/scene')
  if (unmounted) return
  fogOn.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
  unmounted = true
  scene?.destroy()
  scene = null
})

function replay() {
  scene?.replay()
}

function toggleFog() {
  fogOn.value = !fogOn.value
  scene?.setFog(fogOn.value)
}
</script>

<template>
  <header
    id="top"
    ref="root"
    class="hero"
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
      <!-- hint on the desk while the scroll is still rolled up -->
      <div
        class="hero__hint"
        aria-hidden="true"
      >
        {{ t('home.hero.hint') }}<i class="hero__hint-line"></i>
      </div>

      <div class="hero__rod"></div>
      <div
        ref="paper"
        class="hero__paper"
        data-ink-surface="paper"
      >
        <div
          ref="sheet"
          class="hero__sheet"
        >
          <canvas
            v-if="!imageFallback"
            ref="canvas"
            class="hero__canvas"
            aria-hidden="true"
          ></canvas>
          <!-- The WebGL texture source and the painting itself when WebGL is out. -->
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
              {{ t('home.hero.role') }}
            </p>
          </div>

          <div
            class="hero__seal"
            :class="{ 'hero__seal--shown': shown.seal }"
            aria-hidden="true"
          >
            {{ t('home.hero.seal') }}
          </div>
          <button
            class="hero__control"
            :class="{ 'hero__control--shown': shown.controls }"
            type="button"
            @click="replay"
          >
            {{ t('home.hero.replay') }}
          </button>
          <button
            class="hero__control hero__control--fog"
            :class="{ 'hero__control--shown': shown.controls }"
            type="button"
            :aria-pressed="fogOn"
            @click="toggleFog"
          >
            {{ fogOn ? t('home.hero.fog.on') : t('home.hero.fog.off') }}
          </button>
        </div>
      </div>
      <div class="hero__roller"></div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
/** @define hero */
.hero {
  // Tokens from the prototype. The site is dark-only, so the desk takes the
  // prototype's dark variant.
  --hero-desk: #14161a;
  --hero-desk-ink: #9a9da3;
  --hero-paper: #ece8e1;
  --hero-ink: #101214;
  --hero-ink-soft: #3a4454;
  --hero-seal: #c23b2a;
  --hero-wood-a: #3b2c24;
  --hero-wood-b: #17110e;
  --hero-m: clamp(12px, 3vw, 48px);
  --hero-top: 26px;
  --hero-grain: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'320'%20height%3D'320'%3E%3Cfilter%20id%3D'a'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.85'%20numOctaves%3D'3'%20stitchTiles%3D'stitch'%2F%3E%3CfeColorMatrix%20values%3D'0%200%200%200%20.34%20%200%200%200%200%20.30%20%200%200%200%200%20.25%20%200%200%200%20.11%200'%2F%3E%3C%2Ffilter%3E%3Cfilter%20id%3D'b'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.006%20.18'%20numOctaves%3D'2'%20seed%3D'7'%20stitchTiles%3D'stitch'%2F%3E%3CfeColorMatrix%20values%3D'0%200%200%200%20.34%20%200%200%200%200%20.30%20%200%200%200%200%20.25%20%200%200%200%20.04%200'%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23a)'%2F%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23b)'%2F%3E%3C%2Fsvg%3E");

  position: relative;
  z-index: 2;
  height: 300vh;
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
    height: 100dvh;
    overflow: hidden;
  }

  &__hint {
    position: absolute;
    top: 46%;
    right: 0;
    left: 0;
    font-size: 13px;
    color: var(--hero-desk-ink);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    pointer-events: none;
    opacity: calc(1 - var(--hero-u, 0) * 4);
  }

  &__hint-line {
    display: block;
    width: 1px;
    height: 44px;
    margin: 14px auto 0;
    background: currentcolor;
    transform-origin: top;
    animation: hero-drip 2.2s cubic-bezier(0.6, 0, 0.3, 1) infinite;
  }

  // top rod of the scroll
  &__rod {
    position: absolute;
    top: calc(var(--hero-top) - 14px);
    right: calc(var(--hero-m) - 8px);
    left: calc(var(--hero-m) - 8px);
    z-index: 3;
    height: 14px;
    background: linear-gradient(to bottom, var(--hero-wood-a), var(--hero-wood-b));
    border-radius: 2px;
    box-shadow: 0 6px 14px rgb(0 0 0 / 28%);
  }

  // the paper: a window that grows downwards
  &__paper {
    position: absolute;
    top: var(--hero-top);
    right: var(--hero-m);
    left: var(--hero-m);
    z-index: 1;
    height: var(--hero-h, 0);
    overflow: hidden;
    background-color: var(--hero-paper);
    background-image: var(--hero-grain);
    box-shadow: 0 18px 40px rgb(0 0 0 / 22%);

    // the sheet curls towards the roller
    &::after {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      height: 46px;
      pointer-events: none;
      content: '';
      background: linear-gradient(to bottom, rgb(0 0 0 / 0%), rgb(0 0 0 / 13%));
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

  &__roller {
    position: absolute;
    top: calc(var(--hero-top) + var(--hero-h, 0px) - var(--hero-d, 56px) * 0.42);
    right: calc(var(--hero-m) - 4px);
    left: calc(var(--hero-m) - 4px);
    z-index: 2;
    height: var(--hero-d, 56px);
    background-color: var(--hero-paper);
    background-image:
      linear-gradient(
        to bottom,
        rgb(0 0 0 / 42%) 0%,
        rgb(0 0 0 / 8%) 22%,
        rgb(255 255 255 / 55%) 40%,
        rgb(255 255 255 / 0%) 55%,
        rgb(0 0 0 / 22%) 80%,
        rgb(0 0 0 / 50%) 100%
      ),
      repeating-linear-gradient(to bottom, rgb(0 0 0 / 5%) 0 1px, rgb(0 0 0 / 0%) 1px 9px),
      var(--hero-grain);
    background-position:
      0 0,
      0 var(--hero-roll, 0),
      0 var(--hero-roll, 0);
    border-radius: 3px;
    box-shadow: 0 16px 22px -6px rgb(0 0 0 / 45%);

    &::before,
    &::after {
      position: absolute;
      top: -3px;
      bottom: -3px;
      width: 18px;
      content: '';
      background: linear-gradient(
        to bottom,
        var(--hero-wood-b),
        var(--hero-wood-a) 38%,
        #5a4336 46%,
        var(--hero-wood-a) 58%,
        var(--hero-wood-b)
      );
      border-radius: 4px;
    }

    &::before {
      left: -16px;
    }

    &::after {
      right: -16px;
    }
  }

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
    transition:
      opacity 1.6s ease,
      filter 2.2s cubic-bezier(0.2, 0.7, 0.2, 1);
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

  &__control {
    position: absolute;
    top: clamp(30px, 9.4vh, 114px);
    right: clamp(20px, 5vw, 84px);
    z-index: 2;
    padding: 4px 0;
    font: inherit;
    font-size: 12px;
    color: var(--hero-ink);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    background: none;
    border: 0;
    border-bottom: 1px solid currentcolor;
    opacity: 0;
    transition: opacity 0.6s ease;
    pointer-events: none;

    &--fog {
      top: calc(clamp(30px, 9.4vh, 114px) + 30px);
    }

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

  @media (width <= 700px) {
    &__control {
      top: auto;
      right: auto;
      bottom: 52px;
      left: clamp(20px, 5.5vw, 96px);

      &--fog {
        top: auto;
        bottom: 28px;
      }
    }

    &__seal {
      bottom: 40px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__hint-line {
      transform: none;
      animation: none;
    }

    &__name,
    &__role,
    &__seal--shown {
      transition: none;
    }
  }
}

@keyframes hero-drip {
  0% {
    opacity: 1;
    transform: scaleY(0);
  }

  70% {
    opacity: 1;
    transform: scaleY(1);
  }

  100% {
    opacity: 0;
    transform: scaleY(1);
  }
}
</style>
