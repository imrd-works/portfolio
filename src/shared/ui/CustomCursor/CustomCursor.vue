<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ name: 'UiCustomCursor' })

const ring = ref<HTMLElement | null>(null)
const dot = ref<HTMLElement | null>(null)

let raf = 0
const pos = { x: 0, y: 0 }
const cur = { x: 0, y: 0 }

const INTERACTIVE = 'a, button, input, textarea, select, [data-cursor-grow]'

function onMove(event: MouseEvent) {
  pos.x = event.clientX
  pos.y = event.clientY
  if (dot.value) {
    dot.value.style.transform = `translate(${pos.x}px, ${pos.y}px)`
  }
}

function grow() {
  const el = ring.value
  if (!el) return
  el.style.width = '56px'
  el.style.height = '56px'
  el.style.margin = '-28px 0 0 -28px'
  el.style.background = 'rgb(167 139 250 / 12%)'
}

function shrink() {
  const el = ring.value
  if (!el) return
  el.style.width = '34px'
  el.style.height = '34px'
  el.style.margin = '-17px 0 0 -17px'
  el.style.background = 'transparent'
}

function onOver(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest(INTERACTIVE)) grow()
}

function onOut(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest(INTERACTIVE)) shrink()
}

function loop() {
  cur.x += (pos.x - cur.x) * 0.16
  cur.y += (pos.y - cur.y) * 0.16
  if (ring.value) {
    ring.value.style.transform = `translate(${cur.x}px, ${cur.y}px)`
  }
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  if (!window.matchMedia('(hover: hover)').matches) return
  pos.x = window.innerWidth / 2
  pos.y = window.innerHeight / 2
  cur.x = pos.x
  cur.y = pos.y
  window.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('mouseover', onOver)
  window.addEventListener('mouseout', onOut)
  loop()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseover', onOver)
  window.removeEventListener('mouseout', onOut)
})
</script>

<template>
  <div aria-hidden="true">
    <div
      ref="ring"
      class="custom-cursor custom-cursor--ring"
    ></div>
    <div
      ref="dot"
      class="custom-cursor custom-cursor--dot"
    ></div>
  </div>
</template>

<style lang="scss" scoped>
/** @define custom-cursor */
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  border-radius: 50%;
  pointer-events: none;
  mix-blend-mode: screen;
  will-change: transform;

  &--ring {
    width: 34px;
    height: 34px;
    margin: -17px 0 0 -17px;
    border: 1px solid rgb(167 139 250 / 90%);
    transition:
      width 0.25s,
      height 0.25s,
      margin 0.25s,
      background 0.25s;
  }

  &--dot {
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    background: var(--color-accent-soft);
  }
}
</style>
