import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  absoluteUrl,
  localeFromPath,
  localeUrlPath,
} from './site'

describe('site config', () => {
  it('serves Russian from the root and English from /en/', () => {
    expect(SUPPORTED_LOCALES).toEqual(['ru', 'en'])
    expect(DEFAULT_LOCALE).toBe('ru')
    expect(localeUrlPath('ru')).toBe('/')
    expect(localeUrlPath('en')).toBe('/en/')
  })

  it('reads the locale off any path, with or without a trailing slash', () => {
    expect(localeFromPath('/')).toBe('ru')
    expect(localeFromPath('/#contact')).toBe('ru')
    expect(localeFromPath('/en')).toBe('en')
    expect(localeFromPath('/en/')).toBe('en')
    expect(localeFromPath('/en/anything')).toBe('en')
    // Not a locale prefix — must not be mistaken for one.
    expect(localeFromPath('/energy')).toBe('ru')
  })

  it('builds absolute URLs without doubling slashes', () => {
    expect(absoluteUrl('/')).toMatch(/^https?:\/\/[^/]+\/$/)
    expect(absoluteUrl('en/')).toBe(absoluteUrl('/en/'))
    expect(absoluteUrl('/og-ru.jpg').endsWith('//og-ru.jpg')).toBe(false)
  })
})
