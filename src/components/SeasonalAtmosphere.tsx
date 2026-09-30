import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { resolveSeason, type Season } from '../data/season'
import {
  fetchCurrentWeather,
  type RainIntensity,
  type WeatherEffect,
  type WeatherSnapshot,
} from '../data/weather'
import type { SiteLocale } from '../i18n'

type SeasonMode = 'auto' | 'off'

type ParticleStyle = CSSProperties & {
  '--season-x': string
  '--season-delay': string
  '--season-duration': string
  '--season-drift': string
  '--season-size': string
  '--season-effective-duration'?: string
  '--season-return'?: string
}

type RainStyle = CSSProperties & {
  '--rain-x': string
  '--rain-delay': string
  '--rain-duration': string
  '--rain-effective-duration'?: string
}

type AtmosphereStyle = CSSProperties & {
  '--weather-wind-mid': string
  '--weather-wind-end': string
  '--weather-rain-drift': string
  '--weather-rain-angle': string
}

type WeatherStatus = 'off' | 'locating' | 'loading' | 'ready' | 'denied' | 'error'
type WeatherCondition = 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'heavy' | 'snow' | 'thunderstorm'

const seasonStorageKey = 'boku-no-noto-season-mode'
const weatherStorageKey = 'boku-no-noto-local-weather'
const weatherCacheKey = 'boku-no-noto-weather-cache-v2'
const weatherRefreshMs = 30 * 60 * 1000
const weatherRetryMs = 5 * 60 * 1000

const particles: ParticleStyle[] = [
  { '--season-x': '3%', '--season-delay': '-4s', '--season-duration': '18s', '--season-drift': '28px', '--season-size': '8px' },
  { '--season-x': '9%', '--season-delay': '-12s', '--season-duration': '24s', '--season-drift': '-18px', '--season-size': '6px' },
  { '--season-x': '16%', '--season-delay': '-7s', '--season-duration': '21s', '--season-drift': '22px', '--season-size': '10px' },
  { '--season-x': '24%', '--season-delay': '-16s', '--season-duration': '27s', '--season-drift': '-32px', '--season-size': '7px' },
  { '--season-x': '33%', '--season-delay': '-2s', '--season-duration': '20s', '--season-drift': '16px', '--season-size': '6px' },
  { '--season-x': '43%', '--season-delay': '-18s', '--season-duration': '25s', '--season-drift': '-24px', '--season-size': '9px' },
  { '--season-x': '57%', '--season-delay': '-9s', '--season-duration': '22s', '--season-drift': '30px', '--season-size': '7px' },
  { '--season-x': '66%', '--season-delay': '-14s', '--season-duration': '28s', '--season-drift': '-20px', '--season-size': '10px' },
  { '--season-x': '75%', '--season-delay': '-5s', '--season-duration': '19s', '--season-drift': '18px', '--season-size': '6px' },
  { '--season-x': '84%', '--season-delay': '-20s', '--season-duration': '26s', '--season-drift': '-34px', '--season-size': '8px' },
  { '--season-x': '91%', '--season-delay': '-10s', '--season-duration': '23s', '--season-drift': '24px', '--season-size': '9px' },
  { '--season-x': '97%', '--season-delay': '-1s', '--season-duration': '29s', '--season-drift': '-16px', '--season-size': '6px' },
]

const rainDrops: RainStyle[] = Array.from({ length: 30 }, (_, index) => ({
  '--rain-x': `${3 + ((index * 17) % 94)}%`,
  '--rain-delay': `${-(index % 9) * 0.17}s`,
  '--rain-duration': `${0.9 + (index % 5) * 0.12}s`,
}))

