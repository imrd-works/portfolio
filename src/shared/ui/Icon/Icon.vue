<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    name: string
    size?: number | string
    width?: number | string
    height?: number | string
    title?: string
  }>(),
  {
    size: 24,
    width: undefined,
    height: undefined,
    title: undefined,
  }
)

const sizeVal = computed(() => {
  if (props.width !== undefined && props.height !== undefined)
    return { width: props.width, height: props.height }
  const s = props.size ?? 24
  return { width: s, height: s }
})

const isDecorative = computed(() => !props.title)
</script>

<template>
  <svg
    class="icon"
    v-bind="$attrs"
    :width="sizeVal.width"
    :height="sizeVal.height"
    :aria-label="title"
    :aria-hidden="isDecorative ? 'true' : undefined"
    :role="isDecorative ? undefined : 'img'"
  >
    <use :href="`#icon-${name}`" />
  </svg>
</template>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  fill: currentcolor;
}
</style>
