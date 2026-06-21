<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'

defineOptions({
  name: 'UiMotion',
})

type MotionPreset = 'fade-up' | 'fade-in' | 'scale-in' | 'slide-left' | 'slide-right' | 'none'
type MotionTarget = 'self' | 'children'
type MotionTrigger = 'mount' | 'visible'
type MotionVars = Record<string, string | number | boolean>

const props = withDefaults(
  defineProps<{
    tag?: string
    preset?: MotionPreset
    target?: MotionTarget
    trigger?: MotionTrigger
    delay?: number
    stagger?: number
    duration?: number
    ease?: string
    once?: boolean
    disabled?: boolean
    from?: MotionVars
    to?: MotionVars
  }>(),
  {
    tag: 'div',
    preset: 'fade-up',
    target: 'self',
    trigger: 'mount',
    delay: 0,
    stagger: 0,
    duration: 500,
    ease: 'power2.out',
    once: true,
    disabled: false,
    from: undefined,
    to: undefined,
  }
)

const presetVars: Record<MotionPreset, { from: MotionVars; to: MotionVars }> = {
  'fade-up': {
    from: { opacity: 0, y: 24 },
    to: { opacity: 1, y: 0 },
  },
  'fade-in': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  'scale-in': {
    from: { opacity: 0, scale: 0.96 },
    to: { opacity: 1, scale: 1 },
  },
  'slide-left': {
    from: { opacity: 0, x: 24 },
    to: { opacity: 1, x: 0 },
  },
  'slide-right': {
    from: { opacity: 0, x: -24 },
    to: { opacity: 1, x: 0 },
  },
  none: {
    from: {},
    to: {},
  },
}

const el = ref<HTMLElement | null>(null)
const classes = computed(() => ['motion', `motion--${props.preset}`])

let observer: IntersectionObserver | null = null
let tween: gsap.core.Tween | null = null

function toSeconds(value: number) {
  return value / 1000
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

function getTargets() {
  if (!el.value) return null

  if (props.target === 'children') {
    const children = Array.from(el.value.children)
    return children.length > 0 ? children : null
  }

  return el.value
}

function getMotionVars() {
  const preset = presetVars[props.preset]

  return {
    from: props.from ?? preset.from,
    to: props.to ?? preset.to,
  }
}

function cleanupTween() {
  tween?.kill()
  tween = null
}

function animate() {
  if (props.disabled || props.preset === 'none' || prefersReducedMotion()) return

  const targets = getTargets()
  if (!targets) return

  const { from, to } = getMotionVars()

  cleanupTween()
  tween = gsap.fromTo(targets, from, {
    ...to,
    delay: toSeconds(props.delay),
    duration: toSeconds(props.duration),
    ease: props.ease,
    stagger: props.target === 'children' ? toSeconds(props.stagger) : 0,
    clearProps: 'opacity,transform',
  })
}

function setupVisibleTrigger() {
  const targets = getTargets()
  if (!el.value || !targets) return

  const { from } = getMotionVars()
  gsap.set(targets, from as CSSProperties)

  observer = new IntersectionObserver((entries) => {
    if (!entries[0]?.isIntersecting) return

    animate()

    if (props.once) {
      observer?.disconnect()
      observer = null
    }
  })

  observer.observe(el.value)
}

onMounted(async () => {
  await nextTick()

  if (props.disabled || props.preset === 'none' || prefersReducedMotion()) return

  if (props.trigger === 'visible') {
    setupVisibleTrigger()
    return
  }

  animate()
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
  cleanupTween()
})
</script>

<template>
  <component
    :is="tag"
    ref="el"
    :class="classes"
  >
    <slot />
  </component>
</template>
