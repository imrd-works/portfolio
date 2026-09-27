<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'

defineOptions({ name: 'UiPopoverButton' })

/*
 * A paper disc with an icon that opens a small panel: the page corner's controls
 * (the settings, the cookies) are made of it. The panel opens where there is room,
 * down or up, and towards the middle of the screen; a click elsewhere or Escape
 * closes it, and Escape gives the focus back to the disc.
 */
defineProps<{
  /** What the disc and its panel are called, for screen readers. */
  label: string
  /** The icon turns a little on hover and while open (the gear). */
  turn?: boolean
}>()

const id = useId()
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const up = ref(false)
const fromLeft = ref(false)

function toggle() {
  if (!open.value && root.value) {
    const r = root.value.getBoundingClientRect()
    up.value = innerHeight - r.bottom < 200 && r.top > innerHeight - r.bottom
    fromLeft.value = r.left + r.width / 2 < innerWidth / 2
  }
  open.value = !open.value
}

function onDocClick(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !open.value) return
  open.value = false
  trigger.value?.focus()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div
    ref="root"
    class="popover-button"
    :class="{ 'popover-button--turn': turn }"
  >
    <button
      ref="trigger"
      class="popover-button__trigger"
      type="button"
      :aria-expanded="open"
      :aria-controls="id"
      :aria-label="label"
      @click="toggle"
    >
      <span
        class="popover-button__icon"
        aria-hidden="true"
      >
        <slot name="icon" />
      </span>
    </button>

    <div
      v-if="open"
      :id="id"
      class="popover-button__panel"
      :class="{
        'popover-button__panel--up': up,
        'popover-button__panel--from-left': fromLeft,
      }"
      role="group"
      :aria-label="label"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/** @define popover-button */
.popover-button {
  // the hero's paper, ink and seal
  --popover-button-paper: #ece8e1;
  --popover-button-ink: #101214;
  --popover-button-sun: #c73826;

  position: relative;
  display: inline-flex;

  &__trigger {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    color: var(--popover-button-ink);
    cursor: pointer;
    background: var(--popover-button-paper);
    border: 1px solid rgb(16 18 20 / 16%);
    border-radius: 50%;
    box-shadow: 0 6px 18px rgb(16 18 20 / 16%);
  }

  &__icon {
    display: grid;
    width: 17px;
    height: 17px;
    transition: transform 0.4s ease;
  }

  &--turn &__trigger:hover &__icon,
  &--turn &__trigger[aria-expanded='true'] &__icon {
    transform: rotate(45deg);
  }

  &__panel {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    z-index: 9450;
    display: grid;
    gap: 14px;
    width: 270px;
    padding: 14px 16px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    color: var(--popover-button-ink);
    text-align: left;
    background: var(--popover-button-paper);
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

  &__trigger:focus-visible {
    outline: 2px solid var(--popover-button-sun);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    &__icon {
      transition: none;
    }
  }
}
</style>
