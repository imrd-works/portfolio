<script setup lang="ts">
defineOptions({
  name: 'LayoutContainer',
})

withDefaults(
  defineProps<{
    tag?: string
    maxWidth?: string
    padding?: 'none' | 's' | 'm' | 'l' | 'gutter'
  }>(),
  {
    tag: 'div',
    maxWidth: '80rem',
    padding: 'm',
  }
)
</script>

<template>
  <component
    :is="tag"
    class="container"
    :class="[padding !== 'none' && `container--padding-${padding}`]"
    :style="{ '--container-max-width': maxWidth }"
  >
    <slot />
  </component>
</template>

<style lang="scss" scoped>
/** @define container */
@use 'assets/styles/mixins' as *;

.container {
  width: 100%;
  max-width: var(--container-max-width);
  margin-inline: auto;

  &--padding-s {
    @include fluid-between(padding-inline, var(--spacing-xs), var(--spacing-m), 'md', 'xl');
  }

  &--padding-m {
    @include fluid-between(padding-inline, var(--spacing-s), var(--spacing-l), 'md', 'xl');
  }

  &--padding-l {
    @include fluid-between(padding-inline, var(--spacing-m), var(--spacing-xl), 'md', 'xl');
  }

  &--padding-gutter {
    padding-inline: var(--layout-gutter);
  }
}
</style>
