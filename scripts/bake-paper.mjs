/**
 * Bakes the contact section's old paper (contact/shaders/paper.frag.glsl) into pictures, for
 * a browser without WebGL: the same yellowed sheet with its web of cracks, laid under the
 * letter instead of the canvas. One per width band, since the cracks are drawn in css px
 * and the browning at the edges follows the sheet's size; each is as tall as the live
 * sheet gets (the section and the paper drawn below it).
 *
 *   CHROMIUM_PATH=<a Chrome with WebGL> npm run paper:bake
 *
 * Writes public/contact/paper-<width>.webp.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from 'playwright-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const shaders = path.join(root, 'src/pages/home/views/sections')
const FRAG = await readFile(path.join(shaders, 'contact/shaders/paper.frag.glsl'), 'utf8')
const VERT = await readFile(path.join(shaders, 'ink/shaders/quad.vert.glsl'), 'utf8')

// css px wide, css px tall, drawn at this pixel ratio; one fixed web of cracks
const SHEETS = [
  { width: 430, height: 2200 },
  { width: 800, height: 2200 },
  { width: 1440, height: 2200 },
]
const DPR = 1.5
const SEED = 31

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--headless=new', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage()
for (const { width, height } of SHEETS) {
  const url = await page.evaluate(
    ({ VERT, FRAG, width, height, DPR, SEED }) => {
      const c = document.createElement('canvas')
      c.width = Math.round(width * DPR)
      c.height = Math.round(height * DPR)
      const gl = c.getContext('webgl', { preserveDrawingBuffer: true, alpha: false })
      if (!gl) throw new Error('no WebGL in this browser')
      const sh = (type, src) => {
        const s = gl.createShader(type)
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
        return s
      }
      const prog = gl.createProgram()
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      gl.useProgram(prog)
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'aPos')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      gl.viewport(0, 0, c.width, c.height)
      gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), c.width, c.height)
      gl.uniform1f(gl.getUniformLocation(prog, 'uDpr'), DPR)
      gl.uniform1f(gl.getUniformLocation(prog, 'uSeed'), SEED)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      return c.toDataURL('image/webp', 0.82)
    },
    { VERT, FRAG, width, height, DPR, SEED }
  )
  const out = path.join(root, `public/contact/paper-${width}.webp`)
  const data = Buffer.from(url.split(',')[1], 'base64')
  await writeFile(out, data)
  console.log(`paper: ${path.relative(root, out)} (${Math.round(data.length / 1024)} kB)`)
}
await browser.close()
