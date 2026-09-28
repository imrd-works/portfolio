<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LocaleSwitch, ToggleSwitch } from '@/shared/ui'
import { useLocale } from '@/composables/useLocale'
import { localeUrlPath } from '@/app/config/site'
import { contactChannels } from '@/shared/config/contacts'
import { consent, onConsentChange, setConsent } from '@/shared/lib/consent'
import { policySections, serviceSources } from '../model/policy'
import { usePageSeo } from '../seo/usePageSeo'

/*
 * The privacy policy: what the site collects, why, and how to control it. A sheet
 * of the same paper as the rest of the site, one column, numbered sections. The
 * analytics section carries the consent switch itself, so the visitor can act on
 * what they have just read.
 */
usePageSeo()
const { t } = useI18n()
const { locale } = useLocale()

const key = (id: string, part: string) => `privacy.sections.${id}.${part}`
const lines = (text: string) => text.split('\n').filter(Boolean)
const number = (index: number) => String(index + 1).padStart(2, '0')

const granted = ref(false)
let off = () => {}

// Each section comes up through the paper as the reader gets to it, like words on
// wet paper. Whatever is on screen already when the page opens stays as it was
// painted (it was there before the scripts): only what is further down comes up.
// Without scripts, and with less motion, it is all simply there.
const live = ref(false)
const shown = reactive(new Set<string>())
let observer: IntersectionObserver | null = null
const sectionEls: HTMLElement[] = []
const watchSection = (el: unknown) => {
  if (el instanceof HTMLElement && !sectionEls.includes(el)) sectionEls.push(el)
}

onMounted(() => {
  granted.value = consent.granted
  off = onConsentChange((value) => (granted.value = value === 'granted'))

  if (typeof IntersectionObserver === 'undefined') return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  for (const el of sectionEls) {
    if (el.getBoundingClientRect().top < innerHeight) shown.add(el.dataset.section!)
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        shown.add((entry.target as HTMLElement).dataset.section!)
        observer?.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px' }
  )
  for (const el of sectionEls) if (!shown.has(el.dataset.section!)) observer.observe(el)
  live.value = true
})
onBeforeUnmount(() => {
  off()
  observer?.disconnect()
})
</script>

<template>
  <article
    class="privacy"
    :class="{ 'privacy--live': live }"
    data-ink-surface="paper"
  >
    <div class="privacy__sheet">
      <nav class="privacy__bar">
        <RouterLink
          class="privacy__back"
          :to="localeUrlPath(locale)"
        >
          <span aria-hidden="true">←</span> {{ t('privacy.back') }}
        </RouterLink>
        <LocaleSwitch class="privacy__lang" />
      </nav>

      <header class="privacy__head">
        <h1 class="privacy__title">{{ t('privacy.title') }}</h1>
        <p class="privacy__updated">{{ t('privacy.updated') }}</p>
        <p class="privacy__lead">{{ t('privacy.lead') }}</p>
      </header>

      <section
        v-for="(section, index) in policySections"
        :key="section.id"
        :ref="watchSection"
        class="privacy__section"
        :class="{ 'privacy__section--shown': shown.has(section.id) }"
        :data-section="section.id"
        :aria-labelledby="`privacy-${section.id}`"
      >
        <h2
          :id="`privacy-${section.id}`"
          class="privacy__heading"
        >
          <span
            class="privacy__number"
            aria-hidden="true"
            >{{ number(index) }}</span
          >
          {{ t(key(section.id, 'title')) }}
        </h2>

        <p
          v-if="section.text"
          class="privacy__text"
        >
          {{ t(key(section.id, 'text')) }}
        </p>

        <dl
          v-if="section.contacts"
          class="privacy__facts"
        >
          <div class="privacy__fact">
            <dt class="privacy__label">{{ t('privacy.contacts.email') }}</dt>
            <dd class="privacy__value">
              <a
                class="privacy__link"
                :href="`mailto:${contactChannels.email}`"
                >{{ contactChannels.email }}</a
              >
            </dd>
          </div>
          <div class="privacy__fact">
            <dt class="privacy__label">{{ t('privacy.contacts.telegram') }}</dt>
            <dd class="privacy__value">
              <a
                class="privacy__link"
                :href="contactChannels.telegramUrl"
                target="_blank"
                rel="noopener"
                >{{ contactChannels.telegramHandle }}</a
              >
            </dd>
          </div>
        </dl>

        <ul
          v-if="section.items"
          class="privacy__list"
        >
          <li
            v-for="item in lines(t(key(section.id, 'items')))"
            :key="item"
            class="privacy__item"
          >
            {{ item }}
          </li>
        </ul>

        <p
          v-if="section.note"
          class="privacy__text"
        >
          {{ t(key(section.id, 'note')) }}
        </p>

        <dl
          v-if="section.facts"
          class="privacy__facts"
        >
          <div
            v-for="fact in section.facts"
            :key="fact"
            class="privacy__fact"
          >
            <dt class="privacy__label">{{ t(key(section.id, `facts.${fact}.label`)) }}</dt>
            <dd class="privacy__value">{{ t(key(section.id, `facts.${fact}.text`)) }}</dd>
          </div>
        </dl>

        <template v-if="section.consent">
          <ToggleSwitch
            class="privacy__switch"
            :model-value="granted"
            :label="t('consent.analytics')"
            @update:model-value="(on) => setConsent(on ? 'granted' : 'denied')"
          />
          <p class="privacy__sources">
            <span class="privacy__label">{{ t('privacy.sources.label') }}</span>
            <a
              v-for="source in serviceSources"
              :key="source.id"
              class="privacy__link"
              :href="source.href"
              target="_blank"
              rel="noopener"
              >{{ t(`privacy.sources.${source.id}`) }}</a
            >
          </p>
        </template>
      </section>
    </div>
  </article>
