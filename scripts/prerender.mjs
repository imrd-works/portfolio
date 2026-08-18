/**
 * Static site generation for a Vite SPA.
 *
 * `vite build` produces a client bundle plus an SSR bundle; this script runs
 * the SSR bundle once per route and writes the resulting HTML to disk. The
 * output is a set of complete documents — text, headings, links, Open Graph
 * tags and JSON-LD are all in the source of the page, so search engines,
 * link unfurlers (Telegram, LinkedIn, Slack) and CV parsers see the content
 * without executing a line of JavaScript. The browser then hydrates the same
 * markup, so the site stays a single-page app after first paint.
 *
 * It also emits robots.txt and a sitemap with hreflang alternates, and
 * pre-compresses text assets with gzip and brotli.
 */
import { readFile, writeFile, mkdir, readdir, rm, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { brotliCompress, gzip, constants as zlibConstants } from 'node:zlib'
import { promisify } from 'node:util'
import path from 'node:path'

const require = createRequire(import.meta.url)
const brotli = promisify(brotliCompress)
const gz = promisify(gzip)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')

const { loadEnv } = require('vite')
const env = loadEnv(process.env.NODE_ENV === 'production' ? 'production' : 'production', root, '')
const siteUrl = (process.env.VITE_SITE_URL || env.VITE_SITE_URL || 'http://localhost:4173').replace(
  /\/+$/,
  ''
)

/**
 * `route` is what vue-router resolves; `out` is where the file lands.
 * `/en/index.html` (rather than `/en.html`) is what static hosting resolves a
 * request for `/en/` to.
 */
const ROUTES = [
  { route: '/', out: 'index.html', canonical: '/', changefreq: 'monthly', priority: '1.0' },
  { route: '/en', out: 'en/index.html', canonical: '/en/', changefreq: 'monthly', priority: '0.9' },
  { route: '/404', out: '404.html', canonical: null },
]

const COMPRESSIBLE = new Set([
  '.html',
  '.js',
  '.css',
  '.svg',
  '.json',
  '.xml',
  '.txt',
  '.webmanifest',
])
const MIN_COMPRESS_BYTES = 1024

function fillTemplate(
  template,
  { appHtml, headTags, htmlAttrs, bodyAttrs, bodyTags, bodyTagsOpen },
  prerenderedPath
) {
  let html = template

  // Stamps which route this document was generated for. The browser entry
  // hydrates only when the stamp matches the URL actually being served, so a
  // host that falls back to 404.html for an unknown path still boots a
  // working app instead of hydrating markup for a different page.
  html = html.replace('data-prerendered=""', `data-prerendered="${prerenderedPath}"`)

  html = html.replace('<html>', `<html${htmlAttrs ? ` ${htmlAttrs.trim()}` : ''}>`)
  html = html.replace(
    '<body>',
    `<body${bodyAttrs ? ` ${bodyAttrs.trim()}` : ''}>${bodyTagsOpen ?? ''}`
  )
  html = html.replace('<!--app-head-->', headTags ?? '')
  // Replace the whole container body, not just the marker: hydration walks
  // the DOM from `#app`'s first child, and the pretty-printed template leaves
  // a whitespace text node there. Vue would stop matching on it, silently give
  // up and render a second copy of the page next to the prerendered one.
  html = html.replace(
    /(<div[^>]*\sid="app"[^>]*>)[\s\S]*?(<\/div>)/,
    (_match, open, close) => `${open}${appHtml ?? ''}${close}`
  )

  if (bodyTags) html = html.replace('</body>', `${bodyTags}</body>`)

  return html
}

function buildSitemap(entries) {
  const alternates = entries
    .map(
      ({ canonical, hreflang }) =>
        `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${siteUrl}${canonical}" />`
    )
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/" />`)
    .join('\n')

  const urls = entries
    .map(
      ({ canonical, changefreq, priority, lastmod }) => `  <url>
    <loc>${siteUrl}${canonical}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alternates}
  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
}

function buildRobots() {
  return `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Build artefacts and the soft 404 document carry no value for search.
Disallow: /404.html
Disallow: /stats.html

# The CV is downloadable from the page but kept out of search: it carries a
# phone number, and everything in it is already indexable as page copy.
Disallow: /Rassomakhin_CV.pdf

Sitemap: ${siteUrl}/sitemap.xml
`
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

async function compressAssets() {
  let count = 0

  for await (const file of walk(distDir)) {
    const ext = path.extname(file)
    if (!COMPRESSIBLE.has(ext)) continue

    const { size } = await stat(file)
    if (size < MIN_COMPRESS_BYTES) continue

    const source = await readFile(file)
    await writeFile(`${file}.gz`, await gz(source, { level: 9 }))
    await writeFile(
      `${file}.br`,
      await brotli(source, {
        params: {
          [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
          [zlibConstants.BROTLI_PARAM_SIZE_HINT]: size,
        },
      })
    )
    count += 1
  }

  return count
}

async function main() {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf8')
  const { render } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href)

  const lastmod = new Date().toISOString().slice(0, 10)

  for (const { route, out, canonical } of ROUTES) {
    const rendered = await render(route)
    const html = fillTemplate(template, rendered, canonical ?? route)

    const target = path.join(distDir, out)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, html, 'utf8')

    const kb = (Buffer.byteLength(html) / 1024).toFixed(1)
    console.log(`prerender: ${route.padEnd(6)} -> dist/${out} (${kb} kB)`)
  }

  const sitemapEntries = ROUTES.filter(({ canonical }) => canonical).map((entry) => ({
    ...entry,
    hreflang: entry.canonical === '/' ? 'ru' : 'en',
    lastmod,
  }))

  await writeFile(path.join(distDir, 'sitemap.xml'), buildSitemap(sitemapEntries), 'utf8')
  await writeFile(path.join(distDir, 'robots.txt'), buildRobots(), 'utf8')
  console.log(`prerender: sitemap.xml + robots.txt for ${siteUrl}`)

  await rm(ssrDir, { recursive: true, force: true })

  // Off by default: Yandex Object Storage serves objects verbatim and does no
  // content negotiation, so `.gz` / `.br` twins would just sit in the bucket.
  // Set PRERENDER_COMPRESS=1 when deploying behind nginx (`gzip_static`) or
  // any host that picks the pre-compressed variant.
  if (process.env.PRERENDER_COMPRESS === '1') {
    const compressed = await compressAssets()
    console.log(`prerender: pre-compressed ${compressed} files (gzip + brotli)`)
  }
}

await main()
