<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PageSection, Grid, Motion, Text, CountUp } from '@/shared/ui'
import { stats } from '../../model/portfolio'
import SectionEyebrow from './SectionEyebrow.vue'

const { t } = useI18n()
</script>

<template>
  <PageSection
    id="about"
    relative
    padding-top="band"
    padding-bottom="band"
  >
    <Grid
      columns="1.3fr 0.9fr"
      gap="5xl"
      stack="md"
      align="start"
    >
      <Motion
        preset="fade-up"
        trigger="visible"
        tag="div"
      >
        <div class="about__eyebrow">
          <SectionEyebrow
            num="01"
            :label="t('home.about.eyebrow')"
          />
        </div>

        <Text
          tag="h2"
          variant="display-m"
          class="about__title"
        >
          <i18n-t
            keypath="home.about.title"
            scope="global"
          >
            <template #accent>
              <span class="about__title-accent">{{ t('home.about.titleAccent') }}</span>
            </template>
          </i18n-t>
        </Text>

        <Text
          tag="p"
          variant="body-l"
          tone="secondary"
          class="about__text"
        >
          {{ t('home.about.p1') }}
        </Text>
        <Text
          tag="p"
          variant="body-m"
          tone="tertiary"
          class="about__text"
        >
          {{ t('home.about.p2') }}
        </Text>

        <Motion
          preset="fade-up"
          trigger="visible"
          target="children"
          :stagger="80"
          tag="div"
          class="about__stats"
        >
          <div
            v-for="stat in stats"
            :key="stat.id"
            class="about__stat"
          >
            <div class="about__stat-value">
              <CountUp
                :to="stat.value"
                :suffix="stat.suffix"
              />
            </div>
            <Text
              tag="div"
              variant="body-s"
              tone="tertiary"
              class="about__stat-label"
            >
              {{ t(`home.about.stats.${stat.id}`) }}
            </Text>
          </div>
        </Motion>
      </Motion>

      <Motion
        preset="fade-up"
        trigger="visible"
        :delay="120"
        tag="div"
        class="about__aside"
      >
        <div
          v-tilt
          class="about__portrait"
        >
          <span class="about__portrait-glow"></span>
          <div class="about__portrait-frame">
            <img
              class="about__portrait-image"
              src="/avatar.webp"
              :alt="t('home.about.photo')"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="about__portrait-badge">
            <span class="about__portrait-dot"></span>
            <Text
              tag="span"
              variant="body-s"
              tone="secondary"
              class="about__portrait-text"
            >
              {{ t('home.about.badge') }}
            </Text>
          </div>
        </div>
      </Motion>
    </Grid>
  </PageSection>
</template>

<style lang="scss" scoped>
/** @define about */
.about__eyebrow {
  margin-bottom: 30px;
}

.about__title {
  margin: 0 0 26px;

  &-accent {
    background: var(--gradient-accent);
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.about__text {
  max-width: 560px;
  margin: 0 0 18px;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.about__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  max-width: 560px;
  margin-top: 44px;
}

.about__stat {
  padding: 22px 18px;
  background: var(--color-bg-surface-sunken);
  border: 1px solid var(--color-border-subtle);
  border-radius: 18px;
}

.about__stat-value {
  font-family: var(--font-family-display);
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 800;
  background: var(--gradient-accent);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.about__stat-label {
  margin-top: 4px;
}

.about__aside {
  display: flex;
  justify-content: center;
}

.about__portrait {
  position: relative;
  width: min(340px, 80vw);
  aspect-ratio: 4 / 5;
  will-change: transform;
}

.about__portrait-glow {
  position: absolute;
  inset: -14px;
  background: linear-gradient(135deg, rgb(99 102 241 / 50%), rgb(167 139 250 / 20%), transparent);
  filter: blur(26px);
  border-radius: 28px;
}

.about__portrait-frame {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-card);
}

.about__portrait-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 42%;
}

.about__portrait-badge {
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 14px 16px;
  pointer-events: none;
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border-default);
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.about__portrait-dot {
  flex: none;
  width: 8px;
  height: 8px;
  background: var(--color-success);
  border-radius: 50%;
  animation: blink 2s infinite;
}
</style>
