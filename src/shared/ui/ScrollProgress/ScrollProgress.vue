<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useThrottleFn } from '@vueuse/core'

defineOptions({ name: 'UiScrollProgress' })

const progress = ref(0)

const update = useThrottleFn(() => {
  const doc = document.documentElement
  const scrollable = doc.scrollHeight - doc.clientHeight || 1
  progress.value = Math.min(Math.max(doc.scrollTop / scrollable, 0), 1)
}, 16)

onMounted(() => {
  window.addEventListener('scroll', update, { passive: true })
  update()
})

onBeforeUnmount(() => window.removeEventListener('scroll', update))
</script>

<template>
  <div
    class="scroll-progress"
    :style="{ width: `${progress * 100}%` }"
    aria-hidden="true"
  ></div>
</template>

<style lang="scss" scoped>
/** @define scroll-progress */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9000;
  height: 2px;
  background: linear-gradient(
    90deg,
    var(--color-accent-strong),
    var(--color-accent),
    var(--color-accent-alt)
  );
}
</style>
