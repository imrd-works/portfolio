<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { consent, onConsentChange, setConsent, type ConsentValue } from '@/shared/lib/consent'

/*
 * The question about analytics (lib/consent.ts), for a visitor who has not answered
 * or answered half a year ago. A note in the corner, like the light mode's offer: the
 * page goes on under it, and nothing is counted until the visitor allows it. It is
 * shown after mounting only, so the prerendered page never has it.
 */
const { t } = useI18n()
const open = ref(false)
let off = () => {}

onMounted(() => {
  open.value = consent.analytics === null
  // answered elsewhere (the cookie's switch): nothing left to ask
  off = onConsentChange((value) => value && (open.value = false))
})
onBeforeUnmount(() => off())

function answer(value: ConsentValue) {
  open.value = false
  setConsent(value)
}
</script>

<template>
  <div
    class="consent-banner"
    aria-live="polite"
  >
    <Transition
      enter-active-class="consent-banner__note--moving"
      leave-active-class="consent-banner__note--moving"
      enter-from-class="consent-banner__note--away"
      leave-to-class="consent-banner__note--away"
    >
      <aside
        v-if="open"
        class="consent-banner__note"
        :aria-label="t('consent.label')"
      >
        <p class="consent-banner__text">{{ t('consent.text') }}</p>
        <div class="consent-banner__actions">
          <button
            class="consent-banner__yes"
            type="button"
            @click="answer('granted')"
          >
            {{ t('consent.accept') }}
          </button>
          <button
            class="consent-banner__no"
            type="button"
            @click="answer('denied')"
          >
            {{ t('consent.decline') }}
          </button>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
/** @define consent-banner */
.consent-banner {
  // the hero's paper, ink and seal
  --consent-banner-paper: #ece8e1;
  --consent-banner-ink: #101214;
  --consent-banner-ink-soft: #3a4454;
  --consent-banner-sun: #c73826;

  // placed by PageCorner, over the corner's buttons
  &__note {
    max-width: 360px;
    padding: 16px 18px 14px;
    color: var(--consent-banner-ink);
    background: var(--consent-banner-paper);
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
    color: var(--consent-banner-paper);
    background: var(--consent-banner-sun);
    border: 0;
    border-radius: 2px;
  }

  // refusing is as easy as allowing: a button of the same size, only quieter
  &__no {
    padding: 7px 13px;
    color: var(--consent-banner-ink);
    background: none;
    border: 1px solid rgb(16 18 20 / 35%);
    border-radius: 2px;
  }

  &__no:hover {
    border-color: var(--consent-banner-ink);
  }

  &__yes:focus-visible,
  &__no:focus-visible {
    outline: 2px solid var(--consent-banner-sun);
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
