<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInView } from '@/shared/composables/useInView'
import {
  allChips,
  coreSkills,
  rowsFor,
  stackCount,
  stackGroups,
  strongChips,
  type StackId,
} from '../../model/portfolio'

const { t } = useI18n()
const { targetRef: shelf, inView: shown } = useInView({ threshold: 0.1 })

// Two levels: the direction a client hires for, and the job each tool does
// inside it. Nothing is hidden, but a row of six names reads where a wall of
// thirty does not.
const tab = ref<StackId>('frontend')
const query = ref('')
const searching = computed(() => query.value.trim().length > 0)
const matches = (chip: string) => chip.toLowerCase().includes(query.value.trim().toLowerCase())
const strong = (chip: string) => strongChips.includes(chip)
// marked with a dot: one home on the shelf, but it works in other directions too,
// and the mark says which ones instead of listing the tool twice
// Frontend, backend and devops keep what is theirs alone; everything that
// spans directions is gathered under fullstack, so each tool is listed once.
const rowsOf = (group: (typeof stackGroups)[number]) => rowsFor(group.id)

// While searching the tabs step aside: the results come from all four
// directions, so one technology is found without knowing where it was filed.
const shelfGroups = computed(() =>
  (searching.value ? stackGroups : stackGroups.filter(({ id }) => id === tab.value))
    .map((group) => ({
      ...group,
      rows: rowsOf(group)
        .map((row) => ({ ...row, chips: searching.value ? row.chips.filter(matches) : row.chips }))
        .filter(({ chips }) => chips.length),
    }))
    .filter(({ rows }) => rows.length)
)
const found = computed(() => allChips.filter(matches).length)
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
        <div class="skills__bar">
          <div
            class="skills__tabs"
            role="tablist"
            :aria-label="t('home.skills.eyebrow')"
          >
            <button
              v-for="group in stackGroups"
              :id="`skills-tab-${group.id}`"
              :key="group.id"
              class="skills__tab"
              :class="{ 'skills__tab--on': !searching && tab === group.id }"
              role="tab"
              type="button"
              :aria-selected="!searching && tab === group.id"
              @click="((tab = group.id), (query = ''))"
            >
              {{ t(`home.skills.tabs.${group.id}`) }}
              <span class="skills__tab-count">{{ stackCount(group.id) }}</span>
            </button>
          </div>

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
        </div>

        <p
          v-if="searching"
          class="skills__found"
          role="status"
        >
          {{ t('home.skills.found', { n: found }) }} · {{ t('home.skills.searchAll') }}
        </p>

        <div
          v-for="group in shelfGroups"
          :key="group.id"
          class="skills__group"
        >
          <h3
            v-if="searching"
            class="skills__group-title"
          >
            {{ t(`home.skills.tabs.${group.id}`) }}
          </h3>
          <div
            v-for="row in group.rows"
            :key="row.id"
            class="skills__row"
          >
            <h4 class="skills__row-title">{{ t(`home.skills.rows.${row.id}`) }}</h4>
            <div class="skills__chips">
              <span
                v-for="chip in row.chips"
                :key="chip"
                class="skills__chip"
                :class="{ 'skills__chip--strong': strong(chip) }"
                >{{ chip }}</span
              >
            </div>
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
  padding: 0 var(--page-pad) 140px;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: normal;
  color: var(--skills-ink);
  background-color: var(--skills-paper);
  -webkit-font-smoothing: antialiased;

  &__defs {
    position: absolute;
  }

  &__eyebrow {
    margin: 0;
    font-size: var(--type-eyebrow-size);
    color: var(--skills-ink-soft);
    text-transform: uppercase;
    letter-spacing: var(--type-eyebrow-tracking);
  }

  &__title {
    max-width: 38ch;
    margin: 12px 0 44px;
    font-family: var(--type-display);
    font-size: var(--type-title-size);
    font-weight: var(--type-title-weight);
    line-height: var(--type-title-leading);
    letter-spacing: var(--type-title-tracking);
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
  &__bar {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 28px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  // the direction is chosen with a seal, like the filters on the work wall
  &__tab {
    position: relative;
    z-index: 0;
    padding: 8px 12px 7px;
    font: inherit;
    font-size: 11.5px;
    color: var(--skills-seal);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    background: none;
    border: 0;
    transition:
      color 0.25s,
      transform 0.25s cubic-bezier(0.2, 1.4, 0.4, 1);

    &::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      content: '';
      border: 1.5px solid currentcolor;
      border-radius: 3px;
      opacity: 0.6;
      filter: url('#skills-rough');
      transition: opacity 0.25s;
    }

    &:hover::before {
      opacity: 1;
    }

    &--on {
      color: var(--skills-paper);
      transform: rotate(-2deg);

      &::before {
        background: var(--skills-seal);
        opacity: 1;
      }
    }

    &:focus-visible {
      outline: 2px solid var(--skills-seal);
      outline-offset: 4px;
    }
  }

  &__search {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: baseline;
  }

  &__search-label {
    font-size: 11px;
    color: var(--skills-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  // the field is a brush stroke: a line of ink, nothing else
  &__search-input {
    flex: 1 1 200px;
    max-width: 280px;
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
      box-shadow: 0 1.5px 0 var(--skills-seal);
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

  // one line per job a tool does: the label on the left, the brands beside it
  &__row {
    display: grid;
    grid-template-columns: minmax(120px, 190px) minmax(0, 1fr);
    gap: 10px 20px;
    align-items: baseline;
    padding: 12px 0;

    & + & {
      border-top: 1px solid rgb(16 18 20 / 10%);
    }
  }

  &__row-title {
    margin: 0;
    font-size: 11px;
    color: var(--skills-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__tab-count {
    margin-left: 6px;
    font-size: 10px;
    opacity: 0.75;
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
    transition: opacity 0.45s ease;

    &::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      content: '';
      border: 1.5px solid currentcolor;
      border-radius: 3px;
      filter: url('#skills-rough');
    }

    // worked with day to day: inked solid, so the weight of the stack shows
    &--strong {
      color: var(--skills-paper);

      &::before {
        background: var(--skills-ink);
        border-color: var(--skills-ink);
      }
    }
  }

  &--shown &__chip {
    opacity: 1;
  }

  @media (width < 700px) {
    &__row {
      grid-template-columns: minmax(0, 1fr);
      gap: 6px;
    }

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
