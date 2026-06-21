<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PageSection, Grid, Motion, Text } from '@/shared/ui'
import { useInView } from '@/composables/useInView'
import { timeline, services } from '../../model/portfolio'
import SectionEyebrow from './SectionEyebrow.vue'

const { t } = useI18n()
const { targetRef: line, inView: lineVisible } = useInView({ threshold: 0.2 })
</script>

<template>
  <PageSection
    id="path"
    relative
    padding-top="none"
    padding-bottom="band"
  >
    <Grid
      columns="1.1fr 0.9fr"
      gap="5xl"
      stack="md"
      align="start"
    >
      <div>
        <Motion
          preset="fade-up"
          trigger="visible"
          tag="div"
          class="exp__head"
        >
          <SectionEyebrow
            num="04"
            :label="t('home.experience.eyebrow')"
          />
          <Text
            tag="h2"
            variant="display-s"
            class="exp__title"
          >
            {{ t('home.experience.title') }}
          </Text>
        </Motion>

        <Motion
          preset="fade-up"
          trigger="visible"
          tag="div"
        >
          <div
            :ref="line"
            class="exp__timeline"
          >
            <div class="exp__rail">
              <div
                class="exp__rail-fill"
                :style="{ height: lineVisible ? '100%' : '0%' }"
              ></div>
            </div>
            <div
              v-for="entry in timeline"
              :key="entry.id"
              class="exp__entry"
            >
              <span
                class="exp__node"
                :style="{ background: entry.dot }"
              ></span>
              <div class="exp__period">{{ t(`home.experience.items.${entry.id}.period`) }}</div>
              <Text
                tag="h4"
                variant="heading-m"
                class="exp__role"
              >
                {{ t(`home.experience.items.${entry.id}.role`) }}
              </Text>
              <Text
                tag="p"
                variant="body-s"
                tone="tertiary"
                class="exp__desc"
              >
                {{ t(`home.experience.items.${entry.id}.desc`) }}
              </Text>
            </div>
          </div>
        </Motion>
      </div>

      <div>
        <Motion
          preset="fade-up"
          trigger="visible"
          tag="div"
          class="exp__head"
        >
          <SectionEyebrow
            num="05"
            :label="t('home.services.eyebrow')"
          />
          <Text
            tag="h2"
            variant="display-s"
            class="exp__title"
          >
            {{ t('home.services.title') }}
          </Text>
        </Motion>

        <Motion
          preset="fade-up"
          trigger="visible"
          target="children"
          :stagger="60"
          tag="div"
          class="exp__services"
        >
          <div
            v-for="id in services"
            :key="id"
            class="exp__service"
          >
            <div class="exp__service-head">
              <span class="exp__service-mark">↳</span>
              <Text
                tag="h4"
                variant="heading-m"
                class="exp__service-title"
              >
                {{ t(`home.services.items.${id}.title`) }}
              </Text>
            </div>
            <Text
              tag="p"
              variant="body-s"
              tone="tertiary"
              class="exp__service-desc"
            >
              {{ t(`home.services.items.${id}.desc`) }}
            </Text>
          </div>
        </Motion>
      </div>
    </Grid>
  </PageSection>
</template>

<style lang="scss" scoped>
/** @define exp */
.exp__head {
  margin-bottom: 40px;
}

.exp__title {
  margin-top: 14px;
}

.exp__timeline {
  position: relative;
  padding-left: 34px;
}

.exp__rail {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 7px;
  width: 2px;
  background: var(--color-border-subtle);
}

.exp__rail-fill {
  width: 100%;
  background: linear-gradient(
    var(--color-accent-strong),
    var(--color-accent),
    var(--color-accent-alt)
  );
  transition: height 1.4s cubic-bezier(0.16, 0.8, 0.3, 1);
}

.exp__entry {
  position: relative;
  margin-bottom: 38px;

  &:last-child {
    margin-bottom: 0;
  }
}

.exp__node {
  position: absolute;
  top: 4px;
  left: -34px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 0 0 5px rgb(167 139 250 / 16%);
}

.exp__period {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--color-accent);
}

.exp__role {
  margin: 0 0 6px;
}

.exp__desc {
  max-width: 480px;
}

.exp__services {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.exp__service {
  padding: 24px;
  background: var(--color-bg-surface-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: 20px;
  transition:
    border-color 0.4s,
    background 0.4s;

  &:hover {
    background: rgb(167 139 250 / 6%);
    border-color: rgb(167 139 250 / 45%);
  }
}

.exp__service-head {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 10px;
}

.exp__service-mark {
  font-family: var(--font-family-display);
  font-size: 15px;
  color: var(--color-accent);
}

.exp__service-title {
  margin: 0;
}

.exp__service-desc {
  margin: 0;
}
</style>
