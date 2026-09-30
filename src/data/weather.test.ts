import { describe, expect, it } from 'vitest'
import { resolveRainIntensity, resolveWeatherEffect } from './weather'

describe('resolveWeatherEffect', () => {
  it.each([51, 61, 65, 80, 82, 95, 99])('maps WMO code %s to rain', (code) => {
    expect(resolveWeatherEffect(code, 0, 0, 0)).toBe('rain')
  })

  it.each([71, 75, 77, 85, 86])('maps WMO code %s to snow', (code) => {
    expect(resolveWeatherEffect(code, 0, 0, 0)).toBe('snow')
  })

  it('uses measured rain when the weather code is dry', () => {
    expect(resolveWeatherEffect(3, 0.2, 0, 0)).toBe('rain')
  })

  it('keeps dry weather free of precipitation effects', () => {
    expect(resolveWeatherEffect(2, 0, 0, 0)).toBe('dry')
  })
})

describe('resolveRainIntensity', () => {
  it('keeps non-rain effects at none', () => {
    expect(resolveRainIntensity('dry', 3, 5)).toBe('none')
    expect(resolveRainIntensity('snow', 75, 5)).toBe('none')
  })

  it('maps weak precipitation to drizzle', () => {
    expect(resolveRainIntensity('rain', 51, 0.2)).toBe('drizzle')
  })

  it('maps moderate codes or precipitation to rain', () => {
    expect(resolveRainIntensity('rain', 63, 0.1)).toBe('rain')
    expect(resolveRainIntensity('rain', 61, 0.8)).toBe('rain')
  })

  it('maps heavy codes or precipitation to heavy rain', () => {
    expect(resolveRainIntensity('rain', 82, 0.1)).toBe('heavy')
    expect(resolveRainIntensity('rain', 61, 3)).toBe('heavy')
  })
})
