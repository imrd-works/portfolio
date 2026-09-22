<script setup lang="ts">
import { Ticker } from '@/shared/ui'
import { usePageSeo } from '../seo/usePageSeo'
import { techMarquee } from '../model/portfolio'
import HeroSection from './sections/HeroSection.vue'
import AboutSection from './sections/AboutSection.vue'
import SkillsSection from './sections/SkillsSection.vue'
import WorkSection from './sections/WorkSection.vue'
import ExperienceSection from './sections/ExperienceSection.vue'
import ContactSection from './sections/ContactSection.vue'

usePageSeo()
</script>

<template>
  <div class="home-page">
    <HeroSection />
    <ExperienceSection>
      <WorkSection />
    </ExperienceSection>
    <Ticker :items="techMarquee" />
    <AboutSection />
    <SkillsSection />
    <ContactSection />
  </div>
</template>

<style lang="scss" scoped>
/** @define home-page */
.home-page {
  position: relative;
}
</style>
