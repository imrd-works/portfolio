<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { consent, onConsentChange, setConsent } from '@/shared/lib/consent'
import PopoverButton from '../PopoverButton/PopoverButton.vue'
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch.vue'

defineOptions({ name: 'UiConsentMenu' })

/*
 * A cookie that opens the visitor's consent to analytics (lib/consent.ts), so the
 * answer given in the banner can be changed at any time, either way.
 */
const { t } = useI18n()
const granted = ref(false)
let off = () => {}

onMounted(() => {
  granted.value = consent.granted
  off = onConsentChange((value) => (granted.value = value === 'granted'))
})
onBeforeUnmount(() => off())
</script>

<template>
  <PopoverButton
    class="consent-menu"
    :label="t('consent.label')"
  >
    <template #icon>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M21 12.6A9 9 0 1 1 11.4 3a3 3 0 0 0 3.6 3.6 3 3 0 0 0 3.4 3.4 3 3 0 0 0 2.6 2.6Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
        <circle
          cx="8.5"
          cy="10"
          r="1.1"
          fill="currentColor"
        />
        <circle
          cx="14.5"
          cy="15"
          r="1.1"
          fill="currentColor"
        />
        <circle
          cx="9"
          cy="16"
          r="1.1"
          fill="currentColor"
        />
      </svg>
    </template>

    <ToggleSwitch
      :model-value="granted"
      :label="t('consent.analytics')"
      :hint="t('consent.analyticsHint')"
      @update:model-value="(on) => setConsent(on ? 'granted' : 'denied')"
    />
  </PopoverButton>
</template>
