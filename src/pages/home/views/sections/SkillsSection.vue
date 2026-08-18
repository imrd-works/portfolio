<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PageSection, Grid, Motion, Text } from '@/shared/ui'
import {
  coreSkills,
  frontendChips,
  dataChips,
  platformChips,
  toolsChips,
} from '../../model/portfolio'
import SectionEyebrow from './SectionEyebrow.vue'

const { t } = useI18n()
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
        class="skills__col"
      >
        <div class="skills__card skills__card--core skills__card--order-1">
          <Text
            tag="h3"
            variant="heading-m"
            class="skills__card-title"
          >
            <span class="skills__diamond">◆</span> {{ t('home.skills.coreTitle') }}
          </Text>
          <dl class="skills__core">
            <div
              v-for="skill in coreSkills"
              :key="skill.id"
              class="skills__core-item"
            >
              <Text
                tag="dt"
                variant="body-m"
                class="skills__core-term"
                >{{ skill.label }}</Text
              >
              <Text
                tag="dd"
                variant="body-s"
                tone="tertiary"
                class="skills__core-note"
                >{{ t(`home.skills.core.${skill.id}`) }}</Text
              >
            </div>
          </dl>
        </div>
        <div class="skills__card skills__card--order-5">
          <Text
            tag="h3"
            variant="heading-s"
            tone="secondary"
            class="skills__group-title"
          >
            {{ t('home.skills.toolsTitle') }}
          </Text>
          <div class="skills__chips">
            <span
              v-for="chip in toolsChips"
              :key="chip"
              class="skills__chip"
              >{{ chip }}</span
            >
          </div>
        </div>
      </Motion>

      <Motion
        preset="fade-up"
        trigger="visible"
        :delay="100"
        tag="div"
        class="skills__col"
      >
        <div class="skills__card skills__card--order-2">
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
        <div class="skills__card skills__card--order-3">
          <Text
            tag="h3"
            variant="heading-s"
            tone="secondary"
            class="skills__group-title"
          >
            {{ t('home.skills.dataTitle') }}
          </Text>
          <div class="skills__chips">
            <span
              v-for="chip in dataChips"
              :key="chip"
              class="skills__chip"
              >{{ chip }}</span
            >
          </div>
        </div>
        <div class="skills__card skills__card--order-4">
          <Text
            tag="h3"
            variant="heading-s"
            tone="secondary"
            class="skills__group-title"
          >
            {{ t('home.skills.platformTitle') }}
          </Text>
          <div class="skills__chips">
            <span
              v-for="chip in platformChips"
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
@use 'assets/styles/mixins' as *;

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

.skills__core {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0;
}

.skills__core-item {
  padding-left: 16px;
  border-left: 2px solid var(--color-border-default);
  transition: border-color 0.3s;

  &:hover {
    border-left-color: var(--color-accent);
  }
}

.skills__core-term {
  font-weight: 600;
  color: var(--color-text-primary);
}

.skills__core-note {
  margin: 4px 0 0;
}

.skills__col {
  display: flex;
  flex-direction: column;
  gap: 24px;

  // On mobile the two columns collapse: flatten them so all four cards
  // become direct grid items and read in a logical order via `order`.
  @include bp-down(md) {
    display: contents;
  }
}

@include bp-down(md) {
  .skills__card--order-1 {
    order: 1;
  }

  .skills__card--order-2 {
    order: 2;
  }

  .skills__card--order-3 {
    order: 3;
  }

  .skills__card--order-4 {
    order: 4;
  }

  .skills__card--order-5 {
    order: 5;
  }
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
