import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONSENT_TTL_MS,
  clearAnalyticsCookies,
  consent,
  onConsentChange,
  reloadConsent,
  setConsent,
} from './consent'

const KEY = 'consent:analytics'
const store = (value: string, at: number) =>
  localStorage.setItem(KEY, JSON.stringify({ value, at }))

describe('consent', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadConsent()
    delete window.ym
    delete window.gtag
  })
  afterEach(() => {
    vi.restoreAllMocks()
    delete window.ym
    delete window.gtag
  })

  it('has no answer at first', () => {
    expect(consent.analytics).toBeNull()
    expect(consent.granted).toBe(false)
  })

  it('keeps the answer, and tells whoever listens', () => {
    const heard: unknown[] = []
    const off = onConsentChange((v) => heard.push(v))
    setConsent('granted')
    expect(consent.granted).toBe(true)
    expect(heard).toEqual(['granted'])
    reloadConsent()
    expect(consent.analytics).toBe('granted')
    off()
  })

  it('asks again after half a year', () => {
    store('denied', Date.now() - CONSENT_TTL_MS + 60_000)
    reloadConsent()
    expect(consent.analytics).toBe('denied')
    store('denied', Date.now() - CONSENT_TTL_MS - 60_000)
    reloadConsent()
    expect(consent.analytics).toBeNull()
  })

  it('ignores a broken record', () => {
    localStorage.setItem(KEY, '{nope')
    reloadConsent()
    expect(consent.analytics).toBeNull()
    store('maybe', Date.now())
    reloadConsent()
    expect(consent.analytics).toBeNull()
  })

  it('declining before anything ran reloads nothing', () => {
    const reload = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...location, reload } as Location)
    setConsent('denied')
    expect(reload).not.toHaveBeenCalled()
  })

  it('taking consent back once the counters ran clears their cookies and reloads', () => {
    setConsent('granted')
    window.ym = () => {}
    document.cookie = '_ym_uid=1; path=/'
    document.cookie = '_ga=GA1.1; path=/'
    document.cookie = 'graphics=keep; path=/'
    const reload = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...location, reload } as Location)
    setConsent('denied')
    expect(reload).toHaveBeenCalledOnce()
    expect(document.cookie).not.toMatch(/_ym_uid|_ga=/)
    expect(document.cookie).toMatch(/graphics=keep/)
  })

  it("clears only the counters' cookies", () => {
    document.cookie = '_gid=x; path=/'
    document.cookie = 'other=y; path=/'
    clearAnalyticsCookies()
    expect(document.cookie).not.toMatch(/_gid/)
    expect(document.cookie).toMatch(/other=y/)
  })
})
