import type { Season } from './season'

export type WeatherEffect = 'dry' | 'rain' | 'snow'
export type RainIntensity = 'none' | 'drizzle' | 'rain' | 'heavy'
export type WeatherCondition = 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'heavy' | 'snow' | 'thunderstorm'
export type WeatherSource = 'open-meteo' | 'wttr'

export const weatherSources = {
  'open-meteo': { name: 'Open-Meteo', url: 'https://open-meteo.com/' },
  wttr: { name: 'wttr.in', url: 'https://wttr.in/' },
} as const

export type WeatherSnapshot = {
  source: WeatherSource
  effect: WeatherEffect
  rainIntensity: RainIntensity
  weatherCode: number
  temperature: number
  precipitation: number
  windSpeed: number // metres per second, for both providers
  windDirection: number
}

type Coordinates = { latitude: number; longitude: number }
const requestTimeoutMs = 8000
const rainCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])
const snowCodes = new Set([71, 73, 75, 77, 85, 86])
const moderateRainCodes = new Set([53, 63, 81, 95, 96])
const heavyRainCodes = new Set([55, 57, 65, 67, 82, 99])
const wmoCodes = new Set([0, 1, 2, 3, 45, 48, ...rainCodes, ...snowCodes])

export const resolveWeatherEffect = (weatherCode: number, rain: number, showers: number, snowfall: number): WeatherEffect => {
  if (snowCodes.has(weatherCode) || snowfall > 0) return 'snow'
  if (rainCodes.has(weatherCode) || rain > 0 || showers > 0) return 'rain'
  return 'dry'
}

export const resolveRainIntensity = (effect: WeatherEffect, weatherCode: number, precipitation: number): RainIntensity => {
  if (effect !== 'rain') return 'none'
  if (heavyRainCodes.has(weatherCode) || precipitation >= 2.5) return 'heavy'
  if (moderateRainCodes.has(weatherCode) || precipitation >= 0.5) return 'rain'
  return 'drizzle'
}

export const resolveWeatherCondition = (weather: WeatherSnapshot): WeatherCondition => {
  if (weather.weatherCode >= 95) return 'thunderstorm'
  if (weather.effect === 'snow') return 'snow'
  if (weather.effect === 'rain') return weather.rainIntensity === 'none' ? 'rain' : weather.rainIntensity
  if (weather.weatherCode === 45 || weather.weatherCode === 48) return 'fog'
  if (weather.weatherCode >= 1 && weather.weatherCode <= 3) return 'cloudy'
  return 'clear'
}

export const resolveParticleSeason = (season: Season, effect?: WeatherEffect): Season =>
  effect === 'snow' ? 'winter' : season

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid weather response')
  return value as Record<string, unknown>
}

const number = (value: unknown, allowString = false): number => {
  const parsed = allowString && typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) throw new Error('Invalid weather value')
  return parsed
}

const nonnegative = (value: unknown, allowString = false) => {
  const parsed = number(value, allowString)
  if (parsed < 0) throw new Error('Negative weather value')
  return parsed
}

const direction = (value: unknown, allowString = false) => {
  const parsed = number(value, allowString)
  if (parsed < 0 || parsed > 360) throw new Error('Invalid wind direction')
  return parsed
}

// WWO condition codes used by wttr.in, normalised to the WMO codes used above.
// https://www.worldweatheronline.com/weather-api/api/docs/weather-icons.aspx
const wttrToWmo: Record<number, number> = {
  113: 0, 116: 2, 119: 3, 122: 3, 143: 45,
  176: 61, 179: 71, 182: 71, 185: 56, 200: 95, 227: 75, 230: 75,
  248: 45, 260: 48, 263: 51, 266: 51, 281: 56, 284: 57,
  293: 61, 296: 61, 299: 63, 302: 63, 305: 65, 308: 65,
  311: 66, 314: 67, 317: 71, 320: 73, 323: 71, 326: 71,
  329: 73, 332: 73, 335: 75, 338: 75, 350: 77,
  353: 80, 356: 81, 359: 82, 362: 85, 365: 86, 368: 85, 371: 86,
  374: 77, 377: 77, 386: 95, 389: 99, 392: 71, 395: 75,
}

const readOpenMeteo = (payload: unknown): WeatherSnapshot => {
  const current = record(record(payload).current)
  const weatherCode = number(current.weather_code)
  if (!wmoCodes.has(weatherCode)) throw new Error('Unknown WMO weather code')
  const effect = resolveWeatherEffect(weatherCode, nonnegative(current.rain), nonnegative(current.showers), nonnegative(current.snowfall))
  const precipitation = nonnegative(current.precipitation)
  return {
    source: 'open-meteo', effect, weatherCode, precipitation,
    rainIntensity: resolveRainIntensity(effect, weatherCode, precipitation),
    temperature: number(current.temperature_2m),
    windSpeed: nonnegative(current.wind_speed_10m),
    windDirection: direction(current.wind_direction_10m),
  }
}

const readWttr = (payload: unknown): WeatherSnapshot => {
  const conditions = record(payload).current_condition
  if (!Array.isArray(conditions) || !conditions.length) throw new Error('Missing current weather')
  const current = record(conditions[0])
  const weatherCode = wttrToWmo[number(current.weatherCode, true)]
  if (weatherCode === undefined) throw new Error('Unknown wttr weather code')
  const precipitation = nonnegative(current.precipMM, true)
  const effect = resolveWeatherEffect(weatherCode, precipitation, 0, 0)
  return {
    source: 'wttr', effect, weatherCode, precipitation,
    rainIntensity: resolveRainIntensity(effect, weatherCode, precipitation),
    temperature: number(current.temp_C, true),
    windSpeed: nonnegative(current.windspeedKmph, true) / 3.6,
    windDirection: direction(current.winddirDegree, true),
  }
}

// Bound each complete request (including its body), and preserve caller cancellation.
const requestWeather = async (url: URL, parse: (payload: unknown) => WeatherSnapshot, signal?: AbortSignal) => {
  signal?.throwIfAborted()
  const controller = new AbortController()
  const cancel = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', cancel, { once: true })
  const timer = setTimeout(() => controller.abort(new DOMException('Weather request timed out', 'TimeoutError')), requestTimeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`)
    return parse(await response.json())
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}

export const fetchCurrentWeather = async (coordinates: Coordinates, signal?: AbortSignal): Promise<WeatherSnapshot> => {
  const latitude = coordinates.latitude.toFixed(2)
  const longitude = coordinates.longitude.toFixed(2)
  const primary = new URL('https://api.open-meteo.com/v1/forecast')
  primary.searchParams.set('latitude', latitude)
  primary.searchParams.set('longitude', longitude)
  primary.searchParams.set('current', 'temperature_2m,weather_code,precipitation,rain,showers,snowfall,wind_speed_10m,wind_direction_10m')
  primary.searchParams.set('wind_speed_unit', 'ms')
  primary.searchParams.set('timezone', 'auto')
  primary.searchParams.set('forecast_days', '1')
  try {
    return await requestWeather(primary, readOpenMeteo, signal)
  } catch {
    signal?.throwIfAborted()
    const backup = new URL(`https://wttr.in/${latitude},${longitude}`)
    backup.searchParams.set('format', 'j1')
    return requestWeather(backup, readWttr, signal)
  }
}
