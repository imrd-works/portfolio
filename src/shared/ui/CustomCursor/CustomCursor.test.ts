import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CustomCursor from './CustomCursor.vue'

// the ink is WebGL: not what is checked here
const rest = vi.fn()
vi.mock('./splash-layer', () => ({
  CLICK_SCALE: 0.5,
  inkUnit: () => 1,
  createSplashLayer: () => ({
    resize() {},
    release() {},
    scrolled() {},
    rest: (...args: unknown[]) => rest(...args),
    hit() {},
    destroy() {},
  }),
}))

/** The pointer the browser reports, and whoever listens for it to change. */
const pointer = { fine: true, listeners: [] as ((e: { matches: boolean }) => void)[] }
function switchPointer(fine: boolean) {
  pointer.fine = fine
  pointer.listeners.forEach((fn) => fn({ matches: fine }))
}

const hidden = () => document.documentElement.classList.contains('has-brush-cursor')
const move = (target: EventTarget = document.body) => {
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: 40, clientY: 40 }))
  target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
}

describe('CustomCursor', () => {
  beforeEach(() => {
    rest.mockClear()
    pointer.fine = true
    pointer.listeners.length = 0
    vi.stubGlobal('matchMedia', (query: string) => ({
      get matches() {
        return query.includes('pointer: fine') ? pointer.fine : false
      },
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
        pointer.listeners.push(fn),
      removeEventListener: () => {},
    }))
    vi.stubGlobal('requestAnimationFrame', () => 1)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove('has-brush-cursor')
  })

  it('hides the native cursor only once the brush shows', () => {
    const wrapper = mount(CustomCursor, { attachTo: document.body })
    expect(hidden()).toBe(false)
    move()
    expect(hidden()).toBe(true)
    wrapper.unmount()
    expect(hidden()).toBe(false)
  })

  it('gives the native cursor back outside the window', () => {
    const wrapper = mount(CustomCursor, { attachTo: document.body })
    move()
    document.dispatchEvent(new MouseEvent('mouseout', { relatedTarget: null }))
    expect(hidden()).toBe(false)
    move()
    expect(hidden()).toBe(true)
    wrapper.unmount()
  })

  it('gives the native cursor back over a text field', () => {
    const wrapper = mount(CustomCursor, { attachTo: document.body })
    const input = document.createElement('input')
    document.body.appendChild(input)
    move()
    input.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    expect(hidden()).toBe(false)
    input.remove()
    wrapper.unmount()
  })

  it('steps aside when the pointer turns to touch (DevTools emulation), and back', () => {
    const wrapper = mount(CustomCursor, { attachTo: document.body })
    move()
    switchPointer(false)
    expect(hidden()).toBe(false)
    move() // emulated taps still send mouse events
    expect(hidden()).toBe(false)
    switchPointer(true)
    move()
    expect(hidden()).toBe(true)
    wrapper.unmount()
  })

  it('never hides the native cursor on a touch screen', () => {
    pointer.fine = false
    const wrapper = mount(CustomCursor, { attachTo: document.body })
    move()
    expect(hidden()).toBe(false)
    wrapper.unmount()
  })

  it('lets ink gather under a resting brush on the paper, not on a control', () => {
    vi.useFakeTimers()
    const wrapper = mount(CustomCursor, { attachTo: document.body })
    const button = document.createElement('button')
    const panel = document.createElement('div')
    panel.setAttribute('data-no-ink', '')
    document.body.append(button, panel)
    const under = { el: document.body as Element }
    const elementFromPoint = document.elementFromPoint
    document.elementFromPoint = () => under.el

    move()
    vi.advanceTimersByTime(300)
    expect(rest).toHaveBeenCalledTimes(1)

    for (const el of [button, panel]) {
      rest.mockClear()
      under.el = el
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 90, clientY: 90 }))
      vi.advanceTimersByTime(300)
      expect(rest).not.toHaveBeenCalled()
    }

    button.remove()
    panel.remove()
    document.elementFromPoint = elementFromPoint
    wrapper.unmount()
    vi.useRealTimers()
  })
})
