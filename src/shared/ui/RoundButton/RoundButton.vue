<script setup lang="ts">
import { useTemplateRef } from 'vue'

defineOptions({ name: 'UiRoundButton' })

/*
 * The page corner's control: a paper disc with an icon (the cookie, the gear, the
 * way up). As the site nav's call to action, it takes the seal's cinnabar on
 * hover, is filled with it while what it opens is open (`aria-expanded`), and
 * gives a little under the finger. Everything else (a label, `aria-*`, a click)
 * goes to the button itself.
 */
defineProps<{
  /** What it does, for screen readers: the disc shows only an icon. */
  label: string
}>()

const el = useTemplateRef<HTMLButtonElement>('el')
defineExpose({ focus: () => el.value?.focus() })
</script>

<template>
  <button
    ref="el"
    class="round-button"
    type="button"
    :aria-label="label"
  >
    <span
      class="round-button__icon"
      aria-hidden="true"
    >
      <slot />
    </span>
  </button>
</template>

<style lang="scss" scoped>
/** @define round-button */
.round-button {
  // the hero's paper, ink and seal
  --round-button-paper: #ece8e1;
  --round-button-ink: #101214;
  --round-button-sun: #c73826;

  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  color: var(--round-button-ink);
  cursor: pointer;
  background: var(--round-button-paper);
  border: 1px solid rgb(16 18 20 / 16%);
  border-radius: 50%;
  box-shadow: 0 6px 18px rgb(16 18 20 / 16%);
  transition:
    color 0.2s,
    background-color 0.2s,
    border-color 0.2s,
    transform 0.15s ease;

  &__icon {
    display: grid;
    width: 17px;
    height: 17px;
    transition: transform 0.4s ease;
  }

  &:hover {
    color: var(--round-button-sun);
    border-color: rgb(199 56 38 / 60%);
  }

  &[aria-expanded='true'] {
    color: var(--round-button-paper);
    background: var(--round-button-sun);
    border-color: var(--round-button-sun);
  }

  &:active {
    transform: scale(0.93);
  }

  &:focus-visible {
    outline: 2px solid var(--round-button-sun);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    &,
    &__icon {
      transition: none;
    }

    &:active {
      transform: none;
    }
  }
}
</style>
