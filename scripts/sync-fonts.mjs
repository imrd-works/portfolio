/**
 * Copies the woff2 files we self-host out of the @fontsource packages into
 * `public/fonts` under stable, unhashed names.
 *
 * Self-hosting removes two extra origins (fonts.googleapis.com +
 * fonts.gstatic.com) and one render-blocking stylesheet from the critical
 * path, and it lets us `<link rel="preload">` the exact subsets a page needs.
 * The files are committed, so a normal install/build needs no network — rerun
 * this script only when a font or its version changes.
 */
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'fonts')

/** [source package file, destination name] */
const FONTS = [
  [
    '@fontsource-variable/geologica/files/geologica-latin-wght-normal.woff2',
    'geologica-latin.woff2',
  ],
  [
    '@fontsource-variable/geologica/files/geologica-cyrillic-wght-normal.woff2',
    'geologica-cyrillic.woff2',
  ],
  ['@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2', 'manrope-latin.woff2'],
  [
    '@fontsource-variable/manrope/files/manrope-cyrillic-wght-normal.woff2',
    'manrope-cyrillic.woff2',
  ],
  [
    '@fontsource/playfair-display/files/playfair-display-latin-500-italic.woff2',
    'playfair-latin-italic.woff2',
  ],
  [
    '@fontsource/playfair-display/files/playfair-display-cyrillic-500-italic.woff2',
    'playfair-cyrillic-italic.woff2',
  ],
]

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

for (const [source, target] of FONTS) {
  await copyFile(path.join(root, 'node_modules', source), path.join(outDir, target))
}

const written = await readdir(outDir)
console.log(`fonts: copied ${written.length} files to public/fonts`)
