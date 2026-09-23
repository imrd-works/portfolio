<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AuroraBackdrop, CustomCursor } from '@/shared/ui'

const { t } = useI18n()
</script>

<template>
  <div class="portfolio-layout">
    <!-- First tab stop on the page: lets keyboard and screen-reader users
         jump past the fixed navigation straight into the content. -->
    <a
      class="portfolio-layout__skip"
      href="#main-content"
    >
      {{ t('home.a11y.skip') }}
    </a>

    <AuroraBackdrop />
    <CustomCursor />
    <main
      id="main-content"
      class="portfolio-layout__main"
      tabindex="-1"
    >
      <router-view v-slot="{ Component }">
        <transition
          name="fade"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style lang="scss" scoped>
/** @define portfolio-layout */
.portfolio-layout {
  position: relative;
  min-height: 100vh; // fallback for browsers without svh / JS
  min-height: var(--app-height, 100svh);
  // `clip`, not `hidden`: it trims the same overflow without turning the
  // layout into a scroll container, which would break the sticky hero stage.
  overflow: clip;
  color: var(--color-text-primary);
  background: var(--color-bg-canvas);

  &__skip {
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 9500;
    padding: 10px 16px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 12px;
    color: #ece8e1;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: #101214;
    border-radius: 2px;
    transform: translateY(-200%);
    transition: transform 0.2s ease;

    &:focus-visible {
      transform: translateY(0);
    }
  }

  &__main {
    position: relative;
    z-index: 2;

    &:focus {
      outline: none;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
