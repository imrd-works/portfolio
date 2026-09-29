/**
 * Renders the CV, `public/Rassomakhin_CV.pdf`, with headless Chromium, from its
 * text in `scripts/cv/cv.ru.json`: one text, two looks.
 *
 * - `classic`: a plain document of the kind job boards and their parsers expect,
 *   dark blue headings over thin rules, as the CV has always looked;
 * - `site`: the site's paper and ink, its type and the seal.
 *
 * Either way the PDF holds real text (selectable, read by the boards' parsers),
 * A4, links clickable. Output is committed; rerun it when the CV changes:
 *
 *   npm run cv:generate                    # the site's look, public/Rassomakhin_CV.pdf
 *   npm run cv:generate -- --style classic --out ~/Desktop/Rassomakhin_CV.pdf
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { PDFDocument } from 'pdf-lib'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}
// the site's look is the one the site serves; `classic` is the plain one for job boards
const style = arg('style', 'site')
const out = path.resolve(arg('out', path.join(root, 'public/Rassomakhin_CV.pdf')))

const cv = JSON.parse(await readFile(path.join(root, 'scripts/cv/cv.ru.json'), 'utf8'))

const esc = (value) => String(value).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
const font = async (file) =>
  `data:font/woff2;base64,${(await readFile(path.join(root, 'public/fonts', file))).toString('base64')}`

/** The body of the CV, the same markup for both looks: only the styles differ. */
function body() {
  const s = cv.sections
  const contacts = cv.contacts
    .map((c) => `<a href="${esc(c.href)}">${esc(c.label)}</a>`)
    .join('<span class="dot"> · </span>')
  const project = (p) => `
    <article class="project">
      <h4><span class="project-title">${esc(p.title)}</span> <span class="meta">${esc(p.meta)}</span></h4>
      ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
      <p class="stack"><span class="stack-label">${esc(s.stack)}:</span> ${esc(p.stack)}</p>
      <ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </article>`
  return `
  <header class="head">
    <div class="head-text">
      <h1>${esc(cv.name)}</h1>
      <p class="title">${esc(cv.title)}</p>
      <p class="line">${esc(cv.location)}</p>
      <p class="line contacts">${contacts}</p>
    </div>
    <div class="seal" aria-hidden="true">DR</div>
  </header>

  <section>
    <h2>${esc(s.about)}</h2>
    ${cv.about.map((p) => `<p class="text">${esc(p)}</p>`).join('')}
    ${cv.highlights ? `<p class="highlights">${cv.highlights.map((h) => `<span>${esc(h)}</span>`).join('<span class="dot"> · </span>')}</p>` : ''}
  </section>

  <section>
    <h2>${esc(s.skills)}</h2>
    <dl class="skills">
      ${cv.skills.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
    </dl>
  </section>

  <section>
    <h2>${esc(s.experience)}</h2>
    <div class="job">
      <h3><span class="company">${esc(cv.job.company)}</span> <span class="meta">${esc(cv.job.period)}</span></h3>
      <p class="role">${esc(cv.job.role)}</p>
      ${cv.job.path ? `<p class="path">${esc(cv.job.path)}</p>` : ''}
      <p class="desc">${esc(cv.job.intro)}</p>
    </div>
    ${cv.projects.map(project).join('')}
    <article class="project">
      <h4><span class="project-title">${esc(cv.early.title)}</span></h4>
      <ul>${cv.early.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </article>
  </section>

  <section>
    <h2>${esc(s.education)}</h2>
    <p class="text"><span class="meta">${esc(cv.education.period)}</span> <b>${esc(cv.education.degree)}</b></p>
    <p class="desc">${esc(cv.education.school)}</p>
  </section>

  <section>
    <h2>${esc(s.team)}</h2>
    <p class="text">${esc(cv.team)}</p>
  </section>

  <section>
    <h2>${esc(s.extra)}</h2>
    <p class="text">${esc(cv.extra)}</p>
  </section>`
}

