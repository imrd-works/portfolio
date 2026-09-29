<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  chooseClarity,
  chooseGraphics,
  declineOffer,
  graphics,
  onGraphicsOffer,
  type GraphicsOffer,
} from '@/shared/lib/graphics'

/*
 * What the page offers when it stutters (lib/graphics.ts decides when and what):
 * on a dense screen first a lower clarity, which keeps every animation, then the
 * light mode if the page still stutters. A note in the corner, not a dialog: the
 * page goes on under it, and nothing changes until the visitor answers. The
 * answer is kept; turned down, nothing is offered again.
 */
const { t } = useI18n()
const kind = ref<GraphicsOffer | null>(null)
let off = () => {}

// the copy for what is offered: home.graphics.* for the light mode, .clarity.* for the
// clarity, .weak.* for both at once on a device weak by its hints
const copy = computed(() =>
  kind.value === 'clarity'
    ? 'home.graphics.clarity'
    : kind.value === 'weak'
      ? 'home.graphics.weak'
      : 'home.graphics'
)

onMounted(() => {
  kind.value = graphics.offered
  off = onGraphicsOffer((next) => (kind.value = next))
})
onBeforeUnmount(() => off())

function accept() {
  if (kind.value === 'clarity') chooseClarity(1)
  else {
    // the weak device's offer lowers the clarity too, so it stays soft if the light
    // mode is turned off again
    if (kind.value === 'weak') chooseClarity(1)
    chooseGraphics('low')
  }
  kind.value = null
}

function decline() {
  declineOffer()
  kind.value = null
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
        v-if="kind"
        :key="kind"
        class="graphics-offer__note"
        data-no-ink
        :aria-label="t(`${copy}.label`)"
      >
        <p class="graphics-offer__text">{{ t(`${copy}.offer`) }}</p>
        <div class="graphics-offer__actions">
          <button
            class="graphics-offer__yes"
            type="button"
            @click="accept"
          >
            {{ t(`${copy}.accept`) }}
          </button>
          <button
            class="graphics-offer__no"
            type="button"
            @click="decline"
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

  // placed by PageCorner, over the settings gear
  &__note {
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
