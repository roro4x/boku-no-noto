export type WeatherEffect = 'dry' | 'rain' | 'snow'
export type RainIntensity = 'none' | 'drizzle' | 'rain' | 'heavy'

export type WeatherSnapshot = {
  effect: WeatherEffect
  rainIntensity: RainIntensity
  weatherCode: number
  temperature: number
  precipitation: number
  windSpeed: number
  windDirection: number
}

type Coordinates = {
  latitude: number
  longitude: number
}

const rainCodes = new Set([
  51, 53, 55, 56, 57,
  61, 63, 65, 66, 67,
  80, 81, 82,
  95, 96, 97, 99,
])

const snowCodes = new Set([71, 73, 75, 77, 85, 86])
const moderateRainCodes = new Set([53, 63, 81, 95, 96])
const heavyRainCodes = new Set([55, 57, 65, 67, 82, 97, 99])

export const resolveWeatherEffect = (
  weatherCode: number,
  rain: number,
  showers: number,
  snowfall: number,
): WeatherEffect => {
  if (snowCodes.has(weatherCode) || snowfall > 0) return 'snow'
  if (rainCodes.has(weatherCode) || rain > 0 || showers > 0) return 'rain'
  return 'dry'
}

export const resolveRainIntensity = (
  effect: WeatherEffect,
  weatherCode: number,
  precipitation: number,
): RainIntensity => {
  if (effect !== 'rain') return 'none'
  if (heavyRainCodes.has(weatherCode) || precipitation >= 2.5) return 'heavy'
  if (moderateRainCodes.has(weatherCode) || precipitation >= 0.5) return 'rain'
  return 'drizzle'
}

const asFiniteNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

export const fetchCurrentWeather = async (
  coordinates: Coordinates,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> => {
  const endpoint = new URL('https://api.open-meteo.com/v1/forecast')
  endpoint.searchParams.set('latitude', coordinates.latitude.toFixed(2))
  endpoint.searchParams.set('longitude', coordinates.longitude.toFixed(2))
  endpoint.searchParams.set(
    'current',
    'temperature_2m,weather_code,precipitation,rain,showers,snowfall,wind_speed_10m,wind_direction_10m',
  )
  endpoint.searchParams.set('timezone', 'auto')
  endpoint.searchParams.set('forecast_days', '1')

  const response = await fetch(endpoint, { signal })
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`)

  const payload = await response.json() as { current?: Record<string, unknown> }
  if (!payload.current) throw new Error('Weather response has no current conditions')

  const weatherCode = asFiniteNumber(payload.current.weather_code, Number.NaN)
  if (!Number.isFinite(weatherCode)) throw new Error('Weather response has no weather code')

  const rain = asFiniteNumber(payload.current.rain)
  const showers = asFiniteNumber(payload.current.showers)
  const snowfall = asFiniteNumber(payload.current.snowfall)
  const precipitation = asFiniteNumber(payload.current.precipitation)
  const effect = resolveWeatherEffect(weatherCode, rain, showers, snowfall)

  return {
    effect,
    rainIntensity: resolveRainIntensity(effect, weatherCode, precipitation),
    weatherCode,
    temperature: asFiniteNumber(payload.current.temperature_2m),
    precipitation,
    windSpeed: asFiniteNumber(payload.current.wind_speed_10m),
    windDirection: asFiniteNumber(payload.current.wind_direction_10m),
  }
}
