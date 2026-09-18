import { describe, expect, it } from 'vitest'
import { isSiteLocale, siteCopy } from './i18n'

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
})
