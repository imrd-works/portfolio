import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const analyze = env.ANALYZE === 'true'

  return {
    build: {
      target: 'esnext',
      // The SSR bundle is a build-time artifact consumed by
      // `scripts/prerender.mjs`; it never ships to the browser.
      outDir: isSsrBuild ? 'dist-ssr' : 'dist',
      rollupOptions: isSsrBuild
        ? {
            // Keep the lazy `import('vue-sonner/style.css')` intact: the SSR
            // pipeline rewrites CSS imports to a stub and mangles this one.
            // It is inside a handler that never runs during prerendering, so
            // leaving it external is safe.
            external: [/vue-sonner\/style\.css$/],
            output: {
              // One file: the prerender pass runs it once and deletes it, and
              // a single module avoids cross-chunk hoisting issues in the SSR
              // graph. Nothing here is served to a browser.
              inlineDynamicImports: true,
              entryFileNames: '[name].js',
            },
          }
        : {
            output: {
              manualChunks(id: string) {
                if (id.includes('node_modules')) {
                  // `@vue/runtime-core` & co. live outside `node_modules/vue/`;
                  // without them the "vue" chunk is empty and the runtime ends
                  // up wherever it is imported first.
                  if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/'))
                    return 'vue'
                  if (id.includes('node_modules/vue-router/')) return 'router'
                  if (id.includes('node_modules/pinia/')) return 'pinia'
                  // vue-sonner is deliberately absent: it is imported
                  // dynamically the first time a toast fires, and naming it
                  // here would drag it back into the initial payload.
                  if (id.includes('node_modules/vue-i18n/') || id.includes('node_modules/@unhead/'))
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
      // One stylesheet for the whole site. With prerendered HTML a split
      // route chunk would arrive only after JS boots, and the already-painted
      // markup would flash unstyled; a single file is also one cacheable
      // request for what is, in the end, a single page.
      cssCodeSplit: false,
      sourcemap: false,
      // The SSR bundle is thrown away right after prerendering; skipping
      // minification keeps stack traces from that pass readable.
      minify: !isSsrBuild,
    },
    plugins: [
      vue(),
      createSvgIconsPlugin({
        iconDirs: [fileURLToPath(new URL('./src/assets/icons', import.meta.url))],
        symbolId: 'icon-[name]',
        inject: 'body-last',
        svgoOptions: true,
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
