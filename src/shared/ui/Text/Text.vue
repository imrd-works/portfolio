<script setup lang="ts">
defineOptions({
  name: 'UiText',
})

type TextVariant =
  | 'display-xl'
  | 'display-l'
  | 'display-m'
  | 'display-s'
  | 'heading-xl'
  | 'heading-l'
  | 'heading-m'
  | 'heading-s'
  | 'heading-xs'
  | 'body-l'
  | 'body-m'
  | 'body-s'
  | 'label-l'
  | 'label-m'
  | 'label-s'
  | 'caption'
  | 'code'

type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'inverse'
  | 'link'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

withDefaults(
  defineProps<{
    tag?: string
    variant?: TextVariant
    tone?: TextTone
  }>(),
  {
    tag: 'p',
    variant: 'body-m',
    tone: 'primary',
  }
)
</script>

<template>
  <component
    :is="tag"
    class="text"
    :class="[`text--variant-${variant}`, `text--tone-${tone}`]"
  >
    <slot />
  </component>
</template>

<style lang="scss" scoped>
/** @define text */
@use 'assets/styles/mixins' as *;

.text {
  margin: 0;

  &--variant-display-xl {
    @include text('display-xl');
  }

  &--variant-display-l {
    @include text('display-l');
  }

  &--variant-display-m {
    @include text('display-m');
  }

  &--variant-display-s {
    @include text('display-s');
  }

  &--variant-heading-xl {
    @include text('heading-xl');
  }

  &--variant-heading-l {
    @include text('heading-l');
  }

  &--variant-heading-m {
    @include text('heading-m');
  }

  &--variant-heading-s {
    @include text('heading-s');
  }

  &--variant-heading-xs {
    @include text('heading-xs');
  }

  &--variant-body-l {
    @include text('body-l');
  }

  &--variant-body-m {
    @include text('body-m');
  }

  &--variant-body-s {
    @include text('body-s');
  }

  &--variant-label-l {
    @include text('label-l');
  }

  &--variant-label-m {
    @include text('label-m');
  }

  &--variant-label-s {
    @include text('label-s');
  }

  &--variant-caption {
    @include text('caption');
  }

  &--variant-code {
    @include text('code');
  }

  &--tone-primary {
    color: var(--color-text-primary);
  }

  &--tone-secondary {
    color: var(--color-text-secondary);
  }

  &--tone-tertiary {
    color: var(--color-text-tertiary);
  }

  &--tone-disabled {
    color: var(--color-text-disabled);
  }

  &--tone-inverse {
    color: var(--color-text-inverse);
  }

  &--tone-link {
    color: var(--color-text-link);
  }

  &--tone-success {
    color: var(--color-text-success);
  }

  &--tone-warning {
    color: var(--color-text-warning);
  }

  &--tone-danger {
    color: var(--color-text-danger);
  }

  &--tone-info {
    color: var(--color-text-info);
  }
}
</style>
