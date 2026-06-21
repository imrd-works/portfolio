<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PageSection, Grid, Motion, Text, Button } from '@/shared/ui'
import { projects } from '../../model/portfolio'
import SectionEyebrow from './SectionEyebrow.vue'

const { t } = useI18n()
</script>

<template>
  <PageSection
    id="work"
    relative
    padding-top="none"
    padding-bottom="band"
  >
    <Motion
      preset="fade-up"
      trigger="visible"
      tag="div"
      class="work__head"
    >
      <SectionEyebrow
        num="03"
        :label="t('home.work.eyebrow')"
      />
      <Text
        tag="h2"
        variant="display-m"
        class="work__title"
        >{{ t('home.work.title') }}</Text
      >
    </Motion>

    <Grid
      columns="1fr 1fr"
      gap="2xl"
      stack="md"
    >
      <Motion
        v-for="(project, index) in projects"
        :key="project.id"
        preset="fade-up"
        trigger="visible"
        :delay="index * 100"
        tag="article"
        class="work__card"
      >
        <div
          v-tilt
          class="work__thumb"
        >
          <img
            v-if="project.image"
            class="work__image"
            :src="project.image"
            :alt="t(`home.work.items.${project.id}.imageAlt`)"
            loading="lazy"
            decoding="async"
          />
          <Text
            tag="span"
            variant="body-s"
            tone="tertiary"
            class="work__placeholder"
          >
            {{ t(`home.work.items.${project.id}.placeholder`) }}
          </Text>
          <div
            v-if="!project.href"
            class="work__nda-badge"
          >
            <span class="work__nda-dot"></span>
            <Text
              tag="span"
              variant="body-s"
              tone="secondary"
              class="work__nda-text"
            >
              {{ t('home.work.nda') }}
            </Text>
          </div>
        </div>
        <div class="work__row">
          <div>
            <Text
              tag="h3"
              variant="heading-l"
              class="work__name"
              >{{ t(`home.work.items.${project.id}.title`) }}</Text
            >
            <Text
              tag="p"
              variant="body-s"
              tone="tertiary"
              class="work__desc"
            >
              {{ t(`home.work.items.${project.id}.desc`) }}
            </Text>
          </div>
          <Button
            v-if="project.href"
            v-magnetic
            tag="a"
            variant="outline"
            :href="project.href"
            class="work__open"
            :aria-label="`${t('home.work.open')}: ${t(`home.work.items.${project.id}.title`)}`"
          >
            <span aria-hidden="true">↗</span>
          </Button>
        </div>
        <div class="work__tags">
          <span
            v-for="tag in project.tags"
            :key="tag"
            class="work__tag"
            >{{ tag }}</span
          >
        </div>
      </Motion>
    </Grid>
  </PageSection>
</template>

<style lang="scss" scoped>
/** @define work */
.work__head {
  margin-bottom: 48px;
}

.work__title {
  max-width: 760px;
  margin-top: 14px;
}

.work__thumb {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 11;
  overflow: hidden;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: 22px;
  will-change: transform;
}

.work__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  border-radius: inherit;
  transform: scale(1.04);
  transition:
    opacity 0.45s ease,
    transform 0.8s cubic-bezier(0.16, 0.8, 0.3, 1);
}

.work__placeholder {
  position: relative;
  z-index: 1;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.work__thumb:hover .work__image {
  opacity: 1;
  transform: scale(1);
}

.work__thumb:hover .work__placeholder {
  opacity: 0;
  transform: translateY(8px);
}

.work__nda-badge {
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  z-index: 2;
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

@media (hover: none) {
  .work__image {
    opacity: 1;
    transform: scale(1);
  }

  .work__placeholder {
    opacity: 0;
  }
}

.work__nda-dot {
  flex: none;
  width: 8px;
  height: 8px;
  background: var(--color-accent);
  border-radius: 50%;
}

.work__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-top: 22px;
}

.work__name {
  margin: 0 0 8px;
}

.work__desc {
  max-width: 380px;
}

.work__open {
  flex: none;
  width: 50px;
  height: 50px;
  padding: 0;
  font-size: 18px;
  border-radius: 50%;
}

.work__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.work__tag {
  padding: 5px 11px;
  font-size: 12px;
  color: var(--color-accent);
  border: 1px solid rgb(167 139 250 / 30%);
  border-radius: 20px;
}
</style>
