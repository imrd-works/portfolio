import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: false,
    css: false,
  },
  resolve: {
    alias: {
      '@/api': fileURLToPath(new URL('./src/app/api', import.meta.url)),
      '@/i18n': fileURLToPath(new URL('./src/app/i18n', import.meta.url)),
      '@/router': fileURLToPath(new URL('./src/app/router', import.meta.url)),
      '@/stores': fileURLToPath(new URL('./src/shared/stores', import.meta.url)),
      '@/composables': fileURLToPath(new URL('./src/shared/composables', import.meta.url)),
      '@/locales': fileURLToPath(new URL('./src/shared/locales', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@/shared/styles': fileURLToPath(new URL('./src/assets/styles', import.meta.url)),
    },
  },
})