const copy = {
  ru: {
    title: 'Время года',
    controls: 'Сезонное оформление',
    auto: 'АВТО',
    off: 'ВЫКЛ',
    disabled: 'Атмосфера отключена',
    weatherButton: 'ПОГОДА',
    weatherTitle: 'Погода рядом',
    weatherEnable: 'ВКЛ',
    weatherDisable: 'ВЫКЛ',
    weatherEnableLabel: 'Включить погоду по моему местоположению',
    weatherDisableLabel: 'Отключить погоду по моему местоположению',
    weatherOff: 'не включена',
    locating: 'определяем место',
    loading: 'получаем данные',
    drizzle: 'морось',
    rain: 'дождь',
    heavy: 'ливень',
    snow: 'снег',
    dry: 'сухо',
    denied: 'нет доступа к месту',
    weatherError: 'повторим позже',
    weatherEnableHint: 'нажмите «ВКЛ»',
    weatherLocationHint: 'по геолокации',
    weatherFallbackHint: 'сезонный эффект работает',
    wind: 'ветер',
    windUnit: 'м/с',
    condition: {
      clear: 'ясно',
      cloudy: 'облачно',
      fog: 'туман',
      drizzle: 'морось',
      rain: 'дождь',
      heavy: 'ливень',
      snow: 'снег',
      thunderstorm: 'гроза',
    },
    privacyBefore: 'Геолокация → ',
    privacyAfter: '',
    season: {
      winter: 'Зима · тихий снег',
      spring: 'Весна · лепестки сакуры',
      summer: 'Лето · солнечный свет',
      autumn: 'Осень · листопад',
    },
  },
  ja: {
    title: '季節',
    controls: '季節の演出',
    auto: '自動',
    off: 'オフ',
    disabled: '季節の演出はオフです',
    weatherButton: '天気',
    weatherTitle: '現在の天気',
    weatherEnable: 'オン',
    weatherDisable: 'オフ',
    weatherEnableLabel: '現在地の天気をオンにする',
    weatherDisableLabel: '現在地の天気をオフにする',
    weatherOff: 'オフです',
    locating: '現在地を確認中',
    loading: '天気を取得中',
    drizzle: '霧雨',
    rain: '雨',
    heavy: '大雨',
    snow: '雪',
    dry: '晴れ',
    denied: '位置情報なし',
    weatherError: '後で再試行',
    weatherEnableHint: '「オン」で表示',
    weatherLocationHint: '位置情報を使用',
    weatherFallbackHint: '季節の演出は動作中',
    wind: '風',
    windUnit: 'm/s',
    condition: {
      clear: '晴れ',
      cloudy: 'くもり',
      fog: '霧',
      drizzle: '霧雨',
      rain: '雨',
      heavy: '大雨',
      snow: '雪',
      thunderstorm: '雷雨',
    },
    privacyBefore: '位置情報 → ',
    privacyAfter: '',
    season: {
      winter: '冬・静かな雪',
      spring: '春・桜の花びら',
      summer: '夏・木漏れ日',
      autumn: '秋・木の葉',
    },
  },
} as const

const getInitialMode = (): SeasonMode => {
  try {
    return window.localStorage.getItem(seasonStorageKey) === 'off' ? 'off' : 'auto'
  } catch {
    return 'auto'
  }
}

const getInitialWeatherEnabled = () => {
  try {
    return window.localStorage.getItem(weatherStorageKey) === 'on'
  } catch {
    return false
  }
}

const getVisitorCoordinates = () => new Promise<GeolocationCoordinates>((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Geolocation is unavailable'))
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => resolve(position.coords),
    reject,
    {
      enableHighAccuracy: false,
      maximumAge: 15 * 60 * 1000,
      timeout: 10 * 1000,
    },
  )
})

const isPermissionDenied = (error: unknown) =>
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && error.code === 1

const isWeatherEffect = (value: unknown): value is WeatherEffect =>
  value === 'dry' || value === 'rain' || value === 'snow'

const isRainIntensity = (value: unknown): value is RainIntensity =>
  value === 'none' || value === 'drizzle' || value === 'rain' || value === 'heavy'

const isWeatherSnapshot = (value: unknown): value is WeatherSnapshot => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<WeatherSnapshot>
  return isWeatherEffect(candidate.effect)
    && isRainIntensity(candidate.rainIntensity)
    && [
      candidate.weatherCode,
      candidate.temperature,
      candidate.precipitation,
      candidate.windSpeed,
      candidate.windDirection,
    ].every((item) => typeof item === 'number' && Number.isFinite(item))
}

const readCachedWeather = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(weatherCacheKey) ?? 'null') as {
      expiresAt?: unknown
      weather?: unknown
    } | null
    if (!parsed || typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Date.now()) {
      return null
    }
    if (!isWeatherSnapshot(parsed.weather)) return null
    return { expiresAt: parsed.expiresAt, weather: parsed.weather }
  } catch {
    return null
  }
}

