<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { SettingsMenu } from '@/shared/ui'
import GraphicsOffer from './GraphicsOffer.vue'

/*
 * The page's bottom right corner: the settings gear, where it is always at hand,
 * and over it the offer of the light mode when the page stutters, so the visitor
 * sees where that setting lives. The gear keeps off the hero, which has the seal
 * and its own controls in its corners: it comes once most of the hero has
 * scrolled away (as the site nav does), and on a page without a hero it is there.
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
    <GraphicsOffer class="page-corner__offer" />
    <Transition
      enter-active-class="page-corner__gear--moving"
      leave-active-class="page-corner__gear--moving"
      enter-from-class="page-corner__gear--away"
      leave-to-class="page-corner__gear--away"
    >
      <SettingsMenu
        v-show="gear"
        class="page-corner__gear"
        round
      />
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
  &__gear--moving {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  &__gear--away {
    opacity: 0;
    transform: translateY(8px);
  }

  // on a phone the offer takes the width, the gear stays in the corner
  @media (width <= 700px) {
    left: 16px;

    &__offer {
      align-self: stretch;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__gear--moving {
      transition: none;
    }
  }
}
</style>
