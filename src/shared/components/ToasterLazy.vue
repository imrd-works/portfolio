<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { toasterMountRequested, markToasterMounted } from '@/composables/useToast'

const ToasterComponent = ref<(typeof import('vue-sonner'))['Toaster'] | null>(null)

async function loadToaster() {
  if (ToasterComponent.value) return
  // Component and stylesheet are requested together so the toast never
  // paints unstyled. Kept as one `Promise.all` expression: a bare
  // `await import('...css')` is rewritten incorrectly in the SSR build.
  const [mod] = await Promise.all([import('vue-sonner'), import('vue-sonner/style.css')])
  ToasterComponent.value = mod.Toaster
  await nextTick()
  markToasterMounted()
}

watch(
  toasterMountRequested,
  (requested) => {
    if (requested) void loadToaster()
  },
  { immediate: true }
)

onMounted(() => {
  if (toasterMountRequested.value) void loadToaster()
})
</script>

<template>
  <component
    :is="ToasterComponent"
    v-if="ToasterComponent"
    rich-colors
    position="bottom-right"
  />
</template>
