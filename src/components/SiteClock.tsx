import { useEffect, useState } from 'react'
import {
  formatJapaneseDate,
  formatZonedTime,
  MOSCOW_TIME_ZONE,
  TOKYO_TIME_ZONE,
} from '../data/homeGlance'
import type { SiteLocale } from '../i18n'

const clockCopy = {
  ru: {
    title: 'Сейчас',
    moscow: 'Москва',
    tokyo: 'Токио',
  },
  ja: {
    title: 'ただいま',
    moscow: 'モスクワ',
    tokyo: '東京',
  },
} as const

export function SiteClock({ locale }: { locale: SiteLocale }) {
  const copy = clockCopy[locale]
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="side-box site-clock" aria-labelledby="site-clock-title">
      <h2 id="site-clock-title">{copy.title}</h2>
      <time className="site-clock__date" dateTime={now.toISOString()} lang="ja">
        {formatJapaneseDate(now)}
      </time>
      <dl className="site-clock__clocks">
        <div>
          <dt>{copy.moscow}</dt>
          <dd><time dateTime={now.toISOString()}>{formatZonedTime(now, MOSCOW_TIME_ZONE)}</time></dd>
        </div>
        <div>
          <dt>{copy.tokyo}</dt>
          <dd><time dateTime={now.toISOString()}>{formatZonedTime(now, TOKYO_TIME_ZONE)}</time></dd>
        </div>
      </dl>
    </section>
  )
}

