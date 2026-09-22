<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInView } from '@/shared/composables/useInView'
import {
  coreSkills,
  frontendChips,
  dataChips,
  platformChips,
  toolsChips,
} from '../../model/portfolio'

const { t } = useI18n()
const { targetRef: shelf, inView: shown } = useInView({ threshold: 0.1 })

// The brands are grouped the way a client thinks about work, not by kind of
// technology, so "we need heavy tables and charts" lands in one place.
const groups = computed(() => [
  { id: 'frontend', title: t('home.skills.frontendTitle'), chips: frontendChips },
  { id: 'data', title: t('home.skills.dataTitle'), chips: dataChips },
  { id: 'platform', title: t('home.skills.platformTitle'), chips: platformChips },
  { id: 'tools', title: t('home.skills.toolsTitle'), chips: toolsChips },
])

// Everything stays on the shelf; the search only dims what does not match, so
// a client looking for one technology finds it without losing the rest.
const query = ref('')
const matches = (chip: string) =>
  !query.value.trim() || chip.toLowerCase().includes(query.value.trim().toLowerCase())
const found = computed(() => groups.value.flatMap(({ chips }) => chips).filter(matches).length)
</script>

<template>
  <section
    id="skills"
    :ref="shelf"
    class="skills"
    :class="{ 'skills--shown': shown }"
    data-ink-surface="paper"
  >
    <svg
      class="skills__defs"
      width="0"
      height="0"
      aria-hidden="true"
    >
      <filter
        id="skills-rough"
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

    <div class="skills__inner">
      <p class="skills__eyebrow">{{ t('home.skills.eyebrow') }}</p>
      <h2 class="skills__title">{{ t('home.skills.title') }}</h2>

      <!-- the five brushes: what I work with every day -->
      <ul class="skills__cores">
        <li
          v-for="skill in coreSkills"
          :key="skill.id"
          class="skills__core"
        >
          <span
            class="skills__brush"
            aria-hidden="true"
          ></span>
          <span class="skills__core-name">{{ skill.label }}</span>
          <span class="skills__core-note">{{ t(`home.skills.core.${skill.id}`) }}</span>
        </li>
      </ul>

      <div class="skills__shelf">
        <label
          class="skills__search"
          for="skills-search"
        >
          <span class="skills__search-label">{{ t('home.skills.searchLabel') }}</span>
          <input
            id="skills-search"
            v-model="query"
            class="skills__search-input"
            type="search"
            :placeholder="t('home.skills.searchHint')"
          />
        </label>
        <p
          v-if="query.trim()"
          class="skills__found"
          role="status"
        >
          {{ t('home.skills.found', { n: found }) }}
        </p>

        <div
          v-for="group in groups"
          :key="group.id"
          class="skills__group"
        >
          <h3 class="skills__group-title">{{ group.title }}</h3>
          <div class="skills__chips">
            <span
              v-for="chip in group.chips"
              :key="chip"
              class="skills__chip"
              :class="{ 'skills__chip--dim': !matches(chip) }"
              >{{ chip }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
/** @define skills */
.skills {
  --skills-paper: #ece8e1;
  --skills-ink: #101214;
  --skills-ink-soft: #3a4454;
  --skills-text: #2a2f36;
  --skills-seal: #c23b2a;

  position: relative;
  padding: 0 clamp(20px, 6vw, 96px) 140px;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: normal;
  color: var(--skills-ink);
  background-color: var(--skills-paper);
  -webkit-font-smoothing: antialiased;

  &__defs {
    position: absolute;
  }

  &__inner {
    max-width: 1320px;
    margin: 0 auto;
  }

  &__eyebrow {
    margin: 0;
    font-size: 12px;
    color: var(--skills-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  &__title {
    max-width: 38ch;
    margin: 12px 0 44px;
    font-family: Unbounded, 'Arial Black', system-ui, sans-serif;
    font-size: clamp(22px, 2.6vw, 34px);
    font-weight: 300;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }

  /* ---------- the five brushes ---------- */
  &__cores {
    padding: 0;
    margin: 0 0 64px;
    list-style: none;
    border-top: 1px solid rgb(16 18 20 / 15%);
  }

  &__core {
    display: grid;
    grid-template-columns: 26px minmax(160px, 260px) minmax(0, 1fr);
    gap: 18px;
    align-items: baseline;
    padding: 16px 0;
    border-bottom: 1px solid rgb(16 18 20 / 15%);
    opacity: 0;
    transform: translateY(6px);
    transition:
      opacity 0.7s ease,
      transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  &--shown &__core {
    opacity: 1;
    transform: none;
  }

  @for $i from 1 through 5 {
    &--shown &__core:nth-child(#{$i}) {
      transition-delay: ($i - 1) * 0.08s;
    }
  }

  // a brush laid on the line: ferrule and hair, thicker for the first ones
  &__brush {
    position: relative;
    display: block;
    width: 22px;
    height: 10px;
    background: linear-gradient(to right, #6a4a33 0 40%, #3b2c24 40% 52%, transparent 52%);
    border-radius: 2px;

    &::after {
      position: absolute;
      top: 1px;
      right: 0;
      width: 48%;
      height: 8px;
      content: '';
      background: linear-gradient(to right, rgb(16 18 20 / 85%), rgb(16 18 20 / 35%));
      clip-path: polygon(0 0, 100% 42%, 100% 58%, 0 100%);
    }
  }

  &__core:nth-child(2) &__brush,
  &__core:nth-child(3) &__brush {
    transform: scale(0.92);
  }

  &__core:nth-child(4) &__brush,
  &__core:nth-child(5) &__brush {
    transform: scale(0.84);
  }

  &__core-name {
    font-family: Unbounded, sans-serif;
    font-size: 15px;
    font-weight: 300;
  }

  &__core-note {
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--skills-text);
  }

  /* ---------- the shelf of brands ---------- */
  &__search {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: baseline;
    margin-bottom: 8px;
  }

  &__search-label {
    font-size: 11px;
    color: var(--skills-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  // the field is a brush stroke: a line of ink, nothing else
  &__search-input {
    flex: 1 1 220px;
    max-width: 320px;
    padding: 4px 2px;
    font: inherit;
    font-size: 13px;
    color: var(--skills-ink);
    background: none;
    border: 0;
    border-bottom: 1.5px solid rgb(16 18 20 / 45%);

    &::placeholder {
      color: rgb(16 18 20 / 35%);
    }

    &:focus {
      outline: none;
      border-bottom-color: var(--skills-seal);
    }
  }

  &__found {
    margin: 0 0 22px;
    font-size: 11.5px;
    color: var(--skills-seal);
    letter-spacing: 0.06em;
  }

  &__group {
    margin-top: 26px;
  }

  &__group-title {
    margin: 0 0 12px;
    font-size: 11px;
    color: var(--skills-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  // every technology is a small ink brand; the search only dries the rest out
  &__chip {
    position: relative;
    z-index: 0;
    padding: 6px 10px 5px;
    font-size: 11.5px;
    color: var(--skills-ink);
    opacity: 0;
    transition:
      opacity 0.45s ease,
      color 0.35s ease;

    &::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      content: '';
      border: 1.5px solid currentcolor;
      border-radius: 3px;
      filter: url('#skills-rough');
    }

    &--dim {
      color: rgb(16 18 20 / 28%);
    }
  }

  &--shown &__chip {
    opacity: 1;
  }

  @media (width < 700px) {
    &__core {
      grid-template-columns: 26px minmax(0, 1fr);
      gap: 10px 14px;
    }

    &__core-note {
      grid-column: 2;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__core,
    &__chip {
      transition: none;
    }
  }
}
</style>
