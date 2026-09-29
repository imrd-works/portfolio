<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import RoundButton from '../RoundButton/RoundButton.vue'

defineOptions({ name: 'UiScrollTopButton' })

/*
 * The way back to the top of the page in one click. The page glides up (at once
 * for a reader who asked for less motion), and the focus goes to the top of the
 * content, so the keyboard carries on from there and not from the bottom.
 */
const { t } = useI18n()

function toTop() {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
  document.getElementById('main-content')?.focus({ preventScroll: true })
}
</script>

<template>
  <RoundButton
    :label="t('toTop')"
    @click="toTop"
  >
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 19V5M5.5 11.5 12 5l6.5 6.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </RoundButton>
</template>
