<script setup lang="ts">
import { ref, watch } from 'vue'
import { useInView } from '@/composables/useInView'

defineOptions({ name: 'UiCountUp' })

const props = withDefaults(
  defineProps<{
    to: number
    suffix?: string
    duration?: number
  }>(),
  {
    suffix: '',
    duration: 1500,
  }
)

const { targetRef: target, inView } = useInView({ threshold: 0.3 })
const display = ref(0)

function run() {
  const start = performance.now()
  const step = (now: number) => {
    const p = Math.min((now - start) / props.duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    display.value = Math.round(props.to * eased)
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

watch(inView, (visible) => {
  if (visible) run()
})
</script>

<template>
  <span
    :ref="target"
    class="count-up"
    >{{ display }}{{ suffix }}</span
  >
</template>

<style lang="scss" scoped>
/** @define count-up */
.count-up {
  display: inline-block;
  font-variant-numeric: tabular-nums;
}
</style>
