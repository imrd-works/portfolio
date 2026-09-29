import { afterEach, describe, expect, it, vi } from 'vitest'
import { SLOW_FRAME_MS, medianFrame } from './graphics'

describe('medianFrame', () => {
  it('takes the median of the frames', () => {
    expect(medianFrame([16, 17, 40, 16, 15])).toBe(16)
    expect(medianFrame([10, 20])).toBe(15)
  })

  it('leaves out gaps, where the tab was hidden', () => {
    expect(medianFrame([16, 16, 1200, 17])).toBe(16)
  })

  it('is not fooled by a few stutters on a fast device', () => {
    const frames = [...Array(80).fill(16.7), ...Array(10).fill(60)]
    expect(medianFrame(frames)).toBeLessThan(SLOW_FRAME_MS)
  })

  it('tells a stuttering page', () => {
    expect(medianFrame(Array(90).fill(33))).toBeGreaterThan(SLOW_FRAME_MS)
  })
})

/** A fresh module (it keeps its state per page), with frames every `frameMs`. */
async function page(frameMs: number | null, dpr = 1, stored: Record<string, string> = {}) {
  vi.resetModules()
  vi.useFakeTimers()
  localStorage.clear()
  for (const [k, v] of Object.entries(stored)) localStorage.setItem(k, v)
  vi.stubGlobal('devicePixelRatio', dpr)
  let now = 0
  let pending: FrameRequestCallback | null = null
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    pending = cb
    return 1
  })
  const g = await import('./graphics')
  const offered = vi.fn()
  g.onGraphicsOffer(offered)
  const changed = vi.fn()
  g.onGraphicsChange(changed)
  /** Lets a probe run to its end: its delay, then its frames (null: the page is paused). */
  const run = () => {
    vi.advanceTimersByTime(5000) // a recheck comes 3 s after, and waits 1.5 s more
    for (let i = 0; i < 400 && pending; i++) {
      const cb: FrameRequestCallback = pending
      pending = null
      now += frameMs ?? 11000
      cb(now)
    }
  }
  return { g, offered, changed, run }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the probe', () => {
  it('offers the light mode after two slow probes, and changes nothing by itself', async () => {
    const { g, offered, changed, run } = await page(33)
    g.probeGraphics()
    run() // slow once: could be a hiccup, it checks again
    expect(offered).not.toHaveBeenCalled()
    run() // slow again
    expect(offered).toHaveBeenCalledTimes(1)
    expect(g.graphics.offered).toBe('light')
    expect(g.graphics.level).toBe('high')
    expect(changed).not.toHaveBeenCalled()
  })

  it('offers nothing at 60 fps', async () => {
    const { g, offered, run } = await page(16.7)
    g.probeGraphics()
    run()
    run()
    expect(offered).not.toHaveBeenCalled()
  })

  it('gives up without a verdict on a paused page, instead of running forever', async () => {
    const { g, offered, run } = await page(null)
    g.probeGraphics()
    run()
    run()
    expect(offered).not.toHaveBeenCalled()
  })
})

describe('the choice', () => {
  it('applies the light mode at once and keeps it', async () => {
    const { g, changed } = await page(33, 3)
    expect(g.drawingRatio()).toBe(1.5)
    g.chooseGraphics('low')
    expect(g.graphics.low).toBe(true)
    expect(changed).toHaveBeenCalledWith('low')
    expect(g.drawingRatio()).toBe(1)
    expect(localStorage.getItem('graphics:choice')).toBe('low')

    // the next visit starts in it, and is not asked again
    vi.resetModules()
    const again = await import('./graphics')
    expect(again.graphics.low).toBe(true)
    const offered = vi.fn()
    again.onGraphicsOffer(offered)
    again.probeGraphics()
    vi.advanceTimersByTime(3000)
    expect(offered).not.toHaveBeenCalled()
  })

  it('keeps "as is" too: the question is asked once', async () => {
    const { g, offered, run } = await page(33)
    g.chooseGraphics('high')
    g.probeGraphics()
    run()
    run()
    expect(offered).not.toHaveBeenCalled()
    expect(g.graphics.level).toBe('high')
  })
})

