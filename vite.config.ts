import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { compression } from 'vite-plugin-compression2'
import Sitemap from 'vite-plugin-sitemap'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = env.VITE_SITE_URL || 'https://example.com'
  const analyze = env.ANALYZE === 'true'

  return {
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('node_modules/vue/')) return 'vue'
              if (id.includes('node_modules/vue-router/')) return 'router'
              if (id.includes('node_modules/pinia/')) return 'pinia'
              if (
                id.includes('node_modules/vue-i18n/') ||
                id.includes('node_modules/@unhead/') ||
                id.includes('node_modules/vue-sonner/')
              )
                return 'vendor-ui'
              if (id.includes('node_modules/axios/')) return 'vendor-api'
              if (id.includes('node_modules/@vueuse/')) return 'vueuse'
            }
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      cssCodeSplit: true,
      sourcemap: false,
    },
    plugins: [
      vue(),
      createSvgIconsPlugin({
        iconDirs: [fileURLToPath(new URL('./src/assets/icons', import.meta.url))],
        symbolId: 'icon-[name]',
        inject: 'body-last',
        svgoOptions: true,
      }),
      compression(),
      Sitemap({
        hostname: siteUrl,
        dynamicRoutes: ['/', '/404'],
        generateRobotsTxt: true,
      }),
      ...(analyze
        ? [
            visualizer({
              open: true,
              gzipSize: true,
              brotliSize: true,
              filename: 'dist/stats.html',
            }),
          ]
        : []),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [fileURLToPath(new URL('./src', import.meta.url))],
        },
      },
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
  }
})
