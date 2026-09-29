<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

/*
 * The seal between two sections, as the one that closes the river: stamped on
 * the paper when the reader gets to it. It stands in the middle of the gap, the
 * sections on either side keeping equal room to it. Without scripts, and for a
 * reader who asked for less motion, it is simply there.
 */
const { t } = useI18n()
const stamp = useTemplateRef<HTMLElement>('stamp')
const waiting = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  const el = stamp.value
  if (!el || !('IntersectionObserver' in window)) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  waiting.value = true
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      waiting.value = false
      observer?.disconnect()
    },
    { rootMargin: '0px 0px -25% 0px' }
  )
  observer.observe(el)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    class="section-seal"
    data-ink-surface="paper"
    aria-hidden="true"
  >
    <span
      ref="stamp"
      class="section-seal__stamp"
      :class="{ 'section-seal__stamp--waiting': waiting }"
      >{{ t('home.hero.seal') }}</span
    >
  </div>
</template>

<style lang="scss" scoped>
/** @define section-seal */
.section-seal {
  --section-seal-paper: #ece8e1;
  --section-seal-ink: #c23b2a;

  display: flex;
  justify-content: center;
  padding: 0 var(--page-pad);
  background-color: var(--section-seal-paper);

  // the river's seal: cinnabar pressed into the paper, its edge made rough by the
  // hero's filter, a little askew
  &__stamp {
    display: grid;
    place-items: center;
    width: 60px;
    aspect-ratio: 1;
    font-family: Unbounded, sans-serif;
    font-size: 20px;
    font-weight: 500;
    color: var(--section-seal-paper);
    letter-spacing: -0.04em;
    background: var(--section-seal-ink);
    filter: url('#hero-rough');
    border-radius: 4px;
    opacity: 0.92;
    mix-blend-mode: multiply;
    transform: rotate(4deg) scale(1);
    transition:
      opacity 0.12s linear,
      transform 0.28s cubic-bezier(0.2, 1.4, 0.4, 1);
  }

  // lifted over the paper until the reader comes to it
  &__stamp--waiting {
    opacity: 0;
    transform: rotate(4deg) scale(1.5);
    transition: none;
  }
}
</style>
