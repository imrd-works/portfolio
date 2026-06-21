<script setup lang="ts">
import Section from '../Section/Section.vue'
import Container from '../Container/Container.vue'

defineOptions({ name: 'LayoutPageSection' })

type Pad = 'none' | 's' | 'm' | 'l'
type SidePad = Pad | 'band' | 'band-sm'

withDefaults(
  defineProps<{
    tag?: string
    padding?: Pad
    paddingTop?: SidePad
    paddingBottom?: SidePad
    maxWidth?: string
    containerPadding?: 'none' | 's' | 'm' | 'l' | 'gutter'
    relative?: boolean
  }>(),
  {
    tag: 'section',
    padding: 'm',
    paddingTop: undefined,
    paddingBottom: undefined,
    maxWidth: 'var(--layout-max-width)',
    containerPadding: 'gutter',
    relative: false,
  }
)
</script>

<template>
  <Section
    :tag="tag"
    :padding="padding"
    :padding-top="paddingTop"
    :padding-bottom="paddingBottom"
    class="page-section"
    :class="{ 'page-section--relative': relative }"
  >
    <Container
      :max-width="maxWidth"
      :padding="containerPadding"
    >
      <slot />
    </Container>
  </Section>
</template>

<style lang="scss" scoped>
/** @define page-section */
.page-section {
  &--relative {
    position: relative;
    z-index: 2;
  }
}
</style>
