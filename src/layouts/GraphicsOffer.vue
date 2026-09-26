<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  chooseGraphics,
  graphics,
  onGraphicsOffer,
  type GraphicsLevel,
} from '@/shared/lib/graphics'

/*
 * The offer of the light mode, when the page stutters (lib/graphics.ts decides
 * when). A note in the corner, not a dialog: the page goes on under it, and
 * nothing changes until the visitor answers. The answer is kept.
 */
const { t } = useI18n()
const open = ref(false)
let off = () => {}

onMounted(() => {
  open.value = graphics.offered
  off = onGraphicsOffer(() => (open.value = true))
})
onBeforeUnmount(() => off())

function answer(level: GraphicsLevel) {
  chooseGraphics(level)
  open.value = false
}
</script>

<template>
  <!-- always there, so the note is announced when it comes -->
  <div
    class="graphics-offer"
    aria-live="polite"
  >
    <Transition
      enter-active-class="graphics-offer__note--moving"
      leave-active-class="graphics-offer__note--moving"
      enter-from-class="graphics-offer__note--away"
      leave-to-class="graphics-offer__note--away"
    >
      <aside
        v-if="open"
        class="graphics-offer__note"
        :aria-label="t('home.graphics.label')"
      >
        <p class="graphics-offer__text">{{ t('home.graphics.offer') }}</p>
        <div class="graphics-offer__actions">
          <button
            class="graphics-offer__yes"
            type="button"
            @click="answer('low')"
          >
            {{ t('home.graphics.accept') }}
          </button>
          <button
            class="graphics-offer__no"
            type="button"
            @click="answer('high')"
          >
            {{ t('home.graphics.decline') }}
          </button>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
/** @define graphics-offer */
.graphics-offer {
  // the hero's paper, ink and seal
  --graphics-offer-paper: #ece8e1;
  --graphics-offer-ink: #101214;
  --graphics-offer-ink-soft: #3a4454;
  --graphics-offer-sun: #c73826;

  &__note {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 9400;
    max-width: 340px;
    padding: 16px 18px 14px;
    color: var(--graphics-offer-ink);
    background: var(--graphics-offer-paper);
    border: 1px solid rgb(16 18 20 / 16%);
    border-radius: 2px;
    box-shadow: 0 10px 30px rgb(16 18 20 / 18%);
  }

  &__text {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
    margin-top: 12px;
  }

  &__yes,
  &__no {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
  }

  &__yes {
    padding: 8px 14px;
    color: var(--graphics-offer-paper);
    background: var(--graphics-offer-sun);
    border: 0;
    border-radius: 2px;
  }

  &__no {
    padding: 0 0 2px;
    color: var(--graphics-offer-ink-soft);
    background: none;
    border: 0;
    border-bottom: 1px solid rgb(58 68 84 / 40%);
  }

  &__no:hover {
    color: var(--graphics-offer-ink);
    border-bottom-color: var(--graphics-offer-sun);
  }

  &__yes:focus-visible,
  &__no:focus-visible {
    outline: 2px solid var(--graphics-offer-sun);
    outline-offset: 3px;
  }

  @media (width <= 700px) {
    &__note {
      left: 16px;
      max-width: none;
    }
  }

  // it rises a little into place as it comes, and sinks back as it goes
  &__note--moving {
    transition:
      opacity 0.35s ease,
      transform 0.35s ease;
  }

  &__note--away {
    opacity: 0;
    transform: translateY(8px);
  }

  @media (prefers-reduced-motion: reduce) {
    &__note--moving {
      transition: none;
    }
  }
}
</style>
