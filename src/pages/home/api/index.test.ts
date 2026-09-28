import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ContactError, sendContactRequest } from './index'

const payload = {
  name: 'Anna',
  contact: 'anna@example.com',
  message: 'A landing page',
  company: '',
}

/** The failure a send ends with, or null when it goes through. */
async function failureOf(send: Promise<void>) {
  try {
    await send
    return null
  } catch (error) {
    return error instanceof ContactError ? error.kind : 'other'
  }
}

describe('sendContactRequest', () => {
  beforeEach(() => vi.stubEnv('VITE_CONTACT_API_URL', 'https://api.example.test/contact'))
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('posts the letter, honeypot included, as JSON', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    expect(await failureOf(sendContactRequest(payload))).toBeNull()
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://api.example.test/contact')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual(payload)
  })

  it.each([
    [400, 'invalid'],
    [422, 'invalid'],
    [502, 'delivery'],
    [500, 'delivery'],
  ])('tells a %i from the backend as %s', async (status, kind) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })))
    expect(await failureOf(sendContactRequest(payload))).toBe(kind)
  })

  it('tells no connection apart', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    expect(await failureOf(sendContactRequest(payload))).toBe('network')
  })

  it('sends nothing without a backend configured (a demo)', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '')
    vi.useFakeTimers()
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const send = sendContactRequest(payload)
    await vi.advanceTimersByTimeAsync(800)
    expect(await failureOf(send)).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
