/**
 * Renders the social preview image (`public/og.jpg`) and the PNG app icons with
 * headless Chromium.
 *
 * One card for every page and both languages, in English: a link is previewed
 * by the messenger's own robot, once, the same for everyone who sees it, so the
 * card cannot follow a reader's language; English reads for all of them. It is
 * the site's paper and ink: the name and the role in the site's type, the
 * traveller on the ledge (`scripts/og/traveller.webp`, the painting already
 * toned to the paper), and the only colour the site's cinnabar, the sun and the
 * seal. Output is committed; rerun this only when the card changes:
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
const siteLabel = (process.env.VITE_SITE_URL || env.VITE_SITE_URL || 'https://rassomakhin.com')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '')

const CARD = {
  eyebrow: 'Portfolio',
  name: ['Daniel', 'Rassomakhin'],
  role: ['Senior Frontend Developer', 'Fullstack · Team Lead'],
  seal: 'DR',
}

async function dataUri(file, mime) {
  const buffer = await readFile(path.isAbsolute(file) ? file : path.join(publicDir, file))
  return `data:${mime};base64,${buffer.toString('base64')}`
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`)
}

const lines = (parts) => parts.map(escapeHtml).join('<br>')

function cardHtml(fonts, art) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @font-face { font-family: Unbounded; font-weight: 200 900; src: url(${fonts.unbounded}) format('woff2'); }
  @font-face { font-family: 'JetBrains Mono'; font-weight: 100 800; src: url(${fonts.mono}) format('woff2'); }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* the site's paper and ink */
  body {
    width: 1200px; height: 630px;
    position: relative; overflow: hidden;
    background: #ece8e1;
    color: #101214;
    -webkit-font-smoothing: antialiased;
  }

  /* the painting fades into the paper at its edges: no frame, no seam */
  .art { position: absolute; left: 520px; top: -18px; width: 680px; height: 680px; }

  /* the hero's sun over the mountains, soft-edged */
  .sun { position: absolute; left: 650px; top: 78px; width: 50px; height: 50px; border-radius: 50%;
    background: radial-gradient(circle, rgb(214 86 66 / 82%) 0 55%, rgb(214 86 66 / 45%) 66%, rgb(214 86 66 / 0%) 72%);
    filter: blur(1.4px); mix-blend-mode: multiply; }

  .text { position: absolute; left: 76px; top: 0; bottom: 0; width: 520px;
    display: flex; flex-direction: column; justify-content: center; }
  .eyebrow { display: flex; align-items: center; gap: 14px;
    font-family: 'JetBrains Mono', monospace; font-size: 15px; letter-spacing: 0.34em;
    text-transform: uppercase; color: #3a4454; }
  .eyebrow::before { content: ''; width: 28px; height: 2px; background: #c73826; }
  .name { margin-top: 26px; font-family: Unbounded, sans-serif; font-weight: 300;
    font-size: 66px; line-height: 1.04; letter-spacing: -0.025em; }
  .role { margin-top: 28px; font-family: 'JetBrains Mono', monospace; font-size: 16px;
    line-height: 1.75; letter-spacing: 0.12em; text-transform: uppercase; color: #2a2f36; }
  .site { position: absolute; left: 76px; bottom: 52px;
    font-family: 'JetBrains Mono', monospace; font-size: 15px; letter-spacing: 0.08em; color: #3a4454; }

  /* the seal, pressed in askew, its edge made rough as on the site */
  .seal { position: absolute; right: 64px; bottom: 48px; width: 58px; height: 58px;
    display: grid; place-items: center;
    font-family: Unbounded, sans-serif; font-weight: 500; font-size: 19px; letter-spacing: -0.04em;
    color: #ece8e1; background: #c23b2a; border-radius: 4px;
    transform: rotate(-5deg); filter: url(#rough); opacity: 0.94; mix-blend-mode: multiply; }
</style>
</head>
<body>
  <svg width="0" height="0" style="position: absolute">
    <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
    </filter>
  </svg>
  <img class="art" src="${art}" alt="">
  <div class="sun"></div>
  <div class="text">
    <div class="eyebrow">${escapeHtml(CARD.eyebrow)}</div>
    <div class="name">${lines(CARD.name)}</div>
    <div class="role">${lines(CARD.role)}</div>
  </div>
  <div class="site">${escapeHtml(siteLabel)}</div>
  <div class="seal">${escapeHtml(CARD.seal)}</div>
</body>
</html>`
}

// The favicon is the hero's seal, a cinnabar square: the icons are that square edge to
// edge; the maskable one keeps the letters inside the 80% safe zone of the mask.
const SEAL = '#c23b2a'

function iconHtml(logo, { size, maskable }) {
  const pad = maskable ? size * 0.1 : 0
  const radius = maskable ? 0 : size * 0.22

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; }
  body { width: ${size}px; height: ${size}px; display: grid; place-items: center;
    background: ${SEAL}; border-radius: ${radius}px; overflow: hidden; }
  img { width: ${size - pad * 2}px; height: auto; }
</style></head>
<body><img src="${logo}" alt=""></body></html>`
}

const fonts = {
  unbounded: await dataUri('fonts/unbounded-latin.woff2', 'font/woff2'),
  mono: await dataUri('fonts/jetbrains-mono-latin.woff2', 'font/woff2'),
}
const art = await dataUri(path.join(root, 'scripts/og/traveller.webp'), 'image/webp')
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

  await page.setContent(cardHtml(fonts, art), { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  // JPEG, not PNG: a wash of ink over paper, where JPEG is a fraction of the
  // bytes at a quality nobody can see the difference in.
  const buffer = await page.screenshot({ type: 'jpeg', quality: 90 })
  await writeFile(path.join(publicDir, 'og.jpg'), buffer)
  console.log(`og: public/og.jpg (${(buffer.length / 1024).toFixed(0)} kB)`)

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
