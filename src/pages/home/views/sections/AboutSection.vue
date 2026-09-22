<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useInView } from '@/shared/composables/useInView'
import { stats } from '../../model/portfolio'

const { t } = useI18n()
// The whole spread comes in at once: the sheet unrolls, the text blooms, the
// counts are stamped.
const { targetRef: spread, inView: shown } = useInView({ threshold: 0.12 })
</script>

<template>
  <section
    id="about"
    :ref="spread"
    class="about"
    :class="{ 'about--shown': shown }"
    data-ink-surface="paper"
  >
    <svg
      class="about__defs"
      width="0"
      height="0"
      aria-hidden="true"
    >
      <filter
        id="about-rough"
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
    </svg>

    <div class="about__spread">
      <!-- the portrait: the wolverine from the path, and the man it walks with -->
      <div class="about__portrait">
        <span
          class="about__nail"
          aria-hidden="true"
          >{{ t('home.hero.seal') }}</span
        >
        <div class="about__frame">
          <img
            class="about__art"
            src="/about/portrait.webp"
            :alt="t('home.about.photo')"
            width="896"
            height="1344"
            loading="lazy"
            decoding="async"
          />
        </div>
        <span
          class="about__curl"
          aria-hidden="true"
        ></span>
        <p class="about__badge">{{ t('home.about.badge') }}</p>
      </div>

      <div class="about__body">
        <p class="about__eyebrow">{{ t('home.about.eyebrow') }}</p>
        <h2 class="about__title">
          <i18n-t
            keypath="home.about.title"
            tag="span"
          >
            <template #accent>
              <em class="about__accent">{{ t('home.about.titleAccent') }}</em>
            </template>
          </i18n-t>
        </h2>
        <p class="about__text">{{ t('home.about.p1') }}</p>
        <p class="about__text">{{ t('home.about.p2') }}</p>
        <p class="about__text">{{ t('home.about.p3') }}</p>

        <div class="about__stats">
          <div
            v-for="stat in stats"
            :key="stat.id"
            class="about__stat"
          >
            <span class="about__seal">{{ stat.value }}{{ stat.suffix }}</span>
            <span class="about__stat-label">{{ t(`home.about.stats.${stat.id}`) }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
/** @define about */
.about {
  // the same paper as the hero, the river and the work wall
  --about-paper: #ece8e1;
  --about-sheet: #f4f1ec;
  --about-ink: #101214;
  --about-ink-soft: #3a4454;
  --about-text: #2a2f36;
  --about-seal: #c23b2a;

  position: relative;
  padding: 120px clamp(20px, 6vw, 96px);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: normal;
  color: var(--about-ink);
  background-color: var(--about-paper);
  -webkit-font-smoothing: antialiased;

  &__defs {
    position: absolute;
  }

  &__spread {
    display: grid;
    grid-template-columns: minmax(260px, 420px) minmax(0, 1fr);
    gap: clamp(32px, 6vw, 96px);
    align-items: start;
    max-width: 1320px;
    margin: 0 auto;
  }

  /* ---------- the portrait, pinned and rolled ---------- */
  &__portrait {
    position: relative;
    padding-top: 12px;
    transform: rotate(-1.2deg);
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
    color: var(--about-paper);
    letter-spacing: -0.04em;
    background: var(--about-seal);
    filter: url('#about-rough');
    border-radius: 50%;
    box-shadow: 0 3px 4px rgb(0 0 0 / 28%);
  }

  &__frame {
    position: relative;
    padding: 12px;
    overflow: hidden;
    background: var(--about-sheet);
    box-shadow:
      0 12px 24px -10px rgb(0 0 0 / 30%),
      0 1px 2px rgb(0 0 0 / 8%);
    clip-path: inset(0 0 100% 0);
    transition: clip-path 1.2s cubic-bezier(0.3, 0.7, 0.2, 1);
  }

  &--shown &__frame {
    clip-path: inset(0 0 0 0);
  }

  &__art {
    display: block;
    width: 100%;
    max-width: none;
    height: auto;
    mix-blend-mode: multiply;
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
      top 1.2s cubic-bezier(0.3, 0.7, 0.2, 1),
      opacity 0.25s ease 1.15s;
  }

  &--shown &__curl {
    top: 100%;
    opacity: 0;
  }

  &__badge {
    margin: 18px 0 0;
    font-size: 11px;
    color: var(--about-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* ---------- the text ---------- */
  &__body > * {
    filter: blur(10px);
    opacity: 0;
    transition:
      opacity 1s ease,
      filter 1.4s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  &--shown &__body > * {
    filter: blur(0);
    opacity: 1;
  }

  @for $i from 2 through 6 {
    &--shown &__body > :nth-child(#{$i}) {
      transition-delay: ($i - 1) * 0.1s;
    }
  }

  &__eyebrow {
    margin: 0;
    font-size: 12px;
    color: var(--about-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  &__title {
    max-width: 18ch;
    margin: 12px 0 0;
    font-family: Unbounded, 'Arial Black', system-ui, sans-serif;
    font-size: clamp(28px, 3.6vw, 54px);
    font-weight: 300;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  &__accent {
    font-style: normal;
    color: var(--about-seal);
  }

  &__text {
    max-width: 62ch;
    margin: 22px 0 0;
    font-size: 13.5px;
    line-height: 1.75;
    color: var(--about-text);
  }

  /* ---------- the counts, stamped in cinnabar ---------- */
  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 28px;
    margin-top: 40px;
  }

  &__stat {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__seal {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    font-family: Unbounded, sans-serif;
    font-size: 18px;
    font-weight: 500;
    color: var(--about-paper);
    letter-spacing: -0.04em;
    background: var(--about-seal);
    filter: url('#about-rough');
    border-radius: 50%;
    opacity: 0;
    transform: scale(1.5) rotate(-6deg);
  }

  &--shown &__seal {
    opacity: 0.94;
    transform: scale(1) rotate(-6deg);
    transition:
      opacity 0.12s linear,
      transform 0.3s cubic-bezier(0.2, 1.4, 0.4, 1);
  }

  &--shown &__stat:nth-child(2) &__seal {
    transition-delay: 0.12s;
  }

  &--shown &__stat:nth-child(3) &__seal {
    transition-delay: 0.24s;
  }

  &__stat-label {
    max-width: 14ch;
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--about-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  @media (width < 860px) {
    &__spread {
      grid-template-columns: minmax(0, 1fr);
    }

    &__portrait {
      max-width: 320px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__frame,
    &__curl,
    &__body > *,
    &__seal {
      transition: none;
    }
  }
}
</style>
