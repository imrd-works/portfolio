<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PageSection, Grid, Motion, Text } from '@/shared/ui'
import { useInView } from '@/composables/useInView'
import { coreSkills, frontendChips, backendChips } from '../../model/portfolio'
import SectionEyebrow from './SectionEyebrow.vue'

const { t } = useI18n()
const { targetRef: barsCard, inView: barsVisible } = useInView({ threshold: 0.25 })
</script>

<template>
  <PageSection
    id="skills"
    relative
    padding-top="band-sm"
    padding-bottom="band"
  >
    <Motion
      preset="fade-up"
      trigger="visible"
      tag="div"
      class="skills__head"
    >
      <SectionEyebrow
        num="02"
        :label="t('home.skills.eyebrow')"
      />
      <Text
        tag="h2"
        variant="display-m"
        class="skills__title"
        >{{ t('home.skills.title') }}</Text
      >
    </Motion>

    <Grid
      columns="1fr 1fr"
      gap="xl"
      stack="md"
      align="start"
    >
      <Motion
        preset="fade-up"
        trigger="visible"
        tag="div"
        class="skills__card skills__card--core"
      >
        <Text
          tag="h3"
          variant="heading-m"
          class="skills__card-title"
        >
          <span class="skills__diamond">◆</span> {{ t('home.skills.coreTitle') }}
        </Text>
        <div
          :ref="barsCard"
          class="skills__bars"
        >
          <div
            v-for="skill in coreSkills"
            :key="skill.label"
            class="skills__bar"
          >
            <div class="skills__bar-head">
              <Text
                tag="span"
                variant="body-s"
                tone="secondary"
                >{{ skill.label }}</Text
              >
              <Text
                tag="span"
                variant="body-s"
                tone="tertiary"
                >{{ skill.value }}%</Text
              >
            </div>
            <div class="skills__bar-track">
              <div
                class="skills__bar-fill"
                :style="{ width: barsVisible ? `${skill.value}%` : '0%' }"
              ></div>
            </div>
          </div>
        </div>
      </Motion>

      <Motion
        preset="fade-up"
        trigger="visible"
        :delay="100"
        tag="div"
        class="skills__tags"
      >
        <div class="skills__card">
          <Text
            tag="h3"
            variant="heading-s"
            tone="secondary"
            class="skills__group-title"
          >
            {{ t('home.skills.frontendTitle') }}
          </Text>
          <div class="skills__chips">
            <span
              v-for="chip in frontendChips"
              :key="chip"
              class="skills__chip"
              >{{ chip }}</span
            >
          </div>
        </div>
        <div class="skills__card">
          <Text
            tag="h3"
            variant="heading-s"
            tone="secondary"
            class="skills__group-title"
          >
            {{ t('home.skills.backendTitle') }}
          </Text>
          <div class="skills__chips">
            <span
              v-for="chip in backendChips"
              :key="chip"
              class="skills__chip"
              >{{ chip }}</span
            >
          </div>
        </div>
      </Motion>
    </Grid>
  </PageSection>
</template>

<style lang="scss" scoped>
/** @define skills */
.skills__head {
  margin-bottom: 48px;
}

.skills__title {
  max-width: 760px;
  margin-top: 14px;
}

.skills__card {
  padding: 34px;
  background: var(--color-bg-surface-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-card);

  &--core {
    background: linear-gradient(160deg, rgb(99 102 241 / 7%), rgb(255 255 255 / 1.5%));
  }
}

.skills__card-title {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0 0 26px;
}

.skills__diamond {
  color: var(--color-accent);
}

.skills__bars {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.skills__bar-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 9px;
}

.skills__bar-track {
  height: 5px;
  overflow: hidden;
  background: var(--color-border-subtle);
  border-radius: 5px;
}

.skills__bar-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 5px;
  transition: width 1.5s cubic-bezier(0.16, 0.8, 0.3, 1) 0.25s;
}

.skills__tags {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.skills__group-title {
  margin: 0 0 18px;
}

.skills__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.skills__chip {
  padding: 8px 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: default;
  background: var(--color-bg-surface-sunken);
  border: 1px solid var(--color-border-default);
  border-radius: 30px;
  transition:
    transform 0.3s,
    border-color 0.3s,
    color 0.3s;

  &:hover {
    color: #fff;
    border-color: rgb(167 139 250 / 60%);
    transform: translateY(-3px);
  }
}
</style>
