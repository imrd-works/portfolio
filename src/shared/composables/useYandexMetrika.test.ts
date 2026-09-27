import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { YANDEX_METRIKA, useYandexMetrika } from './useYandexMetrika'

/** The app's root, with the counter; its button reaches a goal. */
function app(options: Parameters<typeof useYandexMetrika>[0]) {
  return mount(
    defineComponent({
      setup() {
        const { reachGoal } = useYandexMetrika(options)
        return () => h('button', { onClick: () => reachGoal('cv_download') })
      },
    })
  )
}

/** What was sent to the counter so far (Metrica's queue, before its tag arrives). */
const sent = () => window.ym?.a ?? []

describe('useYandexMetrika', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    delete window.ym
    history.replaceState(null, '', '/')
    document.head.querySelectorAll('script').forEach((s) => s.remove())
  })
  afterEach(() => {
    vi.useRealTimers()
    delete window.ym
  })

  it('does nothing outside the published site', () => {
    const wrapper = app({ id: '113106427', enabled: false })
    expect(window.ym).toBeUndefined()
    wrapper.unmount()
  })

  it('does nothing without a counter number', () => {
    const wrapper = app({ id: undefined, enabled: true })
    expect(window.ym).toBeUndefined()
    wrapper.unmount()
  })

  it('starts the counter with its settings, and loads the tag when the page is idle', () => {
    const wrapper = app({ id: '113106427', enabled: true })
    expect(sent()[0]).toEqual([
      113106427,
      'init',
      expect.objectContaining({ ...YANDEX_METRIKA.options, url: location.href }),
    ])
    expect(document.querySelector('script[src*="tag_ww.js"]')).toBeNull()
    vi.runAllTimers()
    expect(document.querySelector('script')?.src).toBe(`${YANDEX_METRIKA.tag}?id=113106427`)
    wrapper.unmount()
  })

  it('sends every change of address once, with the address it came from', async () => {
    const wrapper = app({ id: '113106427', enabled: true })
    const from = location.href
    history.pushState(null, '', '/#/work/energy') // a project opened
    history.replaceState(null, '', '/#/work/energy') // the same address again: no hit
    await Promise.resolve()
    history.pushState(null, '', '/en/#/work/energy') // the language switched
    await Promise.resolve()
    const hits = sent().filter((call) => call[1] === 'hit')
    expect(hits).toEqual([
      [
        113106427,
        'hit',
        `${location.origin}/#/work/energy`,
        expect.objectContaining({ referer: from }),
      ],
      [
        113106427,
        'hit',
        `${location.origin}/en/#/work/energy`,
        expect.objectContaining({ referer: `${location.origin}/#/work/energy` }),
      ],
    ])
    wrapper.unmount()
  })

  it('gives the History API back when it stops', async () => {
    const pushState = history.pushState
    const wrapper = app({ id: '113106427', enabled: true })
    expect(history.pushState).not.toBe(pushState)
    wrapper.unmount()
    expect(history.pushState).toBe(pushState)
  })

  it('reaches goals', () => {
    const wrapper = app({ id: '113106427', enabled: true })
    wrapper.find('button').trigger('click')
    expect(sent().at(-1)).toEqual([113106427, 'reachGoal', 'cv_download', undefined])
    wrapper.unmount()
  })
})
