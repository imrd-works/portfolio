<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useInView } from '@/shared/composables/useInView'
import { stats } from '../../model/portfolio'

const { t } = useI18n()
// The whole spread comes in at once: the painting soaks into the paper, the
// text blooms, the counts are stamped.
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
      <!-- the painting is the ground the text lies on: the wolverine from the
           path and the man it walks with, soaked into the paper -->
      <img
        class="about__art"
        src="/about/portrait.webp"
        :alt="t('home.about.photo')"
        width="896"
        height="1344"
        loading="lazy"
        decoding="async"
      />
      <p class="about__badge">{{ t('home.about.badge') }}</p>

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
    grid-template-areas:
      'art body'
      'badge body';
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    gap: 18px clamp(24px, 4vw, 64px);
    align-items: start;
    max-width: 1320px;
    margin: 0 auto;
  }

  /* ---------- the painting, soaked into the paper ---------- */
  &__art {
    grid-area: art;
    align-self: start;
    width: 100%;
    max-width: none;
    height: auto;
    // the painting is ink on transparency, so it lies on the paper itself; the
    // mask only softens what little edge the sheet had
    mask-image: radial-gradient(125% 96% at 45% 48%, #000 62%, transparent 92%);
    filter: blur(6px);
    opacity: 0;
    transition:
      opacity 1.6s ease,
      filter 2s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  &--shown &__art {
    filter: blur(0);
    opacity: 1;
  }

  &__badge {
    grid-area: badge;
    margin: 0;
    font-size: 11px;
    color: var(--about-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0;
    transition: opacity 1s ease 0.6s;
  }

  &--shown &__badge {
    opacity: 1;
  }

  /* ---------- the text ---------- */
  &__body {
    grid-area: body;
    align-self: center;
  }

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
      grid-template-areas:
        'art'
        'badge'
        'body';
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto auto auto;
    }

    &__art {
      max-width: 420px;
      margin: 0 auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__art,
    &__badge,
    &__body > *,
    &__seal {
      transition: none;
    }
  }
}
</style>
