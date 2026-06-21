<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ name: 'UiAuroraBackdrop' })

const spot = ref<HTMLElement | null>(null)

function onMove(event: MouseEvent) {
  const el = spot.value
  if (!el) return
  el.style.opacity = '1'
  el.style.background = `radial-gradient(440px circle at ${event.clientX}px ${event.clientY}px, rgb(167 139 250 / 10%), transparent 70%)`
}

onMounted(() => {
  if (window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', onMove, { passive: true })
  }
})

onBeforeUnmount(() => window.removeEventListener('mousemove', onMove))
</script>

<template>
  <div
    class="aurora"
    aria-hidden="true"
  >
    <div class="aurora__field">
      <span class="aurora__blob aurora__blob--a"></span>
      <span class="aurora__blob aurora__blob--b"></span>
      <span class="aurora__blob aurora__blob--c"></span>
      <span class="aurora__grid"></span>
    </div>
    <div
      ref="spot"
      class="aurora__spot"
    ></div>
    <div class="aurora__grain"></div>
  </div>
</template>

<style lang="scss" scoped>
/** @define aurora */
.aurora {
  &__field {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }

  &__blob {
    position: absolute;
    width: 46vw;
    height: 46vw;
    border-radius: 50%;
    filter: blur(70px);

    &--a {
      top: -12%;
      left: -6%;
      background: radial-gradient(circle at 30% 30%, rgb(99 102 241 / 55%), transparent 65%);
      animation: aurora-a 22s ease-in-out infinite;
    }

    &--b {
      top: 30%;
      right: -10%;
      width: 42vw;
      height: 42vw;
      background: radial-gradient(circle at 50% 50%, rgb(167 139 250 / 45%), transparent 65%);
      filter: blur(80px);
      animation: aurora-b 26s ease-in-out infinite;
    }

    &--c {
      bottom: -15%;
      left: 25%;
      width: 40vw;
      height: 40vw;
      background: radial-gradient(circle at 50% 50%, rgb(91 141 239 / 40%), transparent 65%);
      filter: blur(80px);
      animation: aurora-c 30s ease-in-out infinite;
    }
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgb(255 255 255 / 3.5%) 1px, transparent 1px);
    background-size: 46px 46px;
    mask-image: radial-gradient(ellipse at 50% 30%, #000, transparent 80%);
  }

  &__spot {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: radial-gradient(420px circle at 50% 50%, rgb(167 139 250 / 10%), transparent 70%);
    opacity: 0;
    transition: opacity 0.5s;
  }

  &__grain {
    position: fixed;
    inset: 0;
    z-index: 8000;
    pointer-events: none;
    opacity: 0.05;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  }
}
</style>