const cacheWeather = (weather: WeatherSnapshot) => {
  try {
    window.localStorage.setItem(weatherCacheKey, JSON.stringify({
      expiresAt: Date.now() + weatherRefreshMs,
      weather,
    }))
  } catch {
    // Live weather still works when storage is unavailable.
  }
}

const clearWeatherCache = () => {
  try {
    window.localStorage.removeItem(weatherCacheKey)
  } catch {
    // Nothing else depends on removing the cache.
  }
}

const clamp = (minimum: number, value: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))

const getAtmosphereStyle = (weather: WeatherSnapshot | null): AtmosphereStyle => {
  if (!weather) {
    return {
      '--weather-wind-mid': '0px',
      '--weather-wind-end': '0px',
      '--weather-rain-drift': '0px',
      '--weather-rain-angle': '0deg',
    }
  }

  const radians = weather.windDirection * Math.PI / 180
  const horizontalWind = clamp(-110, -Math.sin(radians) * weather.windSpeed * 2.2, 110)
  return {
    '--weather-wind-mid': `${Math.round(horizontalWind * 0.45)}px`,
    '--weather-wind-end': `${Math.round(horizontalWind * 1.2)}px`,
    '--weather-rain-drift': `${Math.round(horizontalWind * 1.6)}px`,
    '--weather-rain-angle': `${Math.round(clamp(-14, horizontalWind / 7, 14))}deg`,
  }
}

const getParticleStyle = (
  style: ParticleStyle,
  weather: WeatherSnapshot | null,
): ParticleStyle => {
  const duration = Number.parseFloat(style['--season-duration'])
  const drift = Number.parseFloat(style['--season-drift'])
  const windBoost = Math.min(8, (weather?.windSpeed ?? 0) / 7)
  return {
    ...style,
    '--season-effective-duration': `${Math.max(10, duration - windBoost).toFixed(2)}s`,
    '--season-return': `${Math.round(drift * -0.35)}px`,
  }
}

const getRainStyle = (style: RainStyle, intensity: RainIntensity): RainStyle => {
  const factor = intensity === 'heavy' ? 0.72 : intensity === 'drizzle' ? 1.25 : 1
  return {
    ...style,
    '--rain-effective-duration': `${(Number.parseFloat(style['--rain-duration']) * factor).toFixed(2)}s`,
  }
}

const resolveWeatherCondition = (weather: WeatherSnapshot): WeatherCondition => {
  if (weather.weatherCode >= 95) return 'thunderstorm'
  if (weather.effect === 'snow') return 'snow'
  if (weather.effect === 'rain') {
    return weather.rainIntensity === 'none' ? 'rain' : weather.rainIntensity
  }
  if (weather.weatherCode === 45 || weather.weatherCode === 48) return 'fog'
  if (weather.weatherCode >= 1 && weather.weatherCode <= 3) return 'cloudy'
  return 'clear'
}

const formatTemperature = (temperature: number) => {
  const rounded = Math.round(temperature)
  return `${rounded > 0 ? '+' : ''}${rounded}°`
}

function WeatherGlyph({ condition }: { condition: WeatherCondition | 'idle' }) {
  if (condition === 'idle') {
    return (
      <svg className="weather-glyph" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 27s8-7.1 8-14a8 8 0 1 0-16 0c0 6.9 8 14 8 14Z" />
        <circle cx="16" cy="13" r="2.8" />
      </svg>
    )
  }

  if (condition === 'clear') {
    return (
      <svg className="weather-glyph" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="5.5" />
        <path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M25.2 6.8l-2.8 2.8M9.6 22.4l-2.8 2.8" />
      </svg>
    )
  }

  const hasRain = condition === 'drizzle' || condition === 'rain' || condition === 'heavy' || condition === 'thunderstorm'
  return (
    <svg className="weather-glyph" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 20.5h15.2a5 5 0 0 0 .2-10 8 8 0 0 0-15-1.7A6 6 0 0 0 8 20.5Z" />
      {condition === 'fog' && <path d="M7 24h18M10 28h12" />}
      {hasRain && <path d="m10 24-1.2 3M17 24l-1.2 3M24 24l-1.2 3" />}
      {condition === 'snow' && (
        <>
          <circle cx="10" cy="26" r="1" />
          <circle cx="17" cy="25" r="1" />
          <circle cx="24" cy="27" r="1" />
        </>
      )}
    </svg>
  )
}

