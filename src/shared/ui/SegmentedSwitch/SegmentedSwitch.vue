<script setup lang="ts" generic="T extends string | number">
import { useId } from 'vue'

defineOptions({ name: 'UiSegmentedSwitch' })

/*
 * A setting with a few values side by side, one of them on: its name and the
 * choices on one line, a line of what it does under them. Real radio buttons in
 * a fieldset, so the arrows move between them and screen readers name the group.
 */
defineProps<{
  label: string
  hint?: string
  options: readonly { value: T; label: string }[]
  disabled?: boolean
}>()

const value = defineModel<T>({ required: true })
const name = useId()
</script>

<template>
  <fieldset
    class="segmented-switch"
    :disabled="disabled"
  >
    <div class="segmented-switch__row">
      <legend class="segmented-switch__label">{{ label }}</legend>
      <div class="segmented-switch__options">
        <label
          v-for="option in options"
          :key="option.value"
          :for="`${name}-${option.value}`"
          class="segmented-switch__option"
          :class="{ 'segmented-switch__option--on': option.value === value }"
        >
          <input
            :id="`${name}-${option.value}`"
            v-model="value"
            class="segmented-switch__input"
            type="radio"
            :name="name"
            :value="option.value"
          />
          {{ option.label }}
        </label>
      </div>
    </div>
    <p
      v-if="hint"
      class="segmented-switch__hint"
    >
      {{ hint }}
    </p>
  </fieldset>
</template>

<style lang="scss" scoped>
/** @define segmented-switch */
.segmented-switch {
  --segmented-switch-paper: #ece8e1;
  --segmented-switch-ink-soft: #3a4454;
  --segmented-switch-sun: #c73826;

  min-width: 0;
  padding: 0;
  margin: 0;
  border: 0;

  &__row {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  &__label {
    float: left; // a legend otherwise sits over the fieldset's border, not in the row
    padding: 0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__options {
    display: flex;
    flex: none;
    overflow: hidden;
    border: 1px solid rgb(58 68 84 / 35%);
    border-radius: 9px;
  }

  // the choices: a mark of the seal's cinnabar on the one that is on
  &__option {
    position: relative;
    padding: 2px 8px;
    font-size: 11px;
    line-height: 14px;
    cursor: pointer;
    transition:
      color 0.2s,
      background-color 0.2s;
  }

  &__option + &__option {
    border-left: 1px solid rgb(58 68 84 / 20%);
  }

  &__option--on {
    color: var(--segmented-switch-paper);
    background: var(--segmented-switch-sun);
  }

  &__input {
    position: absolute;
    inset: 0;
    margin: 0;
    cursor: pointer;
    opacity: 0;
  }

  &__option:has(&__input:focus-visible) {
    outline: 2px solid var(--segmented-switch-sun);
    outline-offset: -2px;
  }

  &:disabled &__option {
    cursor: default;
    opacity: 0.45;
  }

  &__hint {
    margin: 10px 0 0;
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--segmented-switch-ink-soft);
  }

  @media (prefers-reduced-motion: reduce) {
    &__option {
      transition: none;
    }
  }
}
</style>
