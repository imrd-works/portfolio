<script setup lang="ts">
import { usePageSeo } from '../seo/usePageSeo'
import SiteNav from './sections/SiteNav.vue'
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
    <SiteNav />
    <HeroSection />
    <ExperienceSection>
      <WorkSection />
    </ExperienceSection>
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
