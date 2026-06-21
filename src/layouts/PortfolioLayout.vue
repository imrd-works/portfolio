<script setup lang="ts">
import { AuroraBackdrop, CustomCursor, ScrollProgress } from '@/shared/ui'
</script>

<template>
  <div class="portfolio-layout">
    <ScrollProgress />
    <AuroraBackdrop />
    <CustomCursor />
    <main class="portfolio-layout__main">
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
  min-height: 100vh;
  overflow: hidden;
  color: var(--color-text-primary);
  background: var(--color-bg-canvas);

  &__main {
    position: relative;
    z-index: 2;
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
