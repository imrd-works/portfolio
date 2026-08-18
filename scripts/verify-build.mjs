/**
 * Guards the thing this build exists for: that the deployed HTML contains the
 * page, not an empty <div id="app">. Runs in CI right after `npm run build`,
 * so a refactor that silently drops prerendering fails the pipeline instead of
 * shipping a blank document to crawlers and link previews.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')

const DOCUMENTS = [
  {
    file: 'index.html',
    lang: 'ru',
    canonicalSuffix: '/',
    mustContain: ['Рассомахин', 'Избранные работы', '@IIMRD'],
  },
  {
    file: 'en/index.html',
    lang: 'en',
    canonicalSuffix: '/en/',
    mustContain: ['Rassomakhin', 'Selected work', '@IIMRD'],
  },
]

/** Rough count of visible characters in the document body. */
function renderedTextLength(html) {
  const body = html.slice(html.indexOf('<body'))

  return body
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

const failures = []

function check(condition, message) {
  if (!condition) failures.push(message)
}

for (const doc of DOCUMENTS) {
  const html = await readFile(path.join(distDir, doc.file), 'utf8')
  const where = `dist/${doc.file}`

  check(renderedTextLength(html) > 2000, `${where}: prerendered markup is missing or nearly empty`)
  check(new RegExp(`<html lang="${doc.lang}"`).test(html), `${where}: wrong or missing <html lang>`)
  check(/<title>.+<\/title>/.test(html), `${where}: no <title>`)
  check(/<meta name="description" content=".{50,}?">/.test(html), `${where}: no meta description`)
  check(
    new RegExp(`<link rel="canonical" href="https?://[^"]+${doc.canonicalSuffix}"`).test(html),
    `${where}: canonical does not point at ${doc.canonicalSuffix}`
  )
  check(
    /hreflang="ru"/.test(html) && /hreflang="en"/.test(html),
    `${where}: no hreflang alternates`
  )
  check(/hreflang="x-default"/.test(html), `${where}: no x-default alternate`)
  check(
    /<meta property="og:image" content="https?:\/\//.test(html),
    `${where}: no absolute og:image`
  )
  check(/"@type":"Person"/.test(html), `${where}: no Person JSON-LD`)
  check(/data-prerendered="[^"]+"/.test(html), `${where}: prerender stamp missing`)
  // Vue SSR output opens with a fragment marker. Anything before it inside the
  // container (a stray newline from formatting) breaks hydration, and the app
  // renders a second copy of itself over the prerendered one.
  check(
    /<div[^>]*\sid="app"[^>]*><!--\[-->/.test(html),
    `${where}: content inside #app does not start at the container — hydration would duplicate the page`
  )

  for (const needle of doc.mustContain) {
    check(html.includes(needle), `${where}: expected copy "${needle}" not found`)
  }
}

const robots = await readFile(path.join(distDir, 'robots.txt'), 'utf8')
check(
  /Sitemap: https?:\/\/\S+\/sitemap\.xml/.test(robots),
  'dist/robots.txt: no absolute sitemap URL'
)

const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
check(
  sitemap.includes('<loc>') && sitemap.includes('xhtml:link'),
  'dist/sitemap.xml: no urls or alternates'
)
check(
  !sitemap.includes('example.com'),
  'dist/sitemap.xml: VITE_SITE_URL was not set for this build'
)

if (failures.length) {
  console.error('verify-build: FAILED\n' + failures.map((line) => `  - ${line}`).join('\n'))
  process.exit(1)
}

console.log(`verify-build: ${DOCUMENTS.length} documents, robots.txt and sitemap.xml look correct`)