describe('the offer on a dense screen', () => {
  it('offers the lower clarity first, which keeps every animation', async () => {
    const { g, offered, run } = await page(33, 2)
    g.probeGraphics()
    run()
    run()
    expect(offered).toHaveBeenLastCalledWith('clarity')
    expect(g.graphics.offered).toBe('clarity')
    expect(g.drawingRatio()).toBe(1.5) // nothing changed by itself
  })

  it('offers the light mode next, if the page still stutters at 1x', async () => {
    const { g, offered, run } = await page(33, 2)
    g.probeGraphics()
    run()
    run()
    g.chooseClarity(1)
    expect(g.graphics.offered).toBeNull()
    expect(g.drawingRatio()).toBe(1)
    run() // measured again, on its own
    run()
    expect(offered).toHaveBeenLastCalledWith('light')
    expect(g.graphics.low).toBe(false) // still only offered
  })

  it('offers nothing again once turned down, and remembers it', async () => {
    const { g, offered, run } = await page(33, 2)
    g.probeGraphics()
    run()
    run()
    g.declineOffer()
    expect(g.graphics.offered).toBeNull()
    expect(localStorage.getItem('graphics:choice')).toBe('high')
    expect(localStorage.getItem('graphics:clarity')).toBe('1.5')
    offered.mockClear()
    g.probeGraphics()
    run()
    run()
    expect(offered).not.toHaveBeenCalled()
  })

  it('goes straight to the light mode when the clarity is set already', async () => {
    const { g, offered, run } = await page(33, 2, { 'graphics:clarity': '1.5' })
    g.probeGraphics()
    run()
    run()
    expect(offered).toHaveBeenCalledWith('light')
    expect(offered).not.toHaveBeenCalledWith('clarity')
  })
})

describe('clarity', () => {
  /** A fresh module on a screen of `dpr`, with what storage already holds. */
  async function screen(dpr: number, stored: Record<string, string> = {}) {
    vi.resetModules()
    localStorage.clear()
    for (const [k, v] of Object.entries(stored)) localStorage.setItem(k, v)
    vi.stubGlobal('devicePixelRatio', dpr)
    return import('./graphics')
  }
  afterEach(() => vi.unstubAllGlobals())

  it('draws at 1.5x at most, until the visitor chooses', async () => {
    expect((await screen(2)).drawingRatio()).toBe(1.5)
    expect((await screen(3)).drawingRatio()).toBe(1.5)
    expect((await screen(1)).drawingRatio()).toBe(1)
  })

  it('keeps 2x for a visitor who chose it', async () => {
    expect((await screen(2, { 'graphics:clarity': '2' })).drawingRatio()).toBe(2)
  })

  it('draws at the clarity chosen, keeps it, and lays the scenes out again', async () => {
    const g = await screen(2)
    const heard = vi.fn()
    g.onGraphicsChange(heard)
    g.chooseClarity(1)
    expect(g.drawingRatio()).toBe(1)
    expect(heard).toHaveBeenCalledOnce()
    expect(localStorage.getItem('graphics:clarity')).toBe('1')
    expect((await screen(2, { 'graphics:clarity': '1' })).drawingRatio()).toBe(1)
  })

  it('offers only the clarities the screen can show', async () => {
    expect((await screen(2)).clarityChoices()).toEqual([1, 1.5, 2])
    expect((await screen(1.5)).clarityChoices()).toEqual([1, 1.5])
    expect((await screen(1)).clarityChoices()).toEqual([1])
  })

  it('draws at 1x in the light mode, whatever the clarity', async () => {
    const g = await screen(2, { 'graphics:choice': 'low' })
    expect(g.drawingRatio()).toBe(1)
  })

  it('ignores a clarity it does not know', async () => {
    expect((await screen(2, { 'graphics:clarity': '4' })).graphics.clarity).toBe(1.5)
  })
})
