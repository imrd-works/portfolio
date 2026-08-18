/**
 * Renders the social preview images (`public/og-ru.jpg`, `public/og-en.jpg`)
 * and the PNG app icons with headless Chromium.
 *
 * The cards are built from the same tokens as the site — background, accent
 * gradient, Geologica/Manrope — so a link shared in Telegram, LinkedIn or
 * Slack looks like the page it points to. Output is committed; rerun this
 * only when the copy or the design changes:
 *
 *   npx playwright install chromium && npm run og:generate
 */
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from 'playwright-core'

const require = createRequire(import.meta.url)
const { loadEnv } = require('vite')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')

// The card prints the site's own host, so it follows VITE_SITE_URL.
const env = loadEnv('production', root, '')
const siteLabel = (process.env.VITE_SITE_URL || env.VITE_SITE_URL || 'localhost')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '')

const CARDS = {
  ru: {
    eyebrow: 'Открыт к предложениям · Vue / Nuxt · Team Lead',
    name: 'Даниил Рассомахин',
    role: 'Frontend-разработчик и Team Lead',
    lead: 'Корпоративные и государственные системы, дашборды, запуск продуктов с нуля.',
    chips: ['Vue 3', 'Nuxt 4', 'TypeScript', 'DDD / FSD', 'Data Viz'],
  },
  en: {
    eyebrow: 'Open to opportunities · Vue / Nuxt · Team Lead',
    name: 'Daniel Rassomakhin',
    role: 'Frontend Developer & Team Lead',
    lead: 'Enterprise and public-sector systems, dashboards, products built from scratch.',
    chips: ['Vue 3', 'Nuxt 4', 'TypeScript', 'DDD / FSD', 'Data Viz'],
  },
}

async function dataUri(file, mime) {
  const buffer = await readFile(path.join(publicDir, file))
  return `data:${mime};base64,${buffer.toString('base64')}`
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`)
}

async function cardHtml(locale, fonts, avatar, logo) {
  const card = CARDS[locale]

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<style>
  @font-face { font-family: Geologica; font-weight: 200 800; src: url(${fonts.geologicaLatin}) format('woff2-variations'); unicode-range: U+0000-00FF; }
  @font-face { font-family: Geologica; font-weight: 200 800; src: url(${fonts.geologicaCyrillic}) format('woff2-variations'); unicode-range: U+0400-045F; }
  @font-face { font-family: Manrope; font-weight: 200 800; src: url(${fonts.manropeLatin}) format('woff2-variations'); unicode-range: U+0000-00FF; }
  @font-face { font-family: Manrope; font-weight: 200 800; src: url(${fonts.manropeCyrillic}) format('woff2-variations'); unicode-range: U+0400-045F; }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px; height: 630px;
    display: flex; align-items: center; gap: 64px;
    padding: 76px 80px;
    position: relative; overflow: hidden;
    background: #06050d;
    color: #f4f2ff;
    font-family: Manrope, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .blob { position: absolute; border-radius: 50%; filter: blur(90px); }
  .blob--a { width: 620px; height: 620px; top: -240px; left: -160px;
    background: radial-gradient(circle at 30% 30%, rgb(99 102 241 / 62%), transparent 66%); }
  .blob--b { width: 560px; height: 560px; right: -140px; top: 120px;
    background: radial-gradient(circle at 50% 50%, rgb(167 139 250 / 52%), transparent 66%); }
  .grid { position: absolute; inset: 0;
    background-image: radial-gradient(rgb(255 255 255 / 5%) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(ellipse at 40% 30%, #000, transparent 78%); }

  .content { position: relative; flex: 1; min-width: 0; }

  .eyebrow { display: inline-flex; align-items: center; gap: 12px;
    padding: 9px 18px; margin-bottom: 30px;
    font-size: 19px; color: #b9b4d6;
    background: rgb(255 255 255 / 4%);
    border: 1px solid rgb(255 255 255 / 12%); border-radius: 30px; }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: #4ade80; }

  .name { font-family: Geologica, sans-serif; font-weight: 800;
    font-size: 74px; line-height: 1.02; letter-spacing: -0.03em;
    background: linear-gradient(100deg, #ffffff 10%, #a78bfa 92%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .role { margin-top: 18px; font-size: 30px; font-weight: 600; color: #d7d3ef; }
  .lead { margin-top: 18px; font-size: 22px; line-height: 1.45; color: #9d98bd; max-width: 620px; }

  .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 34px; }
  .chip { padding: 9px 16px; font-size: 18px; color: #cfcae8;
    background: rgb(255 255 255 / 4%);
    border: 1px solid rgb(255 255 255 / 12%); border-radius: 30px; }

  .aside { position: relative; display: flex; flex-direction: column; align-items: center; gap: 26px; }
  .portrait { position: relative; width: 300px; height: 340px; border-radius: 34px; overflow: hidden;
    border: 1px solid rgb(255 255 255 / 16%); box-shadow: 0 30px 90px rgb(0 0 0 / 55%); }
  .portrait img { width: 100%; height: 100%; object-fit: cover; object-position: center 42%; }
  .glow { position: absolute; inset: -22px; border-radius: 44px; z-index: -1;
    background: linear-gradient(135deg, rgb(99 102 241 / 55%), rgb(167 139 250 / 25%), transparent);
    filter: blur(30px); }
  .site { display: flex; align-items: center; gap: 12px; font-size: 19px; color: #8f8ab0; }
  .site img { width: 26px; height: 26px; }
</style>
</head>
<body>
  <div class="blob blob--a"></div>
  <div class="blob blob--b"></div>
  <div class="grid"></div>

  <div class="content">
    <div class="eyebrow"><span class="dot"></span>${escapeHtml(card.eyebrow)}</div>
    <div class="name">${escapeHtml(card.name)}</div>
    <div class="role">${escapeHtml(card.role)}</div>
    <div class="lead">${escapeHtml(card.lead)}</div>
    <div class="chips">${card.chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join('')}</div>
  </div>

  <div class="aside">
    <div class="portrait"><span class="glow"></span><img src="${avatar}" alt=""></div>
    <div class="site"><img src="${logo}" alt="">${escapeHtml(siteLabel)}</div>
  </div>
</body>
</html>`
}

