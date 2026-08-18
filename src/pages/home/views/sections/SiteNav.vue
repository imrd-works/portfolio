<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'
import { sectionNav } from '../../model/portfolio'

const { t } = useI18n()
const { other, pathFor } = useLocale()
</script>

<template>
  <nav
    class="site-nav"
    :aria-label="t('home.nav.label')"
  >
    <a
      v-magnetic
      href="#top"
      class="site-nav__brand"
    >
      <span class="site-nav__mark">{{ t('home.brand.mark') }}</span>
      <span class="site-nav__name">{{ t('home.brand.name') }}</span>
    </a>

    <div class="site-nav__right">
      <a
        v-for="id in sectionNav"
        :key="id"
        :href="`#${id}`"
        class="site-nav__link"
      >
        {{ t(`home.nav.${id}`) }}
      </a>

      <!-- A real link, not a toggle button: the other language is a separate
           URL, so crawlers follow it and visitors can share it. -->
      <RouterLink
        v-magnetic
        class="site-nav__lang"
        :to="pathFor(other)"
        :hreflang="other"
        :aria-label="t(`home.nav.switchTo.${other}`)"
      >
        {{ other.toUpperCase() }}
        <span
          class="site-nav__dot"
          aria-hidden="true"
        ></span>
      </RouterLink>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
/** @define site-nav */
.site-nav {
  position: fixed;
  inset: 0 0 auto;
  z-index: 7000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px clamp(20px, 5vw, 64px);
  background: linear-gradient(180deg, rgb(7 6 15 / 72%), rgb(7 6 15 / 0%));
  backdrop-filter: blur(14px);

  &__brand {
    display: flex;
    gap: 11px;
    align-items: center;
    color: var(--color-text-primary);
    text-decoration: none;
  }

  &__mark {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    font-family: var(--font-family-display);
    font-size: 18px;
    font-weight: 800;
    color: var(--color-bg-canvas);
    background: var(--gradient-primary);
    border-radius: 11px;
    box-shadow: var(--shadow-glow-soft);
  }

  &__name {
    font-family: var(--font-family-display);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  &__right {
    display: flex;
    gap: clamp(14px, 2.4vw, 34px);
    align-items: center;
  }

  &__link {
    display: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-tertiary);
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: var(--color-text-primary);
    }

    @media (min-width: 860px) {
      display: inline;
    }
  }

  &__lang {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 7px 14px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-decoration: none;
    letter-spacing: 1px;
    background: var(--color-bg-surface-sunken);
    border: 1px solid var(--color-border-default);
    border-radius: 30px;
    transition:
      color 0.3s,
      border-color 0.3s;

    &:hover {
      color: var(--color-text-primary);
      text-decoration: none;
      border-color: rgb(167 139 250 / 55%);
    }
  }

  &__dot {
    width: 5px;
    height: 5px;
    background: var(--color-accent);
    border-radius: 50%;
  }
}
</style>
