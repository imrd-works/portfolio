<script setup lang="ts">
import Icon from '@/shared/ui/Icon/Icon.vue'

defineOptions({
  name: 'UiButton',
})

withDefaults(
  defineProps<{
    variant?: 'primary' | 'accent' | 'brand' | 'ghost' | 'outline' | 'text'
    size?: 's' | 'm' | 'l'
    tag?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    icon?: string
    ariaLabel?: string
  }>(),
  {
    variant: 'primary',
    size: 'm',
    tag: 'button',
    type: 'button',
    disabled: false,
    loading: false,
    icon: undefined,
    ariaLabel: undefined,
  }
)
</script>

<template>
  <component
    :is="tag"
    class="btn"
    :class="[
      `btn--${variant}`,
      `btn--${size}`,
      {
        'btn--loading': loading,
        'btn--icon-only': !$slots.default,
      },
      !$slots.default && `btn--icon-only-${size}`,
    ]"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled || loading : undefined"
    :aria-disabled="tag !== 'button' && (disabled || loading) ? 'true' : undefined"
    :aria-label="ariaLabel"
  >
    <span
      v-if="loading"
      class="btn__spinner"
      aria-hidden="true"
    >
      <Icon
        name="refresh"
        :size="size === 's' ? 14 : size === 'l' ? 18 : 16"
      />
    </span>

    <Icon
      v-else-if="icon"
      :name="icon"
      class="btn__icon"
      :size="size === 's' ? 14 : size === 'l' ? 18 : 16"
      aria-hidden="true"
    />

    <span
      v-if="$slots.default"
      class="btn__label"
    >
      <slot />
    </span>
  </component>
</template>

<style lang="scss" scoped>
/** @define btn */
@use 'assets/styles/mixins' as *;

.btn {
  display: inline-flex;
  gap: var(--spacing-xs);
  align-items: center;
  justify-content: center;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  transition:
    color 150ms ease,
    background-color 150ms ease,
    border-color 150ms ease,
    box-shadow 150ms ease,
    opacity 150ms ease;

  &:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }

  &--s {
    @include text('label-m');

    min-height: 32px;
    padding: var(--spacing-2xs) var(--spacing-s);
  }

  &--m {
    @include text('label-l');

    min-height: 40px;
    padding: var(--spacing-xs) var(--spacing-m);
  }

  &--l {
    @include text('label-l');

    min-height: 48px;
    padding: var(--spacing-s) var(--spacing-xl);
  }

  &--icon-only {
    aspect-ratio: 1;
  }

  &--icon-only-s {
    width: 32px;
    padding: var(--spacing-2xs);
  }

  &--icon-only-m {
    width: 40px;
    padding: var(--spacing-xs);
  }

  &--icon-only-l {
    width: 48px;
    padding: var(--spacing-s);
  }

  &--primary {
    color: var(--color-text-primary);
    background: var(--color-bg-surface);
    border-color: var(--color-border-default);

    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--color-action-secondary-bg-hover);
    }

    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--color-action-secondary-bg-active);
    }

    &:disabled,
    &[aria-disabled='true'] {
      color: var(--color-action-primary-fg-disabled);
      background: var(--color-action-primary-bg-disabled);
      border-color: transparent;
    }
  }

  &--accent {
    color: var(--color-action-primary-fg);
    background: var(--color-action-primary-bg);
    border-color: transparent;

    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--color-action-primary-bg-hover);
    }

    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--color-action-primary-bg-active);
    }

    &:disabled,
    &[aria-disabled='true'] {
      color: var(--color-action-primary-fg-disabled);
      background: var(--color-action-primary-bg-disabled);
    }
  }

  &--brand {
    color: var(--color-on-accent);
    background: var(--gradient-primary);
    border-color: transparent;
    box-shadow: var(--shadow-glow-soft);

    &:hover:not(:disabled):not([aria-disabled='true']) {
      filter: brightness(1.06);
    }

    &:active:not(:disabled):not([aria-disabled='true']) {
      filter: brightness(0.98);
    }

    &:disabled,
    &[aria-disabled='true'] {
      filter: grayscale(0.4);
      opacity: 0.6;
      box-shadow: none;
    }
  }

  &--ghost {
    color: var(--color-text-primary);
    background: var(--color-bg-surface-sunken);
    border-color: var(--color-border-subtle);

    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--color-action-secondary-bg-hover);
      border-color: var(--color-border-default);
    }

    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--color-action-secondary-bg-active);
    }

    &:disabled,
    &[aria-disabled='true'] {
      color: var(--color-action-secondary-fg-disabled);
      border-color: var(--color-border-subtle);
    }
  }

  &--outline {
    color: var(--color-action-secondary-fg);
    background: var(--color-action-secondary-bg);
    border-color: var(--color-action-secondary-border);

    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--color-action-secondary-bg-hover);
    }

    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--color-action-secondary-bg-active);
    }

    &:disabled,
    &[aria-disabled='true'] {
      color: var(--color-action-secondary-fg-disabled);
      border-color: var(--color-border-subtle);
    }
  }

  &--text {
    color: var(--color-text-primary);
    background: transparent;
    border-color: transparent;

    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--color-action-secondary-bg-hover);
    }

    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--color-action-secondary-bg-active);
    }

    &:disabled,
    &[aria-disabled='true'] {
      color: var(--color-action-secondary-fg-disabled);
    }
  }

  &:disabled,
  &[aria-disabled='true'] {
    pointer-events: none;
    cursor: not-allowed;
  }

  &--loading {
    pointer-events: none;
    cursor: wait;
  }

  &__spinner {
    display: inline-flex;
    animation: btn-spin 800ms linear infinite;
  }
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