function iconHtml(logo, { size, maskable }) {
  const pad = maskable ? size * 0.22 : size * 0.16
  const radius = maskable ? 0 : size * 0.22

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; }
  body { width: ${size}px; height: ${size}px; display: grid; place-items: center;
    background: #06050d; border-radius: ${radius}px; overflow: hidden; }
  img { width: ${size - pad * 2}px; height: auto; }
</style></head>
<body><img src="${logo}" alt=""></body></html>`
}

const fonts = {
  geologicaLatin: await dataUri('fonts/geologica-latin.woff2', 'font/woff2'),
  geologicaCyrillic: await dataUri('fonts/geologica-cyrillic.woff2', 'font/woff2'),
  manropeLatin: await dataUri('fonts/manrope-latin.woff2', 'font/woff2'),
  manropeCyrillic: await dataUri('fonts/manrope-cyrillic.woff2', 'font/woff2'),
}
const avatar = await dataUri('avatar.webp', 'image/webp')
const logo = await dataUri('favicon.svg', 'image/svg+xml')

// `CHROMIUM_PATH` lets CI point at a Chromium that is already on the image.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
})

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })

  for (const locale of Object.keys(CARDS)) {
    await page.setContent(await cardHtml(locale, fonts, avatar, logo), { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    // JPEG, not PNG: the card is a photo over gradients, where JPEG is
    // roughly a third of the bytes at a quality nobody can see the difference in.
    const buffer = await page.screenshot({ type: 'jpeg', quality: 90 })
    await writeFile(path.join(publicDir, `og-${locale}.jpg`), buffer)
    console.log(`og: public/og-${locale}.jpg (${(buffer.length / 1024).toFixed(0)} kB)`)
  }

  const ICONS = [
    { file: 'apple-touch-icon.png', size: 180, maskable: false },
    { file: 'icon-192.png', size: 192, maskable: false },
    { file: 'icon-512.png', size: 512, maskable: false },
    { file: 'icon-512-maskable.png', size: 512, maskable: true },
  ]

  for (const icon of ICONS) {
    const iconPage = await browser.newPage({
      viewport: { width: icon.size, height: icon.size },
      deviceScaleFactor: 1,
    })
    await iconPage.setContent(iconHtml(logo, icon), { waitUntil: 'load' })
    const buffer = await iconPage.screenshot({ type: 'png', omitBackground: !icon.maskable })
    await writeFile(path.join(publicDir, icon.file), buffer)
    await iconPage.close()
    console.log(`og: public/${icon.file}`)
  }
} finally {
  await browser.close()
}
