<script setup lang="ts">
defineOptions({ name: 'UiToggleSwitch' })

/*
 * A setting that is on or off: its name and a switch on one line, a line of what it
 * does under them. A `switch` for screen readers, which read whether it is on.
 */
defineProps<{
  label: string
  hint?: string
}>()

const on = defineModel<boolean>({ required: true })
</script>

<template>
  <div class="toggle-switch">
    <button
      class="toggle-switch__control"
      type="button"
      role="switch"
      :aria-checked="on"
      @click="on = !on"
    >
      <span class="toggle-switch__label">{{ label }}</span>
      <span
        class="toggle-switch__track"
        aria-hidden="true"
      >
        <span class="toggle-switch__thumb"></span>
      </span>
    </button>
    <p
      v-if="hint"
      class="toggle-switch__hint"
    >
      {{ hint }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
/** @define toggle-switch */
.toggle-switch {
  --toggle-switch-paper: #ece8e1;
  --toggle-switch-ink-soft: #3a4454;
  --toggle-switch-sun: #c73826;

  &__control {
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
    background: var(--toggle-switch-paper);
    border-radius: 50%;
    box-shadow: 0 1px 2px rgb(16 18 20 / 30%);
    transition: transform 0.2s;
  }

  &__control[aria-checked='true'] &__track {
    background: var(--toggle-switch-sun);
  }

  &__control[aria-checked='true'] &__thumb {
    transform: translateX(16px);
  }

  &__hint {
    margin: 10px 0 0;
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--toggle-switch-ink-soft);
  }

  &__control:focus-visible {
    outline: 2px solid var(--toggle-switch-sun);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    &__track,
    &__thumb {
      transition: none;
    }
  }
}
</style>