</template>

<style lang="scss" scoped>
/** @define privacy */
.privacy {
  // the same paper and ink as the hero, the river and the work wall
  --privacy-paper: #ece8e1;
  --privacy-ink: #101214;
  --privacy-ink-soft: #3a4454;
  --privacy-text: #2a2f36;
  --privacy-seal: #c23b2a;
  --privacy-rule: rgb(58 68 84 / 22%);

  min-height: 100vh;
  min-height: var(--app-height, 100svh);
  padding: clamp(24px, 4vw, 48px) var(--page-pad) clamp(96px, 12vw, 160px);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: normal;
  color: var(--privacy-ink);
  background-color: var(--privacy-paper);
  -webkit-font-smoothing: antialiased;

  &__sheet {
    max-width: 760px;
    margin: 0 auto;
  }

  &__bar {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__back,
  &__lang {
    padding: 6px 0;
    color: var(--privacy-ink-soft);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition:
      color 0.2s,
      border-color 0.2s;
  }

  &__back:hover,
  &__lang:hover {
    color: var(--privacy-ink);
    border-bottom-color: var(--privacy-seal);
  }

  &__head {
    padding-bottom: clamp(32px, 5vw, 56px);
    margin-top: clamp(56px, 9vw, 120px);
    border-bottom: 1px solid var(--privacy-rule);
  }

  &__title {
    max-width: 16ch;
    margin: 0;
    font-family: var(--type-display);
    font-size: var(--type-title-size);
    font-weight: var(--type-title-weight);
    line-height: var(--type-title-leading);
    letter-spacing: var(--type-title-tracking);
  }

  &__updated {
    margin: 20px 0 0;
    font-size: 11px;
    color: var(--privacy-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__lead {
    max-width: 62ch;
    margin: 28px 0 0;
    font-size: 15px;
    line-height: 1.75;
    color: var(--privacy-text);
  }

  &__section {
    padding: clamp(32px, 5vw, 48px) 0;
    border-bottom: 1px solid var(--privacy-rule);
  }
  // not reached yet: blurred and faint, as ink not yet come through the paper...
  &--live &__section {
    filter: blur(6px);
    opacity: 0;
    transform: translateY(12px);
    transition:
      opacity 0.9s ease,
      filter 1.1s cubic-bezier(0.2, 0.7, 0.2, 1),
      transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  // ...then it comes through
  &--live &__section--shown {
    filter: none;
    opacity: 1;
    transform: none;
  }

  &__heading {
    display: flex;
    gap: 16px;
    align-items: baseline;
    margin: 0;
    font-family: var(--type-display);
    font-size: clamp(18px, 2vw, 22px);
    font-weight: 400;
    line-height: 1.3;
  }

  &__number {
    flex: none;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 12px;
    color: var(--privacy-seal);
    letter-spacing: 0.08em;
  }

  &__text,
  &__list,
  &__facts,
  &__switch,
  &__sources {
    max-width: 62ch;
    margin: 20px 0 0;
  }

  &__text,
  &__item,
  &__value {
    font-size: 14px;
    line-height: 1.75;
    color: var(--privacy-text);
  }

  &__list {
    padding: 0;
    list-style: none;
  }

  &__item {
    position: relative;
    padding-left: 24px;
  }

  &__item + &__item {
    margin-top: 6px;
  }

  &__item::before {
    position: absolute;
    left: 0;
    color: var(--privacy-seal);
    content: '—';
  }

  &__facts {
    display: grid;
    gap: 16px;
  }

  // the label in the margin, its text beside it; one under the other on a phone
  &__fact {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 16px;
  }

  &__label {
    padding-top: 4px;
    font-size: 11px;
    color: var(--privacy-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__value {
    margin: 0;
  }

  &__switch {
    max-width: 320px;
    margin-top: 28px;
  }

  &__sources {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    align-items: baseline;
    font-size: 13px;
  }

  &__link {
    color: var(--privacy-ink);
    text-decoration: none;
    border-bottom: 1px solid var(--privacy-rule);
    transition: border-color 0.2s;
  }

  &__link:hover {
    border-bottom-color: var(--privacy-seal);
  }

  &__back:focus-visible,
  &__lang:focus-visible,
  &__link:focus-visible {
    outline: 2px solid var(--privacy-seal);
    outline-offset: 3px;
  }

  @media (width <= 600px) {
    &__fact {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__back,
    &__lang,
    &__link {
      transition: none;
    }
  }
}
</style>
