<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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
const current = ref<SectionId | null>(null)

const UP = 12 // px up before it comes back: a nudge, not a twitch
const DOWN = 4
let lastY = 0
let upBy = 0
let frame = 0

function heroBottom() {
  const hero = document.getElementById('top')
  return hero ? hero.offsetTop + hero.offsetHeight - innerHeight : innerHeight
}

function onScroll() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
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

// which section is being read: the one across the middle of the screen
let spy: IntersectionObserver | null = null

onMounted(() => {
  lastY = scrollY
  addEventListener('scroll', onScroll, { passive: true })
  spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) current.value = entry.target.id as SectionId
      }
    },
    { rootMargin: '-50% 0px -50% 0px' }
  )
  for (const id of [...LINKS, 'contact']) {
    const el = document.getElementById(id)
    if (el) spy.observe(el)
  }
})

onBeforeUnmount(() => {
  removeEventListener('scroll', onScroll)
  cancelAnimationFrame(frame)
  spy?.disconnect()
})

// a link was followed: the page is travelling, the bar steps aside
function go() {
  open.value = false
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

      <a
        class="site-nav__write"
        :class="{ 'site-nav__write--current': current === 'contact' }"
        href="#contact"
        @click="go"
        >{{ t('home.nav.contact') }}</a
      >

      <button
        class="site-nav__menu"
        type="button"
        :aria-expanded="open"
        aria-controls="site-nav-links"
        @click="open = !open"
      >
        {{ open ? t('home.nav.close') : t('home.nav.menu') }}
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

  &--shown {
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

  &__menu {
    display: none;
    padding: 6px 0;
    font: inherit;
    font-size: 11.5px;
    color: var(--site-nav-ink);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    cursor: pointer;
    background: none;
    border: 0;
    border-bottom: 1px solid currentcolor;
  }

  &__link:focus-visible,
  &__brand:focus-visible,
  &__write:focus-visible,
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

    &__links {
      position: absolute;
      top: 100%;
      right: 0;
      left: 0;
      display: none;
      flex-direction: column;
      gap: 0;
      padding: 8px var(--page-pad) 18px;
      background: rgb(236 232 225 / 97%);
    }

    &--open &__links {
      display: flex;
    }

    &__link {
      align-self: flex-start;
      padding: 12px 0;
      font-size: 13px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}
</style>