/** A plain document, dark blue over thin rules: the CV as it has always looked. */
function classicCss() {
  return `
  @page { size: A4; margin: 12mm 14mm 12mm 14mm; }
  body { font-family: 'PT Sans', Calibri, Carlito, Arial, sans-serif; font-size: 9.4pt; line-height: 1.28; color: #1f2328; }
  a { color: inherit; text-decoration: none; }
  .head { display: block; margin-bottom: 2mm; }
  .seal { display: none; }
  h1 { margin: 0; font-size: 20pt; line-height: 1.1; color: #1f2328; }
  .title { margin: 0.8mm 0 1.6mm; font-size: 10.6pt; font-weight: 700; color: #2f5496; }
  .line { margin: 0; color: #595959; }
  .dot { color: #8a8a8a; }
  h2 { margin: 3.6mm 0 1.8mm; padding-bottom: 0.8mm; font-size: 9.8pt; letter-spacing: 0.08em; text-transform: uppercase; color: #2f5496; border-bottom: 0.7pt solid #9fb3d6; break-after: avoid; }
  .text { margin: 0 0 1.2mm; text-align: justify; }
  .skills { display: grid; grid-template-columns: 42mm 1fr; gap: 0.7mm 4mm; margin: 0; }
  .skills dt { font-weight: 700; }
  .skills dd { margin: 0; }
  .job h3 { margin: 0; font-size: 12pt; }
  .meta { font-size: 8.8pt; font-weight: 400; color: #6b6b6b; }
  .role { margin: 0.4mm 0; font-weight: 700; }
  .path { margin: 0 0 0.6mm; color: #2f5496; }
  .highlights { margin: 0.6mm 0 0; font-weight: 700; color: #2f5496; }
  .desc { margin: 0 0 0.6mm; color: #595959; }
  .project { margin-top: 2.4mm; }
  .project h4 { margin: 0 0 0.4mm; font-size: 9.8pt; break-after: avoid; }
  .stack { margin: 0 0 0.6mm; font-weight: 700; font-style: italic; break-after: avoid; }
  ul { margin: 0; padding-left: 4.2mm; }
  li { margin: 0 0 0.3mm; }
  li::marker { color: #2f5496; }`
}

