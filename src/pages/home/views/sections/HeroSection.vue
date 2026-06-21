<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Motion, Text, Button } from '@/shared/ui'
import { contactChannels } from '../../model/portfolio'

const { t } = useI18n()
</script>

<template>
  <header
    id="top"
    class="hero"
  >
    <Motion
      preset="fade-up"
      trigger="mount"
      tag="div"
      class="hero__badge"
    >
      <span class="hero__pulse">
        <span class="hero__pulse-core"></span>
        <span class="hero__pulse-ring"></span>
      </span>
      <Text
        tag="span"
        variant="body-s"
        tone="secondary"
        class="hero__status"
      >
        {{ t('home.hero.status') }}
      </Text>
    </Motion>

    <Text
      tag="h1"
      variant="display-xl"
      class="hero__title"
    >
      <span class="hero__line">
        <span class="hero__word">{{ t('home.hero.firstName') }}</span>
      </span>
      <span class="hero__line">
        <span
          class="hero__word hero__word--accent"
          style="animation-delay: 0.12s"
        >
          {{ t('home.hero.lastName') }}
        </span>
      </span>
    </Text>

    <div class="hero__lead-wrap">
      <Text
        tag="p"
        variant="body-l"
        tone="secondary"
        class="hero__lead"
      >
        <i18n-t
          keypath="home.hero.lead"
          scope="global"
        >
          <template #accent>
            <span class="hero__serif">fullstack</span>
          </template>
        </i18n-t>
      </Text>
    </div>

    <div class="hero__actions">
      <Button
        v-magnetic
        tag="a"
        variant="brand"
        size="l"
        :href="contactChannels.telegramUrl"
        target="_blank"
        rel="noopener"
      >
        {{ t('home.hero.cta.telegram') }}
        <span aria-hidden="true">↗</span>
      </Button>
      <Button
        v-magnetic
        tag="a"
        variant="ghost"
        size="l"
        :href="`mailto:${contactChannels.email}`"
      >
        {{ t('home.hero.cta.email') }}
      </Button>
      <Button
        v-magnetic
        tag="a"
        variant="ghost"
        size="l"
        :href="contactChannels.resumeUrl"
      >
        {{ t('home.hero.cta.resume') }} <span class="hero__pdf">PDF</span>
      </Button>
    </div>

    <div
      class="hero__scroll"
      aria-hidden="true"
    >
      <span class="hero__scroll-label">{{ t('home.hero.scroll') }}</span>
      <span class="hero__scroll-line"></span>
    </div>
  </header>
</template>

<style lang="scss" scoped>
/** @define hero */
.hero {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: var(--layout-max-width);
  min-height: 100vh;
  padding: 140px clamp(20px, 5vw, 64px) 80px;
  margin: 0 auto;

  &__badge {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    align-self: flex-start;
    padding: 8px 16px;
    margin-bottom: 34px;
    background: var(--color-bg-surface-sunken);
    border: 1px solid var(--color-border-default);
    border-radius: 30px;
  }

  &__pulse {
    position: relative;
    width: 8px;
    height: 8px;
  }

  &__pulse-core,
  &__pulse-ring {
    position: absolute;
    inset: 0;
    background: var(--color-success);
    border-radius: 50%;
  }

  &__pulse-ring {
    animation: pulse-ring 2s infinite;
  }

  &__title {
    max-width: 100%;
  }

  &__line {
    display: inline-block;
    max-width: 100%;
    padding-bottom: 0.06em;
    overflow: hidden;
  }

  &__word {
    display: inline-block;
    white-space: nowrap;
    animation: rise-in 0.95s cubic-bezier(0.16, 0.85, 0.3, 1) both;

    &--accent {
      background: var(--gradient-shimmer);
      background-size: 200% auto;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation:
        rise-in 0.95s cubic-bezier(0.16, 0.85, 0.3, 1) both,
        shimmer 6s linear infinite;
    }
  }

  &__lead-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    align-items: flex-end;
    max-width: 880px;
    margin-top: 38px;
  }

  &__lead {
    max-width: 560px;
  }

  &__serif {
    font-family: var(--font-family-serif);
    font-size: 1.18em;
    font-style: italic;
    color: var(--color-accent-soft);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 46px;
  }

  &__pdf {
    color: var(--color-accent);
  }

  &__scroll {
    position: absolute;
    bottom: 34px;
    left: 50%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    color: var(--color-text-muted);
    transform: translateX(-50%);
  }

  &__scroll-label {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  &__scroll-line {
    width: 1px;
    height: 42px;
    background: linear-gradient(var(--color-accent), transparent);
  }
}
</style>
