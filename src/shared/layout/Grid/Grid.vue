<script setup lang="ts">
defineOptions({
  name: 'LayoutGrid',
})

withDefaults(
  defineProps<{
    tag?: string
    columns?: number | string
    gap?: 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
    align?: 'start' | 'center' | 'end' | 'stretch'
    stack?: 'sm' | 'md' | 'lg'
  }>(),
  {
    tag: 'div',
    columns: 1,
    gap: 'm',
    align: 'stretch',
    stack: undefined,
  }
)
</script>

<template>
  <component
    :is="tag"
    class="grid"
    :class="[`grid--gap-${gap}`, `grid--align-${align}`, stack && `grid--stack-${stack}`]"
    :style="{
      '--grid-columns': typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
    }"
  >
    <slot />
  </component>
</template>

<style lang="scss" scoped>
/** @define grid */
@use 'assets/styles/mixins' as *;

.grid {
  display: grid;
  grid-template-columns: var(--grid-columns);

  &--gap-xs {
    gap: var(--spacing-xs);
  }

  &--gap-s {
    gap: var(--spacing-s);
  }

  &--gap-m {
    gap: var(--spacing-m);
  }

  &--gap-l {
    gap: var(--spacing-l);
  }

  &--gap-xl {
    gap: var(--spacing-xl);
  }

  &--gap-2xl {
    gap: var(--spacing-2xl);
  }

  &--gap-3xl {
    gap: var(--spacing-3xl);
  }

  &--gap-4xl {
    gap: var(--spacing-4xl);
  }

  &--gap-5xl {
    gap: var(--spacing-5xl);
  }

  &--gap-6xl {
    gap: var(--spacing-6xl);
  }

  &--align-start {
    align-items: start;
  }

  &--align-center {
    align-items: center;
  }

  &--align-end {
    align-items: end;
  }

  &--align-stretch {
    align-items: stretch;
  }

  &--stack-sm,
  &--stack-md,
  &--stack-lg {
    grid-template-columns: minmax(0, 1fr);
  }

  &--stack-sm {
    @include bp-up(sm) {
      grid-template-columns: var(--grid-columns);
    }
  }

  &--stack-md {
    @include bp-up(md) {
      grid-template-columns: var(--grid-columns);
    }
  }

  &--stack-lg {
    @include bp-up(lg) {
      grid-template-columns: var(--grid-columns);
    }
  }
}
</style>
