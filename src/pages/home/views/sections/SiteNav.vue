<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { LocaleSwitch } from '@/shared/ui'

const { t } = useI18n()

// the sections in the order the page tells them, each a link to its anchor
const LINKS = ['path', 'work', 'about', 'skills'] as const
type SectionId = (typeof LINKS)[number] | 'contact'

// The bar stays out of the way: not over the hero (its title and the rod of
// the scroll are there), gone while the page is read downwards, and back as
// soon as the reader scrolls up a little — the moment they are looking for
// something.
const shown = ref(false)
const open = ref(false)
const menuButton = useTemplateRef<HTMLButtonElement>('menuButton')
const current = ref<SectionId | null>(null)

const UP = 12 // px up before it comes back: a nudge, not a twitch
const DOWN = 4
let lastY = 0
let upBy = 0
let frame = 0

/** Until most of the hero has scrolled away, the bar stays off it. */
function heroBottom() {
  const hero = document.getElementById('top')
  return hero ? hero.offsetTop + hero.offsetHeight * 0.6 : innerHeight
}

const SECTIONS: SectionId[] = [...LINKS, 'contact']

/**
 * Which section is being read: the one across the middle of the screen, or none
 * (the hero). Measured on every frame the page scrolls rather than left to an
 * IntersectionObserver on a zero-height line, which browsers (Safari above all)
 * report unreliably when a jump flies past several sections at once: the mark
 * then stayed on the section the jump started from.
 */
function spy() {
  const middle = innerHeight / 2
  current.value =
    SECTIONS.find((id) => {
      const box = document.getElementById(id)?.getBoundingClientRect()
      return box && box.top <= middle && box.bottom > middle
    }) ?? null
}

function onScroll() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    spy()
    const y = scrollY
    const dy = y - lastY
    lastY = y
    if (y < heroBottom()) {
      shown.value = false
      open.value = false
      upBy = 0
      return
    }
    if (dy > DOWN) {
      shown.value = false
      open.value = false
      upBy = 0
    } else if (dy < 0) {
      upBy -= dy
      if (upBy > UP) shown.value = true
    }
  })
}

// Escape closes the menu and gives the focus back to its button
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !open.value) return
  open.value = false
  menuButton.value?.focus()
}

onMounted(() => {
  addEventListener('keydown', onKey)
  lastY = scrollY
  spy()
  addEventListener('scroll', onScroll, { passive: true })
  // the window resized: the sections moved under the middle of the screen
  addEventListener('resize', onScroll)
})

onBeforeUnmount(() => {
  removeEventListener('keydown', onKey)
  removeEventListener('scroll', onScroll)
  removeEventListener('resize', onScroll)
  cancelAnimationFrame(frame)
})

