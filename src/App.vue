<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import ToasterLazy from '@/shared/components/ToasterLazy.vue'

// Freeze the visible viewport height into a CSS variable. In-app browsers
// (Telegram, etc.) resize the WebView when their toolbar shows/hides on
// scroll, which makes `100vh` content reflow and jitter. We expose a stable
// `--app-height` and only recompute it on a real layout change (rotation /
// width change), never on the scroll-driven height changes.
let lastWidth = 0

function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
  lastWidth = window.innerWidth
}

function onResize() {
  // Ignore height-only changes (toolbar collapse). Only react when the width
  // also changes, e.g. an orientation change or a real window resize.
  if (window.innerWidth !== lastWidth) setAppHeight()
}

onMounted(() => {
  setAppHeight()
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('orientationchange', setAppHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('orientationchange', setAppHeight)
})
</script>

<template>
  <router-view />
  <ToasterLazy />
</template>
