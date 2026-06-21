<script setup lang="ts">
defineOptions({ name: 'UiTicker' })

withDefaults(
  defineProps<{
    items: string[]
    duration?: number
    separator?: string
  }>(),
  {
    duration: 30,
    separator: '✦',
  }
)

const COPIES = [0, 1, 2]
</script>

<template>
  <div class="ticker">
    <div
      class="ticker__track"
      :style="{ animationDuration: `${duration}s` }"
    >
      <div
        v-for="copy in COPIES"
        :key="copy"
        class="ticker__group"
        aria-hidden="true"
      >
        <template
          v-for="(item, index) in items"
          :key="`${copy}-${index}`"
        >
          <span class="ticker__item">{{ item }}</span>
          <span class="ticker__sep">{{ separator }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/** @define ticker */
.ticker {
  position: relative;
  z-index: 2;
  padding: 20px 0;
  overflow: hidden;
  background: rgb(6 5 13 / 45%);
  backdrop-filter: blur(6px);
  border-top: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);

  &__track {
    display: flex;
    width: max-content;
    white-space: nowrap;
    animation: marquee linear infinite;
  }

  &__group {
    display: flex;
    flex: none;
    gap: 54px;
    align-items: center;
    padding-right: 54px;
  }

  &__item {
    font-family: var(--font-family-display);
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-faint);
  }

  &__sep {
    color: var(--color-accent);
  }
}
</style>
