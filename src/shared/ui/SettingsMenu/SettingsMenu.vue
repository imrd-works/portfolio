<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { chooseGraphics, graphics, onGraphicsChange } from '@/shared/lib/graphics'

defineOptions({ name: 'UiSettingsMenu' })

/** `round`: a paper disc of its own, for where it stands alone (the page corner). */
defineProps<{ round?: boolean }>()

/*
 * A gear that opens the page's settings: for now the light mode (lib/graphics.ts),
 * on and off. It is also the way back for a visitor who took the light mode when the
 * page offered it. The panel opens where there is room: down or up, and towards the
 * middle of the screen, so the same menu fits the hero's corner and the site nav.
 */
const { t } = useI18n()
const id = useId()
const root = ref<HTMLElement | null>(null)
const button = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const light = ref(false)
const up = ref(false)
const fromLeft = ref(false)
let off = () => {}

function toggleMenu() {
  if (!open.value && root.value) {
    const r = root.value.getBoundingClientRect()
    up.value = innerHeight - r.bottom < 200 && r.top > innerHeight - r.bottom
    fromLeft.value = r.left + r.width / 2 < innerWidth / 2
  }
  open.value = !open.value
}

function toggleLight() {
  chooseGraphics(light.value ? 'high' : 'low')
}

// a click elsewhere or Escape closes it, and Escape gives the focus back to the gear
function onDocClick(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !open.value) return
  open.value = false
  button.value?.focus()
}

onMounted(() => {
  light.value = graphics.low
  off = onGraphicsChange((level) => (light.value = level === 'low'))
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  off()
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div
    ref="root"
    class="settings-menu"
    :class="{ 'settings-menu--round': round }"
  >
    <button
      ref="button"
      class="settings-menu__gear"
      type="button"
      :aria-expanded="open"
      :aria-controls="id"
      :aria-label="t('settings.label')"
      @click="toggleMenu"
    >
      <svg
        class="settings-menu__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
        />
        <path
          d="M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-2.6-1.5L14.1 2.5h-4.2l-.4 2.5A7.6 7.6 0 0 0 6.9 6.5l-2.3-.9-2 3.4 2 1.5a7.7 7.7 0 0 0 0 3l-2 1.5 2 3.4 2.3-.9a7.6 7.6 0 0 0 2.6 1.5l.4 2.5h4.2l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.3.9 2-3.4-2-1.5Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div
      v-if="open"
      :id="id"
      class="settings-menu__panel"
      :class="{ 'settings-menu__panel--up': up, 'settings-menu__panel--from-left': fromLeft }"
      role="group"
      :aria-label="t('settings.label')"
    >
      <button
        class="settings-menu__switch"
        type="button"
        role="switch"
        :aria-checked="light"
        @click="toggleLight"
      >
        <span class="settings-menu__name">{{ t('settings.light') }}</span>
        <span
          class="settings-menu__track"
          aria-hidden="true"
        >
          <span class="settings-menu__thumb"></span>
        </span>
      </button>
      <p class="settings-menu__hint">{{ t('settings.lightHint') }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/** @define settings-menu */
.settings-menu {
  // the hero's paper, ink and seal
  --settings-menu-paper: #ece8e1;
  --settings-menu-ink: #101214;
  --settings-menu-ink-soft: #3a4454;
  --settings-menu-sun: #c73826;

  position: relative;
  display: inline-flex;

  &__gear {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    padding: 0;
    color: inherit;
    cursor: pointer;
    background: none;
    border: 0;
  }

  &--round &__gear {
    width: 40px;
    height: 40px;
    color: var(--settings-menu-ink);
    background: var(--settings-menu-paper);
    border: 1px solid rgb(16 18 20 / 16%);
    border-radius: 50%;
    box-shadow: 0 6px 18px rgb(16 18 20 / 16%);
  }

  &__icon {
    width: 17px;
    height: 17px;
    transition: transform 0.4s ease;
  }

  &__gear:hover &__icon,
  &__gear[aria-expanded='true'] &__icon {
    transform: rotate(45deg);
  }

  &__panel {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    z-index: 9450;
    width: 260px;
    padding: 14px 16px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    color: var(--settings-menu-ink);
    text-align: left;
    text-transform: none;
    letter-spacing: normal;
    background: var(--settings-menu-paper);
    border: 1px solid rgb(16 18 20 / 16%);
    border-radius: 2px;
    box-shadow: 0 10px 30px rgb(16 18 20 / 18%);
  }

  &__panel--up {
    top: auto;
    bottom: calc(100% + 10px);
  }

  &__panel--from-left {
    right: auto;
    left: 0;
  }

  &__switch {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0;
    font: inherit;
    font-size: 12px;
    color: inherit;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    background: none;
    border: 0;
  }

  &__track {
    position: relative;
    flex: none;
    width: 34px;
    height: 18px;
    background: rgb(58 68 84 / 30%);
    border-radius: 9px;
    transition: background-color 0.2s;
  }

  &__thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: var(--settings-menu-paper);
    border-radius: 50%;
    box-shadow: 0 1px 2px rgb(16 18 20 / 30%);
    transition: transform 0.2s;
  }

  &__switch[aria-checked='true'] &__track {
    background: var(--settings-menu-sun);
  }

  &__switch[aria-checked='true'] &__thumb {
    transform: translateX(16px);
  }

  &__hint {
    margin: 10px 0 0;
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--settings-menu-ink-soft);
  }

  &__gear:focus-visible,
  &__switch:focus-visible {
    outline: 2px solid var(--settings-menu-sun);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    &__icon,
    &__track,
    &__thumb {
      transition: none;
    }
  }
}
</style>
