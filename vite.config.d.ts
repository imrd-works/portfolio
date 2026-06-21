declare module 'vite-plugin-compression2' {
  import type { Plugin } from 'vite'
  export function compression(options?: unknown): Plugin
}

declare module 'vite-plugin-sitemap' {
  import type { Plugin } from 'vite'
  interface SitemapOptions {
    hostname?: string
    dynamicRoutes?: string[]
    generateRobotsTxt?: boolean
  }
  export default function Sitemap(options?: SitemapOptions): Plugin
}
