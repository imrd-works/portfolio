<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { PageSection, Motion, Text } from '@/shared/ui'
import { timeline, services } from '../../model/portfolio'
import SectionEyebrow from './SectionEyebrow.vue'
import { RIVER_STEPS } from './path/config'
import type { RiverScene } from './path/lib/scene'

const { t } = useI18n()

// The river runs from the source to the lake: oldest step first.
const steps = [...timeline]
  .reverse()
  .map((entry, i) => ({ ...entry, side: RIVER_STEPS[i]?.side ?? 'left' }))

const river = useTemplateRef<HTMLElement>('river')
const view = useTemplateRef<HTMLElement>('view')
const gl = useTemplateRef<HTMLCanvasElement>('gl')
const marks = useTemplateRef<HTMLCanvasElement>('marks')
const stepEls = useTemplateRef<HTMLElement[]>('stepEls')
const seal = useTemplateRef<HTMLElement>('seal')

// Client-only. The prerendered HTML is a plain list of the steps; once the
// river is up it takes over the layout and reveals them as the ink arrives.
const live = ref(false)
const reached = reactive<boolean[]>(steps.map(() => false))
const sealed = ref(false)
const current = ref(-1)

let scene: RiverScene | null = null
let unmounted = false

onMounted(async () => {
  // Kept out of the initial chunk: the river is far below the first screen.
  const { mountRiver } = await import('./path/lib/scene')
  if (unmounted) return
  scene = mountRiver(
    {
      root: river.value!,
      view: view.value!,
      gl: gl.value!,
      marks: marks.value!,
      steps: stepEls.value ?? [],
      seal: seal.value!,
    },
    {
      live: (on) => (live.value = on),
      reach: (i) => (reached[i] = true),
      seal: () => (sealed.value = true),
      current: (i) => (current.value = i),
    }
  )
})

onBeforeUnmount(() => {
  unmounted = true
  scene?.destroy()
  scene = null
})
</script>

<template>
  <div class="exp">
    <section
      id="path"
      class="exp__path"
      :class="{ 'exp__path--live': live }"
      data-ink-surface="paper"
    >
      <div
        ref="river"
        class="exp__river"
      >
        <div
          ref="view"
          class="exp__view"
          aria-hidden="true"
        >
          <canvas
            ref="gl"
            class="exp__canvas"
          ></canvas>
          <canvas
            ref="marks"
            class="exp__canvas"
          ></canvas>
          <!-- phones: the current step as a caption over the river -->
          <div
            v-if="live && current >= 0"
            class="exp__caption"
          >
            <div class="exp__num">{{ String(current + 1).padStart(2, '0') }}</div>
            <div class="exp__period">
              {{ t(`home.experience.items.${steps[current].id}.period`) }}
            </div>
            <div class="exp__role">
              {{ t(`home.experience.items.${steps[current].id}.role`) }}
            </div>
            <p class="exp__desc">
              {{ t(`home.experience.items.${steps[current].id}.desc`) }}
            </p>
          </div>
        </div>

        <header class="exp__head">
          <div class="exp__eyebrow">{{ t('home.experience.eyebrow') }}</div>
          <h2 class="exp__title">{{ t('home.experience.title') }}</h2>
        </header>

        <ol class="exp__steps">
          <li
            v-for="(entry, i) in steps"
            :key="entry.id"
            ref="stepEls"
            class="exp__step"
            :class="[`exp__step--${entry.side}`, { 'exp__step--shown': reached[i] }]"
          >
            <div class="exp__num">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="exp__period">{{ t(`home.experience.items.${entry.id}.period`) }}</div>
            <h3 class="exp__role">{{ t(`home.experience.items.${entry.id}.role`) }}</h3>
            <p class="exp__desc">{{ t(`home.experience.items.${entry.id}.desc`) }}</p>
          </li>
        </ol>

        <div
          ref="seal"
          class="exp__seal"
          :class="{ 'exp__seal--shown': sealed }"
          aria-hidden="true"
        >
          {{ t('home.hero.seal') }}
        </div>
      </div>
    </section>

    <PageSection
      relative
      padding-top="band"
      padding-bottom="band"
    >
      <div>
        <Motion
          preset="fade-up"
          trigger="visible"
          tag="div"
          class="exp__head exp__head--services"
        >
          <SectionEyebrow
            num="05"
            :label="t('home.services.eyebrow')"
          />
          <Text
            tag="h2"
            variant="display-s"
            class="exp__title"
          >
            {{ t('home.services.title') }}
          </Text>
        </Motion>

        <Motion
          preset="fade-up"
          trigger="visible"
          target="children"
          :stagger="60"
          tag="div"
          class="exp__services"
        >
          <div
            v-for="id in services"
            :key="id"
            class="exp__service"
          >
            <div class="exp__service-head">
              <span class="exp__service-mark">↳</span>
              <Text
                tag="h4"
                variant="heading-m"
                class="exp__service-title"
              >
                {{ t(`home.services.items.${id}.title`) }}
              </Text>
            </div>
            <Text
              tag="p"
              variant="body-s"
              tone="tertiary"
              class="exp__service-desc"
            >
              {{ t(`home.services.items.${id}.desc`) }}
            </Text>
          </div>
        </Motion>
      </div>
    </PageSection>
  </div>
