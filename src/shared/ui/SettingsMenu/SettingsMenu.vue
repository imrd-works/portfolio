<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  chooseClarity,
  chooseGraphics,
  clarityChoices,
  graphics,
  onGraphicsChange,
  type Clarity,
} from '@/shared/lib/graphics'
import PopoverButton from '../PopoverButton/PopoverButton.vue'
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch.vue'
import SegmentedSwitch from '../SegmentedSwitch/SegmentedSwitch.vue'

defineOptions({ name: 'UiSettingsMenu' })

/*
 * A gear that opens the page's settings (lib/graphics.ts): the light mode, on and
 * off, and the clarity the paintings are drawn at, on a dense screen, where the
 * visitor can keep every animation and trade a little sharpness for smoothness.
 * It is also the way back for a visitor who took the light mode when the page
 * offered it.
 */
const { t } = useI18n()
const light = ref(false)
const clarity = ref<Clarity>(2)
// only the clarities this screen can tell apart; on a 1x screen, none to choose
const clarities = ref<{ value: Clarity; label: string }[]>([])
let off = () => {}

function setLight(on: boolean) {
  chooseGraphics(on ? 'low' : 'high')
}

onMounted(() => {
  light.value = graphics.low
  clarity.value = graphics.clarity
  const choices = clarityChoices()
  clarities.value =
    choices.length > 1
      ? choices.map((c) => ({
          value: c,
          label: `×${t(`settings.clarityValue.${String(c).replace('.', '_')}`)}`,
        }))
      : []
  off = onGraphicsChange((level) => {
    light.value = level === 'low'
    clarity.value = graphics.clarity
  })
})
onBeforeUnmount(() => off())
</script>

<template>
  <PopoverButton
    class="settings-menu"
    :label="t('settings.label')"
    turn
  >
    <template #icon>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
        />
        <path
          d="M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-2.6-1.5L14.1 2.5h-4.2l-.4 2.5A7.6 7.6 0 0 0 6.9 6.5l-2.3-.9-2 3.4 2 1.5a7.7 7.7 0 0 0 0 3l-2 1.5 2 3.4 2.3-.9a7.6 7.6 0 0 0 2.6 1.5l.4 2.5h4.2l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.3.9 2-3.4-2-1.5Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
      </svg>
    </template>

    <ToggleSwitch
      :model-value="light"
      :label="t('settings.light')"
      :hint="t('settings.lightHint')"
      @update:model-value="setLight"
    />

    <SegmentedSwitch
      v-if="clarities.length"
      :model-value="clarity"
      :options="clarities"
      :label="t('settings.clarity')"
      :hint="t(light ? 'settings.clarityLight' : 'settings.clarityHint')"
      :disabled="light"
      @update:model-value="chooseClarity"
    />
  </PopoverButton>
</template>
