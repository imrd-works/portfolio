<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'LayoutSection',
})

type Pad = 'none' | 's' | 'm' | 'l'
type SidePad = Pad | 'band' | 'band-sm'

const props = withDefaults(
  defineProps<{
    tag?: string
    padding?: Pad
    paddingTop?: SidePad
    paddingBottom?: SidePad
  }>(),
  {
    tag: 'section',
    padding: 'm',
    paddingTop: undefined,
    paddingBottom: undefined,
  }
)

const classes = computed(() => [
  !props.paddingTop && !props.paddingBottom && props.padding !== 'none'
    ? `section--padding-${props.padding}`
    : null,
  props.paddingTop ? `section--pt-${props.paddingTop}` : null,
  props.paddingBottom ? `section--pb-${props.paddingBottom}` : null,
])
</script>

<template>
  <component
    :is="tag"
    class="section"
    :class="classes"
  >
    <slot />
  </component>
</template>

<style lang="scss" scoped>
/** @define section */
@use 'assets/styles/mixins' as *;

.section {
  &--padding-s {
    @include fluid-between(padding-block, var(--spacing-xs), var(--spacing-m), 'md', 'xl');
  }

  &--padding-m {
    @include fluid-between(padding-block, var(--spacing-s), var(--spacing-l), 'md', 'xl');
  }

  &--padding-l {
    @include fluid-between(padding-block, var(--spacing-m), var(--spacing-xl), 'md', 'xl');
  }

  // Per-side overrides — top.
  &--pt-none {
    padding-top: 0;
  }

  &--pt-s {
    @include fluid-between(padding-top, var(--spacing-xs), var(--spacing-m), 'md', 'xl');
  }

  &--pt-m {
    @include fluid-between(padding-top, var(--spacing-s), var(--spacing-l), 'md', 'xl');
  }

  &--pt-l {
    @include fluid-between(padding-top, var(--spacing-m), var(--spacing-xl), 'md', 'xl');
  }

  &--pt-band {
    padding-top: var(--layout-band);
  }

  &--pt-band-sm {
    padding-top: var(--layout-band-sm);
  }

  // Per-side overrides — bottom.
  &--pb-none {
    padding-bottom: 0;
  }

  &--pb-s {
    @include fluid-between(padding-bottom, var(--spacing-xs), var(--spacing-m), 'md', 'xl');
  }

  &--pb-m {
    @include fluid-between(padding-bottom, var(--spacing-s), var(--spacing-l), 'md', 'xl');
  }

  &--pb-l {
    @include fluid-between(padding-bottom, var(--spacing-m), var(--spacing-xl), 'md', 'xl');
  }

  &--pb-band {
    padding-bottom: var(--layout-band);
  }

  &--pb-band-sm {
    padding-bottom: var(--layout-band-sm);
  }
}
</style>