</template>

<style lang="scss" scoped>
/** @define exp */
@use 'assets/styles/mixins' as *;

.exp__path {
  // The river continues the hero's paper: the unrolled sheet ends in exactly this colour.
  --exp-paper: #ece8e1;
  --exp-ink: #101214;
  --exp-ink-soft: #3a4454;
  --exp-seal: #c23b2a;

  position: relative;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: normal;
  color: var(--exp-ink);
  background-color: var(--exp-paper);
  -webkit-font-smoothing: antialiased;
}

.exp__river {
  position: relative;
  padding: 140px clamp(20px, 6vw, 96px) 120px;
}

// the canvases stay on screen while the river scrolls past (once it is live)
.exp__view {
  display: none;
}

.exp__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.exp__head {
  margin-bottom: 56px;
}

.exp__eyebrow {
  font-size: 12px;
  color: var(--exp-ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.exp__title {
  margin: 10px 0 0;
  font-family: Unbounded, 'Arial Black', system-ui, sans-serif;
  font-size: clamp(34px, 5vw, 72px);
  font-weight: 300;
  letter-spacing: -0.02em;
}

.exp__steps {
  display: grid;
  gap: 48px;
  max-width: 560px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.exp__num {
  font-size: 11px;
  color: var(--exp-seal);
  letter-spacing: 0.16em;
}

.exp__period {
  margin-top: 8px;
  font-size: 11.5px;
  color: var(--exp-ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.exp__role {
  margin: 8px 0 0;
  font-family: Unbounded, 'Arial Black', system-ui, sans-serif;
  font-size: clamp(17px, 1.6vw, 24px);
  font-weight: 300;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.exp__desc {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.62;
  color: #2a2f36;
}

.exp__seal {
  display: none;
}

.exp__caption {
  position: absolute;
  right: 16px;
  bottom: 18px;
  left: 16px;
  display: none;
  padding: 16px 16px 14px;
  background: rgb(236 232 225 / 90%);
  border-top: 1px solid rgb(16 18 20 / 15%);
  backdrop-filter: blur(6px);

  .exp__desc {
    font-size: 12.5px;
  }
}

/* ---------- the river is up ---------- */
.exp__path--live {
  .exp__river {
    padding: 0;
  }

  // desktop: a band of canvas that scrolls with the text (moved by the scene)
  .exp__view {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 0;
    display: block;
    pointer-events: none;
  }

  .exp__head {
    position: absolute;
    top: 70px;
    left: clamp(20px, 6vw, 96px);
    z-index: 1;
    margin: 0;
  }

  .exp__steps {
    display: block;
    max-width: none;
  }

  .exp__step {
    position: absolute;
    z-index: 1;
    transform: translateY(-50%);

    > * {
      filter: blur(12px);
      opacity: 0;
      transition:
        opacity 1.2s ease,
        filter 1.8s cubic-bezier(0.2, 0.7, 0.2, 1);
    }

    &--left {
      text-align: right;
    }

    &--shown > * {
      filter: blur(0);
      opacity: 1;
    }

    &--shown > :nth-child(2) {
      transition-delay: 0.15s;
    }

    &--shown > :nth-child(3) {
      transition-delay: 0.3s;
    }

    &--shown > :nth-child(4) {
      transition-delay: 0.45s;
    }
  }

  .exp__seal {
    position: absolute;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 60px;
    aspect-ratio: 1;
    margin: -30px 0 0 -30px;
    font-family: Unbounded, sans-serif;
    font-size: 20px;
    font-weight: 500;
    color: var(--exp-paper);
    letter-spacing: -0.04em;
    background: var(--exp-seal);
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

  @include bp-down(md) {
    // phones: the painting drifts under a fixed screen, with the caption on it
    .exp__view {
      position: sticky;
      height: 100vh;
      margin-bottom: -100vh;
    }

    .exp__step {
      display: none;
    }

    .exp__caption {
      display: block;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .exp__path--live .exp__step > * {
    transition: none;
  }
}

.exp__head--services {
  margin-bottom: 40px;
}

.exp__services {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 14px;

  @include bp-down(sm) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.exp__service {
  padding: 24px;
  background: var(--color-bg-surface-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: 20px;
  transition:
    border-color 0.4s,
    background 0.4s;

  &:hover {
    background: rgb(167 139 250 / 6%);
    border-color: rgb(167 139 250 / 45%);
  }
}

.exp__service-head {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 10px;
}

.exp__service-mark {
  font-family: var(--font-family-display);
  font-size: 15px;
  color: var(--color-accent);
}

.exp__service-title {
  margin: 0;
}

.exp__service-desc {
  margin: 0;
}
</style>
