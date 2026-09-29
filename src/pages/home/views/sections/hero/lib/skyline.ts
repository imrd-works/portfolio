/**
 * The hills' outline, read off the painting: for each column, the highest point with any ink,
 * widened a few columns. The evening uses it to tell whether the hills come up to the sun's way
 * down (on a very wide screen, the sky cropped low); then the sun's slit goes right under it
 * and the hills above fade into the sky.
 */

/** Columns the outline is read at. */
const W = 512

export interface Skyline {
  /** The outline's height at each column, painting uv (0 bottom, 1 top). */
  tops: Float32Array
  /** The outline was read at this many rows. */
  height: number
}

const col = (x: number) => Math.max(0, Math.min(W - 1, Math.round(x * (W - 1))))

export function readSkyline(img: CanvasImageSource, ratio: number): Skyline {
  const H = Math.round(W / ratio)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.filter = 'blur(1px)'
  g.drawImage(img, 0, 0, W, H)
  const d = g.getImageData(0, 0, W, H).data
  const top = new Float32Array(W)
  for (let x = 0; x < W; x++) {
    let y = 0
    while (y < H && 1 - d[(y * W + x) * 4] / 255 < 0.1) y++
    top[x] = 1 - y / H
  }
  // widened a few columns, so a single stray stroke doesn't make a notch
  const tops = new Float32Array(W)
  for (let x = 0; x < W; x++) {
    let m = 0
    for (let k = -3; k <= 3; k++) m = Math.max(m, top[Math.min(W - 1, Math.max(0, x + k))])
    tops[x] = m
  }
  return { tops, height: H }
}

/** The outline's height at painting x. */
export const heightAt = (line: Float32Array, x: number) => line[col(x)]
