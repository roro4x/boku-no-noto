import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentWeather, resolveParticleSeason, resolveRainIntensity, resolveWeatherCondition, resolveWeatherEffect } from './weather'

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

const coordinates = { latitude: 55.7558, longitude: 37.6173 }
const primaryPayload = (overrides = {}) => ({ current: {
  weather_code: 63, temperature_2m: 8, precipitation: 0.8,
  rain: 0.8, showers: 0, snowfall: 0, wind_speed_10m: 5, wind_direction_10m: 90,
  ...overrides,
} })
const backupPayload = (overrides = {}) => ({ current_condition: [{
  weatherCode: '326', temp_C: '-2', precipMM: '0.2', windspeedKmph: '18', winddirDegree: '270',
  ...overrides,
}] })
const jsonResponse = (payload: unknown) => new Response(JSON.stringify(payload))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('weather providers', () => {
  it('uses Open-Meteo, requests m/s and only sends rounded coordinates', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(primaryPayload()))
    vi.stubGlobal('fetch', fetch)
    const weather = await fetchCurrentWeather(coordinates)
    expect(weather).toMatchObject({ source: 'open-meteo', windSpeed: 5, effect: 'rain' })
    const url = fetch.mock.calls[0][0] as URL
    expect(url.searchParams.get('wind_speed_unit')).toBe('ms')
    expect(url.searchParams.get('latitude')).toBe('55.76')
    expect(url.searchParams.get('longitude')).toBe('37.62')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it.each(['network', 'http', 'json', 'missing-data', 'invalid-number', 'unknown-code'])('falls back after %s failure', async (failure) => {
    const fetch = vi.fn()
    if (failure === 'network') fetch.mockRejectedValueOnce(new TypeError('Network error'))
    else if (failure === 'http') fetch.mockResolvedValueOnce(new Response('', { status: 503 }))
    else if (failure === 'json') fetch.mockResolvedValueOnce(new Response('<html>unavailable</html>'))
    else if (failure === 'missing-data') fetch.mockResolvedValueOnce(jsonResponse({ current: { weather_code: 0 } }))
    else if (failure === 'invalid-number') fetch.mockResolvedValueOnce(jsonResponse(primaryPayload({ wind_speed_10m: null })))
    else fetch.mockResolvedValueOnce(jsonResponse(primaryPayload({ weather_code: 999 })))
    fetch.mockResolvedValueOnce(jsonResponse(backupPayload()))
    vi.stubGlobal('fetch', fetch)
    const weather = await fetchCurrentWeather(coordinates)
    expect(weather).toMatchObject({ source: 'wttr', effect: 'snow', temperature: -2, windSpeed: 5, windDirection: 270 })
    expect(String(fetch.mock.calls[1][0])).toBe('https://wttr.in/55.76,37.62?format=j1')
  })

  it.each([
    ['113', 'clear'], ['122', 'cloudy'], ['248', 'fog'], ['266', 'drizzle'],
    ['302', 'rain'], ['308', 'heavy'], ['389', 'thunderstorm'], ['395', 'snow'],
  ])('normalises backup code %s to %s', async (code, condition) => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(jsonResponse(backupPayload({ weatherCode: code, precipMM: '0' }))))
    expect(resolveWeatherCondition(await fetchCurrentWeather(coordinates))).toBe(condition)
  })

  it('rejects when both providers fail', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('Offline'))
    vi.stubGlobal('fetch', fetch)
    await expect(fetchCurrentWeather(coordinates)).rejects.toMatchObject({ kind: 'network' })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it.each([{}, { temp_C: '' }, { weatherCode: '999' }, { windspeedKmph: '-3' }, { winddirDegree: '361' }])('rejects invalid backup data %j', async (invalid) => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(jsonResponse(Object.keys(invalid).length ? backupPayload(invalid) : {})))
    await expect(fetchCurrentWeather(coordinates)).rejects.toThrow()
  })

  it('tries the backup after an 8-second timeout', async () => {
    vi.useFakeTimers()
    const fetch = vi.fn().mockImplementationOnce((_url, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true })
    })).mockResolvedValueOnce(jsonResponse(backupPayload()))
    vi.stubGlobal('fetch', fetch)
    const pending = fetchCurrentWeather(coordinates)
    await vi.advanceTimersByTimeAsync(8000)
    expect((await pending).source).toBe('wttr')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('also bounds the backup request', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Offline')).mockImplementationOnce((_url, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true })
    })))
    const assertion = expect(fetchCurrentWeather(coordinates)).rejects.toMatchObject({ kind: 'timeout' })
    await vi.advanceTimersByTimeAsync(8000)
    await assertion
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not start a backup request when the caller cancels', async () => {
    const controller = new AbortController()
    const fetch = vi.fn().mockImplementation((_url, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true })
    }))
    vi.stubGlobal('fetch', fetch)
    const pending = fetchCurrentWeather(coordinates, controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not request weather with an already cancelled signal', async () => {
    const controller = new AbortController()
    controller.abort()
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(fetchCurrentWeather(coordinates, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('particle season', () => {
  it.each(['spring', 'summer', 'autumn', 'winter'] as const)('shows real snow during %s', (season) => {
    expect(resolveParticleSeason(season, 'snow')).toBe('winter')
  })
  it('preserves seasonal decoration in rain or without weather', () => {
    expect(resolveParticleSeason('autumn', 'rain')).toBe('autumn')
    expect(resolveParticleSeason('spring')).toBe('spring')
  })
})

describe('weather without device location', () => {
  it('uses approximate IP weather when device coordinates are unavailable', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(backupPayload()))
    vi.stubGlobal('fetch', fetch)
    const weather = await fetchCurrentWeather()
    expect(weather).toMatchObject({ source: 'wttr', approximate: true, windSpeed: 5 })
    expect(String(fetch.mock.calls[0][0])).toBe('https://wttr.in/?format=j1')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('reports an error if approximate weather is unavailable too', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')))
    await expect(fetchCurrentWeather()).rejects.toMatchObject({ kind: 'network' })
  })
})


describe('mobile compatibility and independent IP fallback', () => {
  it('requests weather when AbortSignal.throwIfAborted is unavailable', async () => {
    const controller = new AbortController()
    Object.defineProperty(controller.signal, 'throwIfAborted', { value: undefined })
    const fetch = vi.fn().mockResolvedValue(jsonResponse(primaryPayload()))
    vi.stubGlobal('fetch', fetch)
    await expect(fetchCurrentWeather(coordinates, controller.signal)).resolves.toMatchObject({ source: 'open-meteo' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('uses independent IP coordinates and Open-Meteo when IP weather is blocked', async () => {
    const fetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('Blocked'))
      .mockResolvedValueOnce(jsonResponse({ success: true, latitude: 55.7558, longitude: 37.6173 }))
      .mockResolvedValueOnce(jsonResponse(primaryPayload()))
    vi.stubGlobal('fetch', fetch)
    await expect(fetchCurrentWeather()).resolves.toMatchObject({ source: 'open-meteo', approximate: true })
    expect(String(fetch.mock.calls[1][0])).toBe('https://free.freeipapi.com/api/v1/json/')
    expect((fetch.mock.calls[2][0] as URL).searchParams.get('latitude')).toBe('55.76')
  })

  it('retains the coordinate weather fallback after independently resolving IP location', async () => {
    const fetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('Blocked'))
      .mockResolvedValueOnce(jsonResponse({ success: true, latitude: 55.75, longitude: 37.62 }))
      .mockRejectedValueOnce(new TypeError('Blocked'))
      .mockResolvedValueOnce(jsonResponse(backupPayload()))
    vi.stubGlobal('fetch', fetch)
    await expect(fetchCurrentWeather()).resolves.toMatchObject({ source: 'wttr', approximate: true })
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it.each([
    { success: false }, { success: true, latitude: 91, longitude: 37 },
    { success: true, latitude: null, longitude: 37 },
  ])('does not request weather for invalid network coordinates %j', async (location) => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('Blocked')).mockResolvedValue(jsonResponse(location))
    vi.stubGlobal('fetch', fetch)
    await expect(fetchCurrentWeather()).rejects.toMatchObject({ kind: 'response' })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('distinguishes HTTP errors from network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))
    await expect(fetchCurrentWeather(coordinates)).rejects.toMatchObject({ kind: 'response' })
  })
})


it('tries the second IP service after a quota failure', async () => {
  const fetch = vi.fn()
    .mockRejectedValueOnce(new TypeError('Blocked wttr'))
    .mockResolvedValueOnce(new Response('', { status: 429 }))
    .mockResolvedValueOnce(jsonResponse({ success: true, latitude: 55.75, longitude: 37.62 }))
    .mockResolvedValueOnce(jsonResponse(primaryPayload()))
  vi.stubGlobal('fetch', fetch)
  await expect(fetchCurrentWeather()).resolves.toMatchObject({ approximate: true, source: 'open-meteo' })
  expect((fetch.mock.calls[2][0] as URL).hostname).toBe('ipwho.is')
})

it('classifies quota errors returned inside an HTTP 200 response', async () => {
  vi.stubGlobal('fetch', vi.fn()
    .mockRejectedValueOnce(new TypeError('Blocked wttr'))
    .mockResolvedValueOnce(new Response('', { status: 429 }))
    .mockResolvedValueOnce(jsonResponse({ success: false, message: 'Rate limit exceeded' })))
  await expect(fetchCurrentWeather()).rejects.toMatchObject({ kind: 'limited' })
})
