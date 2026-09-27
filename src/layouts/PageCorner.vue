<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ConsentMenu, SettingsMenu } from '@/shared/ui'
import ConsentBanner from './ConsentBanner.vue'
import GraphicsOffer from './GraphicsOffer.vue'

/*
 * The page's bottom right corner: the cookie (consent to analytics) and the settings
 * gear, where they are always at hand, and over them the notes that ask the visitor
 * something (analytics, the light mode when the page stutters), so the visitor sees
 * where to change the answer later. The notes show wherever the page is; the buttons
 * keep off the hero, which has the seal and its own controls in its corners: they
 * come once most of the hero has scrolled away (as the site nav does), and on a page
 * without a hero they are there.
 */
const gear = ref(false)
let frame = 0

function update() {
  frame = 0
  const hero = document.getElementById('top')
  gear.value = !hero || scrollY > hero.offsetTop + hero.offsetHeight * 0.6
}
function onScroll() {
  if (!frame) frame = requestAnimationFrame(update)
}

onMounted(() => {
  update()
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  removeEventListener('scroll', onScroll)
  removeEventListener('resize', onScroll)
})
</script>

<template>
  <div class="page-corner">
    <ConsentBanner class="page-corner__offer" />
    <GraphicsOffer class="page-corner__offer" />
    <Transition
      enter-active-class="page-corner__buttons--moving"
      leave-active-class="page-corner__buttons--moving"
      enter-from-class="page-corner__buttons--away"
      leave-to-class="page-corner__buttons--away"
    >
      <div
        v-show="gear"
        class="page-corner__buttons"
      >
        <ConsentMenu />
        <SettingsMenu />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
/** @define page-corner */
.page-corner {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9400;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
  // the corner itself lets clicks through to the page; only what is in it catches them
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  // it rises a little into place as it comes, and sinks back as it goes
  &__buttons {
    display: flex;
    gap: 10px;
  }

  &__buttons--moving {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  &__buttons--away {
    opacity: 0;
    transform: translateY(8px);
  }

  // on a phone the notes take the width, the buttons stay in the corner
  @media (width <= 700px) {
    left: 16px;

    &__offer {
      align-self: stretch;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__buttons {
      display: flex;
      gap: 10px;
    }

    &__buttons--moving {
      transition: none;
    }
  }
}
</style>