export function SeasonalAtmosphere({ locale }: { locale: SiteLocale }) {
  const [mode, setMode] = useState<SeasonMode>(getInitialMode)
  const [weatherEnabled, setWeatherEnabled] = useState(getInitialWeatherEnabled)
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>(
    weatherEnabled ? 'locating' : 'off',
  )
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [weatherRefreshToken, setWeatherRefreshToken] = useState(0)
  const season: Season = resolveSeason(new Date())
  const text = copy[locale]
  const isEnabled = mode === 'auto'
  const weatherEffect = weather?.effect ?? null
  const rainIntensity = weather?.rainIntensity ?? 'none'
  const weatherCondition = weather ? resolveWeatherCondition(weather) : null
  const weatherStatusText = weatherStatus === 'off'
      ? text.weatherOff
      : weatherStatus === 'locating'
        ? text.locating
        : weatherStatus === 'loading'
          ? text.loading
          : weatherStatus === 'denied'
            ? text.denied
            : text.weatherError
  const weatherStatusHint = weatherStatus === 'off'
    ? text.weatherEnableHint
    : weatherStatus === 'locating' || weatherStatus === 'denied'
      ? text.weatherLocationHint
      : weatherStatus === 'loading'
        ? 'Open-Meteo'
        : text.weatherFallbackHint
  const atmosphere = isEnabled
    ? createPortal(
        <div
          className="seasonal-atmosphere"
          data-weather={weatherEffect ?? 'seasonal'}
          data-rain={rainIntensity}
          style={getAtmosphereStyle(weather)}
          aria-hidden="true"
        >
          {particles.map((style, index) => (
            <span
              className="seasonal-particle"
              style={getParticleStyle(style, weather)}
              key={index}
            >
              {season === 'autumn' && (
                <svg
                  className="seasonal-maple-leaf"
                  viewBox="0 0 24 24"
                  focusable="false"
                >
                  <path d="M12 1 10.7 5.2 8.2 3.4 8.9 7.2 4.8 5.9 6.5 9.2 2.4 10.6 6.9 12.5 5.4 16.2 10.7 14.4 11.5 18.5h1l.8-4.1 5.3 1.8-1.5-3.7 4.5-1.9-4.1-1.4 1.7-3.3-4.1 1.3.7-3.8-2.5 1.8Z" />
                  <path className="seasonal-maple-stem" d="M12 16.5v6" />
                </svg>
              )}
            </span>
          ))}
          {weatherEffect === 'rain' && (
            <div className="weather-rain">
              {rainDrops.map((style, index) => (
                <span
                  className="weather-raindrop"
                  style={getRainStyle(style, rainIntensity)}
                  key={index}
                />
              ))}
            </div>
          )}
        </div>,
        document.body,
      )
    : null

  useEffect(() => {
    const root = document.documentElement
    root.dataset.season = isEnabled ? season : 'off'

    try {
      window.localStorage.setItem(seasonStorageKey, mode)
    } catch {
      // The control still works for this visit when storage is unavailable.
    }

    return () => {
      delete root.dataset.season
    }
  }, [isEnabled, mode, season])

  useEffect(() => {
    try {
      if (weatherEnabled) {
        window.localStorage.setItem(weatherStorageKey, 'on')
      } else {
        window.localStorage.removeItem(weatherStorageKey)
      }
    } catch {
      // Weather mode still works for this visit when storage is unavailable.
    }
  }, [weatherEnabled])

  useEffect(() => {
    if (!weatherEnabled || !isEnabled) return

    let active = true
    const controller = new AbortController()
    let refreshTimer: number | undefined

    const scheduleRefresh = (delay: number) => {
      refreshTimer = window.setTimeout(
        () => setWeatherRefreshToken((token) => token + 1),
        delay,
      )
    }

    const loadWeather = async () => {
      const cached = readCachedWeather()
      if (cached) {
        setWeather(cached.weather)
        setWeatherStatus('ready')
        scheduleRefresh(Math.max(1000, cached.expiresAt - Date.now()))
        return
      }

      setWeatherStatus('locating')
      try {
        const coordinates = await getVisitorCoordinates()
        if (!active) return
        setWeatherStatus('loading')
        const weather = await fetchCurrentWeather(
          {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          },
          controller.signal,
        )
        if (!active) return
        setWeather(weather)
        setWeatherStatus('ready')
        cacheWeather(weather)
        scheduleRefresh(weatherRefreshMs)
      } catch (error) {
        if (!active || controller.signal.aborted) return
        setWeather(null)
        setWeatherStatus(isPermissionDenied(error) ? 'denied' : 'error')
        if (isPermissionDenied(error)) {
          clearWeatherCache()
          setWeatherEnabled(false)
        } else {
          scheduleRefresh(weatherRetryMs)
        }
      }
    }

    void loadWeather()
    return () => {
      active = false
      controller.abort()
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer)
    }
  }, [isEnabled, weatherEnabled, weatherRefreshToken])

  useEffect(() => {
    if (!weatherEnabled || !isEnabled) return

    const requestRefresh = () => {
      if (!document.hidden && navigator.onLine) {
        setWeatherRefreshToken((token) => token + 1)
      }
    }

    const handleVisibility = () => {
      if (!document.hidden) requestRefresh()
    }

    window.addEventListener('online', requestRefresh)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('online', requestRefresh)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isEnabled, weatherEnabled])

  useEffect(() => {
    const root = document.documentElement
    const updateVisibility = () => {
      root.toggleAttribute('data-season-paused', document.hidden)
    }

    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility)
      root.removeAttribute('data-season-paused')
    }
  }, [])

  return (
    <>
      {atmosphere}

      <section className="side-box season-box" aria-labelledby="season-title">
        <h2 id="season-title">{text.title}</h2>
        <div className="season-switcher" role="group" aria-label={text.controls}>
          <button
            type="button"
            aria-pressed={mode === 'auto'}
            onClick={() => setMode('auto')}
          >
            {text.auto}
          </button>
          <button
            type="button"
            aria-pressed={mode === 'off'}
            onClick={() => setMode('off')}
          >
            {text.off}
          </button>
        </div>
        <p className="season-status" aria-live="polite">
          {isEnabled ? text.season[season] : text.disabled}
        </p>
        <div className="weather-board" data-state={weatherStatus}>
          <div className="weather-board-head">
            <span>{text.weatherTitle}</span>
            <button
              className="weather-toggle"
              type="button"
              aria-label={weatherEnabled ? text.weatherDisableLabel : text.weatherEnableLabel}
              aria-pressed={weatherEnabled}
              aria-describedby="weather-privacy"
              onClick={() => {
                if (weatherEnabled) {
                  setWeather(null)
                  setWeatherStatus('off')
                  setWeatherEnabled(false)
                  clearWeatherCache()
                } else {
                  setWeatherStatus('locating')
                  setWeatherEnabled(true)
                }
              }}
            >
              {weatherEnabled ? text.weatherDisable : text.weatherEnable}
            </button>
          </div>
          <div
            className="weather-board-reading"
            data-ready={weatherStatus === 'ready' && weather ? 'true' : 'false'}
            aria-live="polite"
          >
            <WeatherGlyph condition={weatherCondition ?? 'idle'} />
            {weatherStatus === 'ready' && weather && weatherCondition ? (
              <>
                <strong className="weather-temperature">
                  {formatTemperature(weather.temperature)}
                </strong>
                <div className="weather-summary">
                  <strong>{text.condition[weatherCondition]}</strong>
                  <span className="weather-wind">
                    <svg
                      viewBox="0 0 12 12"
                      aria-hidden="true"
                      style={{ transform: `rotate(${weather.windDirection + 180}deg)` }}
                    >
                      <path d="M6 1v9M2.5 6.5 6 10l3.5-3.5" />
                    </svg>
                    {text.wind} {Math.round(weather.windSpeed)} {text.windUnit}
                  </span>
                </div>
              </>
            ) : (
              <div className="weather-summary">
                <strong>{weatherStatusText}</strong>
                <span>{weatherStatusHint}</span>
              </div>
            )}
          </div>
        </div>
        <p className="weather-privacy" id="weather-privacy">
          {text.privacyBefore}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>
          {text.privacyAfter}
        </p>
      </section>
    </>
  )
}
