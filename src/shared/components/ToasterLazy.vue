<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { toasterMountRequested, markToasterMounted } from '@/composables/useToast'

const ToasterComponent = ref<(typeof import('vue-sonner'))['Toaster'] | null>(null)

async function loadToaster() {
  if (ToasterComponent.value) return
  const mod = await import('vue-sonner')
  ToasterComponent.value = mod.Toaster
  await import('vue-sonner/style.css')
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
