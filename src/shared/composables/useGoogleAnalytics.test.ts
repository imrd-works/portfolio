import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { GOOGLE_ANALYTICS, useGoogleAnalytics } from './useGoogleAnalytics'

/** The app's root, with the tag; its button sends an event. */
function app(options: Parameters<typeof useGoogleAnalytics>[0]) {
  return mount(
    defineComponent({
      setup() {
        const { event } = useGoogleAnalytics(options)
        return () => h('button', { onClick: () => event('cv_download') })
      },
    })
  )
}

/** What was sent so far (Google's queue, before its tag arrives), as plain arrays. */
const sent = () => (window.dataLayer ?? []).map((args) => Array.from(args as ArrayLike<unknown>))

describe('useGoogleAnalytics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    delete window.gtag
    delete window.dataLayer
    document.head.querySelectorAll('script').forEach((s) => s.remove())
  })
  afterEach(() => {
    vi.useRealTimers()
    delete window.gtag
    delete window.dataLayer
  })

  it('does nothing outside the published site', () => {
    const wrapper = app({ id: 'G-TX4MMQQNFK', enabled: false })
    expect(window.gtag).toBeUndefined()
    wrapper.unmount()
  })

  it('does nothing without a measurement ID, or with one that is not', () => {
    for (const id of [undefined, '113106427']) {
      const wrapper = app({ id, enabled: true })
      expect(window.gtag).toBeUndefined()
      wrapper.unmount()
    }
  })

  it('configures the tag, and loads it when the page is idle', () => {
    const wrapper = app({ id: 'G-TX4MMQQNFK', enabled: true })
    expect(sent()[0][0]).toBe('js')
    expect(sent()[1]).toEqual(['config', 'G-TX4MMQQNFK', GOOGLE_ANALYTICS.config])
    expect(document.querySelector('script[src*="gtag/js"]')).toBeNull()
    vi.runAllTimers()
    expect(document.querySelector('script')?.src).toBe(`${GOOGLE_ANALYTICS.tag}?id=G-TX4MMQQNFK`)
    wrapper.unmount()
  })

  it('leaves page views to the stream: a change of address sends nothing from here', () => {
    const wrapper = app({ id: 'G-TX4MMQQNFK', enabled: true })
    const before = sent().length
    history.pushState(null, '', '/#/work/energy')
    expect(sent().length).toBe(before)
    history.replaceState(null, '', '/')
    wrapper.unmount()
  })

  it('sends events', () => {
    const wrapper = app({ id: 'G-TX4MMQQNFK', enabled: true })
    wrapper.find('button').trigger('click')
    expect(sent().at(-1)).toEqual(['event', 'cv_download', undefined])
    wrapper.unmount()
  })
})
