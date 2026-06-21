<script setup lang="ts">
defineProps<{
  num: string
  label: string
}>()
</script>

<template>
  <div class="eyebrow">
    <span class="eyebrow__num">{{ num }}</span>
    <span class="eyebrow__line"></span>
    <span class="eyebrow__label">{{ label }}</span>
  </div>
</template>

<style lang="scss" scoped>
/** @define eyebrow */
.eyebrow {
  display: flex;
  gap: 14px;
  align-items: center;

  &__num {
    font-family: var(--font-family-display);
    font-size: 13px;
    letter-spacing: 3px;
    color: var(--color-accent);
    text-transform: uppercase;
  }

  &__line {
    width: 46px;
    height: 1px;
    background: rgb(167 139 250 / 50%);
  }

  &__label {
    font-size: 13px;
    letter-spacing: 3px;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }
}
</style>
