<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useInView } from '@/composables/useInView'
import { shouldSkipEntrance } from '@/shared/lib/hydration'

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

const { target, targetRef, inView } = useInView({ threshold: 0.3 })

// Starts at the final value so the prerendered HTML carries a real number
// (a crawler reading "0 systems in production" would be worse than useless)
// and so hydration matches. The client rewinds to zero only when it is
// actually going to animate.
const display = ref(props.to)
let done = false

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

onMounted(() => {
  if (shouldSkipEntrance(target.value)) {
    done = true
    return
  }
  display.value = 0
})

watch(inView, (visible) => {
  if (!visible || done) return
  done = true
  run()
})
</script>

<template>
  <span
    :ref="targetRef"
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