/** The site's paper and ink: its type, the seal, the cinnabar for accents. */
function siteCss(fonts) {
  return `
  @font-face { font-family: Unbounded; font-weight: 200 900; src: url(${fonts.unboundedLatin}) format('woff2'); unicode-range: U+0000-00FF, U+2000-206F; }
  @font-face { font-family: Unbounded; font-weight: 200 900; src: url(${fonts.unboundedCyrillic}) format('woff2'); unicode-range: U+0400-045F; }
  @font-face { font-family: Manrope; font-weight: 200 800; src: url(${fonts.manropeLatin}) format('woff2'); unicode-range: U+0000-00FF, U+2000-206F, U+2190-21FF; }
  @font-face { font-family: Manrope; font-weight: 200 800; src: url(${fonts.manropeCyrillic}) format('woff2'); unicode-range: U+0400-045F; }
  @font-face { font-family: 'JetBrains Mono'; font-weight: 100 800; src: url(${fonts.monoLatin}) format('woff2'); unicode-range: U+0000-00FF, U+2000-206F; }
  @font-face { font-family: 'JetBrains Mono'; font-weight: 100 800; src: url(${fonts.monoCyrillic}) format('woff2'); unicode-range: U+0400-045F; }
  @page { size: A4; margin: 12mm 14mm 12mm 14mm; background: #ece8e1; }
  html { background: #ece8e1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Manrope, sans-serif; font-size: 8.7pt; line-height: 1.36; color: #2a2f36; }
  a { color: inherit; text-decoration: none; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm; margin-bottom: 3mm; }
  h1 { margin: 0; font-family: Unbounded, sans-serif; font-weight: 300; font-size: 24pt; line-height: 1.05; letter-spacing: -0.02em; color: #101214; }
  .title { margin: 2.2mm 0 2.2mm; font-family: 'JetBrains Mono', monospace; font-size: 8.6pt; letter-spacing: 0.12em; text-transform: uppercase; color: #101214; }
  .line { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #3a4454; }
  .dot { color: #c73826; }
  .seal { flex: none; width: 15mm; height: 15mm; display: grid; place-items: center; margin-top: 1mm; font-family: Unbounded, sans-serif; font-weight: 500; font-size: 12pt; letter-spacing: -0.04em; color: #ece8e1; background: #c23b2a; border-radius: 1mm; transform: rotate(-5deg); }
  h2 { display: flex; align-items: center; gap: 3mm; margin: 4.6mm 0 2mm; break-after: avoid; font-family: 'JetBrains Mono', monospace; font-size: 8.4pt; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: #3a4454; }
  h2::before { content: ''; width: 7mm; height: 0.6mm; background: #c73826; }
  h2::after { content: ''; flex: 1; height: 0.3mm; background: rgb(58 68 84 / 22%); }
  .text { margin: 0 0 1.8mm; }
  .skills { display: grid; grid-template-columns: 42mm 1fr; gap: 1.2mm 4mm; margin: 0; }
  .skills dt { font-family: 'JetBrains Mono', monospace; font-size: 7.6pt; letter-spacing: 0.06em; text-transform: uppercase; color: #3a4454; padding-top: 0.4mm; }
  .skills dd { margin: 0; }
  .job h3 { margin: 0; font-family: Unbounded, sans-serif; font-weight: 400; font-size: 12.5pt; color: #101214; }
  .meta { font-family: 'JetBrains Mono', monospace; font-size: 7.6pt; font-weight: 400; letter-spacing: 0.04em; color: #c73826; }
  .role { margin: 0.8mm 0; font-weight: 700; color: #101214; }
  .path { margin: 0 0 0.8mm; font-family: 'JetBrains Mono', monospace; font-size: 7.8pt; color: #3a4454; }
  .highlights { margin: 1mm 0 0; font-family: Unbounded, sans-serif; font-weight: 400; font-size: 9.6pt; color: #101214; }
  .desc { margin: 0 0 1mm; color: #3a4454; }
  .project { margin-top: 3mm; }
  .project h4, .stack { break-after: avoid; }
  .project h4 { margin: 0 0 0.8mm; font-family: Unbounded, sans-serif; font-weight: 400; font-size: 10pt; line-height: 1.3; color: #101214; }
  .stack { margin: 0 0 1mm; font-family: 'JetBrains Mono', monospace; font-size: 7.6pt; line-height: 1.5; color: #101214; }
  .stack-label { color: #3a4454; }
  /* a real list marker, not a positioned mark: the text stays in reading order for parsers */
  ul { margin: 0; padding-left: 4.5mm; }
  li { margin: 0 0 0.5mm; }
  li::marker { content: '— '; color: #c73826; }
  b { color: #101214; }`
}

const fonts =
  style === 'site'
    ? {
        unboundedLatin: await font('unbounded-latin.woff2'),
        unboundedCyrillic: await font('unbounded-cyrillic.woff2'),
        manropeLatin: await font('manrope-latin.woff2'),
        manropeCyrillic: await font('manrope-cyrillic.woff2'),
        monoLatin: await font('jetbrains-mono-latin.woff2'),
        monoCyrillic: await font('jetbrains-mono-cyrillic.woff2'),
      }
    : null

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${esc(cv.name)} — ${esc(cv.title)}</title>
<meta name="author" content="${esc(cv.name)}">
<meta name="description" content="${esc(cv.title)}">
<style>
  * { box-sizing: border-box; }
  /* no kerning, no ligatures: Chrome would cut a word into pieces where the font
     kerns, and the job boards' parsers read the pieces as separate words */
  body { margin: 0; font-kerning: none; font-variant-ligatures: none; font-feature-settings: 'kern' 0, 'liga' 0, 'calt' 0, 'clig' 0, 'dlig' 0; text-rendering: optimizeSpeed; }
  ${style === 'site' ? siteCss(fonts) : classicCss()}
</style>
</head>
<body>${body()}</body>
</html>`

// `CHROMIUM_PATH` lets CI point at a Chromium that is already on the image.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
try {
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  // tagged: the PDF carries its structure and language (ru), as documents from Word do
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
  })
  // Chromium leaves the author out: set it, as a document saved from Word has it
  const doc = await PDFDocument.load(pdf, { updateMetadata: false })
  doc.setAuthor(cv.name)
  doc.setSubject(cv.title)
  await writeFile(out, await doc.save())
  console.log(`cv: ${path.relative(root, out)} (${style}, ${(pdf.length / 1024).toFixed(0)} kB)`)
} finally {
  await browser.close()
}
