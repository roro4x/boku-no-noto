import { describe, expect, it } from 'vitest'
import { isSiteLocale, resolveSiteLocale, siteCopy } from './i18n'

describe('site language copy', () => {
  it('keeps the Russian and Japanese interfaces structurally aligned', () => {
    expect(Object.keys(siteCopy.ja)).toEqual(Object.keys(siteCopy.ru))
  })

  it('recognizes only supported saved locales', () => {
    expect(isSiteLocale('ru')).toBe(true)
    expect(isSiteLocale('ja')).toBe(true)
    expect(isSiteLocale('en')).toBe(false)
    expect(isSiteLocale(null)).toBe(false)
  })

  it('uses Japanese when no saved preference exists', () => {
    expect(resolveSiteLocale(null)).toBe('ja')
    expect(resolveSiteLocale('invalid')).toBe('ja')
    expect(resolveSiteLocale('ru')).toBe('ru')
  })
})
