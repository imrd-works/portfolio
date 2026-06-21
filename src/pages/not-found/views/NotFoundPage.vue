<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AuroraBackdrop, Button, Motion, Text } from '@/shared/ui'
import { usePageSeo } from '../seo/usePageSeo'

usePageSeo()
const router = useRouter()
const { t } = useI18n()

function goHome() {
  router.push({ name: 'Home' })
}
</script>

<template>
  <div class="not-found-page">
    <AuroraBackdrop />

    <main class="not-found-page__content">
      <div class="not-found-page__card">
        <Text
          tag="h1"
          variant="display-xl"
          class="not-found-page__code"
        >
          404
        </Text>

        <Motion
          preset="fade-up"
          trigger="mount"
          :delay="120"
          tag="div"
          class="not-found-page__details"
        >
          <Text
            tag="p"
            variant="body-l"
            tone="secondary"
            class="not-found-page__text"
          >
            {{ t('notFound.text') }}
          </Text>

          <Button
            v-magnetic
            variant="brand"
            size="l"
            @click="goHome"
          >
            <span aria-hidden="true">←</span>
            {{ t('notFound.btnHome') }}
          </Button>
        </Motion>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
/** @define not-found-page */
.not-found-page {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  color: var(--color-text-primary);
  background: var(--color-bg-canvas);

  &__content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100svh;
    max-width: var(--layout-max-width);
    padding: 120px clamp(20px, 5vw, 64px);
    margin: 0 auto;
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(100%, 720px);
    padding: clamp(44px, 7vw, 76px) clamp(24px, 6vw, 64px);
    text-align: center;
    background: var(--color-bg-glass);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-card);
    box-shadow: 0 24px 80px rgb(0 0 0 / 25%);
    backdrop-filter: blur(4px);
  }

  &__code {
    padding-bottom: 0.06em;
    line-height: 0.86;
    background: var(--gradient-shimmer);
    background-size: 200% auto;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation:
      rise-in 0.95s cubic-bezier(0.16, 0.85, 0.3, 1) both,
      shimmer 6s linear infinite;
  }

  &__details {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 38px;
  }

  &__text {
    max-width: 560px;
    margin-bottom: 42px;
  }
}

@media (max-width: 540px) {
  .not-found-page__content {
    padding-block: 96px;
  }
}
</style>