// a link was followed: the page travels to the section without writing its
// anchor into the address (a reload would otherwise land there), and the bar
// steps aside
function go(event: MouseEvent) {
  open.value = false
  const id = (event.currentTarget as HTMLAnchorElement).hash.slice(1)
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  target.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <header
    class="site-nav"
    :class="{ 'site-nav--shown': shown, 'site-nav--open': open }"
  >
    <nav
      class="site-nav__bar"
      :aria-label="t('home.nav.label')"
    >
      <a
        class="site-nav__brand"
        href="#top"
        @click="go"
      >
        <span
          class="site-nav__mark"
          aria-hidden="true"
          >{{ t('home.hero.seal') }}</span
        >
        <span class="site-nav__name"
          >{{ t('home.hero.firstName') }} {{ t('home.hero.lastName') }}</span
        >
      </a>

      <div
        id="site-nav-links"
        class="site-nav__links"
      >
        <a
          v-for="id in LINKS"
          :key="id"
          class="site-nav__link"
          :class="{ 'site-nav__link--current': current === id }"
          :href="`#${id}`"
          :aria-current="current === id ? 'location' : undefined"
          @click="go"
          >{{ t(`home.nav.${id}`) }}</a
        >
      </div>

      <LocaleSwitch class="site-nav__lang" />

      <a
        class="site-nav__write"
        :class="{ 'site-nav__write--current': current === 'contact' }"
        href="#contact"
        @click="go"
        >{{ t('home.nav.contact') }}</a
      >

      <!-- an icon, not a word: "Menu" and "Close" differ in width and moved the bar -->
      <button
        ref="menuButton"
        class="site-nav__menu"
        type="button"
        :aria-expanded="open"
        aria-controls="site-nav-links"
        :aria-label="open ? t('home.nav.close') : t('home.nav.menu')"
        @click="open = !open"
      >
        <span
          v-for="n in 3"
          :key="n"
          class="site-nav__menu-line"
          aria-hidden="true"
        ></span>
      </button>
    </nav>
  </header>
</template>

<style lang="scss" scoped>
/** @define site-nav */
.site-nav {
  --site-nav-paper: #ece8e1;
  --site-nav-ink: #101214;
  --site-nav-ink-soft: #3a4454;
  --site-nav-sun: #c73826;

  position: fixed;
  inset: 0 0 auto;
  z-index: 7000;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--site-nav-ink);
  pointer-events: none;
  transform: translateY(-110%);
  transition: transform 0.45s cubic-bezier(0.3, 0.7, 0.2, 1);

  &--shown,
  &:focus-within {
    pointer-events: auto;
    transform: none;
  }

  /* a strip of the same paper, with a brushed line of ink along its edge */
  &__bar {
    position: relative;
    display: flex;
    gap: clamp(16px, 3vw, 40px);
    align-items: center;
    padding: 12px var(--page-pad);
    background: rgb(236 232 225 / 94%);
    backdrop-filter: blur(6px);
  }

  &__bar::after {
    position: absolute;
    right: 0;
    bottom: -3px;
    left: 0;
    height: 3px;
    content: '';
    background:
      linear-gradient(
          90deg,
          transparent,
          rgb(16 18 20 / 55%) 12%,
          rgb(16 18 20 / 70%) 50%,
          rgb(16 18 20 / 45%) 88%,
          transparent
        )
        0 0 / 100% 1px no-repeat,
      linear-gradient(90deg, transparent 20%, rgb(16 18 20 / 18%) 45%, transparent 80%) 0 1px / 100%
        2px no-repeat;
  }

  &__brand {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-right: auto;
    color: inherit;
    text-decoration: none;
  }

  &__mark {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    font-family: Unbounded, sans-serif;
    font-size: 10.5px;
    font-weight: 500;
    color: var(--site-nav-paper);
    letter-spacing: -0.04em;
    background: var(--site-nav-sun);
    border-radius: 50%;
    transform: rotate(-6deg);
  }

  &__name {
    font-family: Unbounded, 'Arial Black', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.01em;
  }

  &__links {
    display: flex;
    gap: clamp(14px, 2.4vw, 32px);
  }

  &__link {
    position: relative;
    padding: 6px 0;
    font-size: 11.5px;
    color: var(--site-nav-ink-soft);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    transition: color 0.2s;
  }

  &__link:hover {
    color: var(--site-nav-ink);
  }

  /* the section being read gets a stroke of cinnabar under it */
  &__link::after {
    position: absolute;
    right: -2px;
    bottom: 0;
    left: -2px;
    height: 2px;
    content: '';
    background: var(--site-nav-sun);
    border-radius: 2px;
    opacity: 0;
    transform: scaleX(0.2);
    transform-origin: left;
    transition:
      opacity 0.3s,
      transform 0.4s cubic-bezier(0.3, 0.7, 0.2, 1);
  }

  &__link--current {
    color: var(--site-nav-ink);
  }

  &__link--current::after {
    opacity: 0.85;
    transform: none;
  }

  /* the other language: quiet, like the section links, stays on phones too */
  &__lang {
    padding: 6px 0;
    font-size: 11.5px;
    color: var(--site-nav-ink-soft);
    text-decoration: none;
    letter-spacing: 0.12em;
    border-bottom: 1px solid rgb(58 68 84 / 35%);
    transition:
      color 0.2s,
      border-color 0.2s;
  }

  &__lang:hover {
    color: var(--site-nav-ink);
    border-bottom-color: var(--site-nav-sun);
  }

  /* the one call to action: a stamp in the sun's colour */
  &__write {
    padding: 7px 12px 6px;
    font-size: 11.5px;
    color: var(--site-nav-sun);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border: 1px solid rgb(199 56 38 / 60%);
    border-radius: 2px;
    transition:
      color 0.2s,
      background-color 0.2s;
  }

  &__write:hover,
  &__write--current {
    color: var(--site-nav-paper);
    background: var(--site-nav-sun);
  }

  // three strokes of ink that cross into an X while the menu is open, in a box of
  // one size either way
  &__menu {
    position: relative;
    display: none;
    flex: none;
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--site-nav-ink);
    cursor: pointer;
    background: none;
    border: 0;
  }

  &__menu-line {
    position: absolute;
    left: 7px;
    right: 7px;
    height: 1.5px;
    background: currentcolor;
    border-radius: 1px;
    transition:
      transform 0.25s ease,
      opacity 0.2s ease;

    &:nth-child(1) {
      top: 10px;
    }

    &:nth-child(2) {
      top: 15.25px;
    }

    &:nth-child(3) {
      top: 20.5px;
    }
  }

  &--open &__menu-line:nth-child(1) {
    transform: translateY(5.25px) rotate(45deg);
  }

  &--open &__menu-line:nth-child(2) {
    opacity: 0;
  }

  &--open &__menu-line:nth-child(3) {
    transform: translateY(-5.25px) rotate(-45deg);
  }

  &__link:focus-visible,
  &__brand:focus-visible,
  &__write:focus-visible,
  &__lang:focus-visible,
  &__menu:focus-visible {
    outline: 2px solid var(--site-nav-sun);
    outline-offset: 4px;
  }

  /* phones: the name, the call to action, and the sections behind a menu */
  @media (width < 860px) {
    &__name {
      display: none;
    }

    &__menu {
      display: block;
    }

    // the sections drop down under the bar, softly
    &__links {
      position: absolute;
      top: 100%;
      right: 0;
      left: 0;
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 8px var(--page-pad) 18px;
      visibility: hidden;
      background: rgb(236 232 225 / 97%);
      opacity: 0;
      transform: translateY(-6px);
      transition:
        opacity 0.2s ease,
        transform 0.2s ease,
        visibility 0.2s;
    }

    &--open &__links {
      visibility: visible;
      opacity: 1;
      transform: none;
    }

    &__link {
      align-self: flex-start;
      padding: 12px 0;
      font-size: 13px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &__menu-line,
    &__links {
      transition: none;
    }
  }
}
</style>
