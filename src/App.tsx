import { useEffect, useRef, useState } from 'react'
import { NihongoCatalog } from './components/NihongoCatalog'
import { TextArchive } from './components/TextArchive'
import { categories, type StudyCategory } from './data/study'
import { isSiteLocale, siteCopy, type SiteLocale } from './i18n'

type Route =
  | { page: 'home' }
  | { page: 'nihongo'; category: StudyCategory; itemId?: string }
  | { page: 'texts'; slug?: string }

const parseRoute = (): Route => {
  const path = (window.location.hash || '#/').slice(1).split('?')[0]
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'texts') return { page: 'texts', slug: parts[1] }
  if (parts[0] !== 'nihongo') return { page: 'home' }
  const category = categories.some((item) => item.id === parts[1])
    ? (parts[1] as StudyCategory)
    : 'grammar'
  return { page: 'nihongo', category, itemId: parts[2] }
}

const getInitialLocale = (): SiteLocale => {
  try {
    const savedLocale = window.localStorage.getItem('boku-no-noto-locale')
    return isSiteLocale(savedLocale) ? savedLocale : 'ru'
  } catch {
    return 'ru'
  }
}

const formatPlayerTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function App() {
  const [route, setRoute] = useState(parseRoute)
  const [locale, setLocale] = useState<SiteLocale>(getInitialLocale)
  const copy = siteCopy[locale]

  useEffect(() => {
    const updateRoute = () => setRoute(parseRoute())
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  useEffect(() => {
    document.title = route.page === 'texts'
      ? '日本語の文章 · 僕のノート'
      : route.page === 'nihongo'
        ? '日本語 · N5 · 僕のノート'
        : '僕のノート · Boku no Nōto'
  }, [route.page])

  useEffect(() => {
    document.documentElement.lang = copy.htmlLang
    try {
      window.localStorage.setItem('boku-no-noto-locale', locale)
    } catch {
      // The language still works for this visit when storage is unavailable.
    }
  }, [copy.htmlLang, locale])

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        {copy.skip}
      </a>

      <div className="page-shell">
        <header className="site-header" aria-labelledby="site-title">
          <div className="header-copy">
            <h1 id="site-title" lang="ja">
              僕のノート
            </h1>
            <p className="header-roman">
              <span lang="ja">ぼくの小さなホームページ</span> · Boku no Nōto
            </p>
          </div>

          <div className="pond-window">
            <img
              className="frog-mascot"
              src={`${import.meta.env.BASE_URL}assets/frog/frog-notebook.png`}
              width="512"
              height="512"
              alt={copy.frogAlt}
            />
            <span className="pond-caption" lang="ja">僕のノートへようこそ！</span>
          </div>
        </header>

        <div className="marquee-strip" aria-label={copy.siteStatus}>
          <span aria-hidden="true">◆</span>
          <span lang="ja">このホームページは工事中です</span>
          <span aria-hidden="true">◆</span>
        </div>

        <div className="page-grid">
          <nav className="nav-board" aria-label={copy.mainNavigation}>
              <h2 lang="ja">メニュー</h2>
              <ul>
                <li>
                  <a href="#/" aria-current={route.page === 'home' ? 'page' : undefined}>
                    <span className="nav-marker" aria-hidden="true" /> {copy.homeNav}
                  </a>
                </li>
                <li>
                  <a
                    href="#/nihongo/grammar"
                    aria-current={route.page === 'nihongo' ? 'page' : undefined}
                  >
                    <span className="nav-marker" aria-hidden="true" /> 日本語 · N5
                  </a>
                </li>
                <li>
                  <a
                    href="#/texts"
                    aria-current={route.page === 'texts' ? 'page' : undefined}
                  >
                    <span className="nav-marker" aria-hidden="true" /> {copy.textsNav}
                  </a>
                </li>
              </ul>
          </nav>

          <main id="main-content" className="main-content" tabIndex={-1}>
            {route.page === 'home' && (
              <>
                <Home locale={locale} />
                <GuestNote locale={locale} />
              </>
            )}
            {route.page === 'nihongo' && (
              <NihongoCatalog category={route.category} itemId={route.itemId} locale={locale} />
            )}
            {route.page === 'texts' && <TextArchive slug={route.slug} locale={locale} />}
          </main>

          <aside className="sidebar" aria-label={copy.sidebar}>

            <MusicPlayer locale={locale} />

            <section className="side-box site-info" aria-labelledby="about-title">
              <h2 id="about-title">{copy.aboutTitle}</h2>
              <fieldset className="language-switcher">
                <legend>{copy.languageLegend}</legend>
                <div>
                  <button
                    type="button"
                    aria-label={copy.russianLanguage}
                    aria-pressed={locale === 'ru'}
                    onClick={() => setLocale('ru')}
                  >
                    RU
                  </button>
                  <button
                    type="button"
                    lang="ja"
                    aria-label={copy.japaneseLanguage}
                    aria-pressed={locale === 'ja'}
                    onClick={() => setLocale('ja')}
                  >
                    日本語
                  </button>
                </div>
              </fieldset>
            </section>

            <div className="mini-banners" aria-label={copy.decorativeBanners}>
              <span className="mini-banner mini-banner--green">HAND MADE</span>
              <span className="mini-banner mini-banner--blue" lang="ja">
                日本語勉強中
              </span>
            </div>
          </aside>
        </div>

        <footer className="site-footer">
          <p>
            <span lang="ja">僕のノート</span> · {copy.footerMade}
          </p>
          <p>
            <a href="#/">{copy.footerHome}</a>
          </p>
        </footer>
      </div>
    </>
  )
}

function GuestNote({ locale }: { locale: SiteLocale }) {
  const copy = siteCopy[locale]
  return (
    <section className="guest-note" aria-label={copy.guestNoteLabel}>
      <div>
        <span className="guest-note__stamp" aria-hidden="true">文</span>
        <p>{copy.guestNote}</p>
      </div>
      <img
        className="pond-divider"
        src={`${import.meta.env.BASE_URL}assets/frog/pond-divider.png`}
        width="800"
        height="289"
        alt=""
      />
    </section>
  )
}

function Home({ locale }: { locale: SiteLocale }) {
  const copy = siteCopy[locale]
  return (
    <section className="welcome-note" aria-labelledby="welcome-title">
      <div className="paper-pin" aria-hidden="true" />
      <h2 id="welcome-title">{copy.welcomeTitle}</h2>
      <p>
        {locale === 'ru' && <><span lang="ja">いらっしゃいませ！</span>{' '}</>}
        {copy.welcomeBody}
      </p>
      <div className="home-signs">
        <a className="nihongo-sign" href="#/nihongo/grammar">
          <span lang="ja">日本語のノート</span>
          <small>{copy.openN5}</small>
        </a>
        <a className="nihongo-sign nihongo-sign--paper" href="#/texts">
          <span lang="ja">日本語の文章</span>
          <small>{copy.openTexts}</small>
        </a>
      </div>
    </section>
  )
}

function MusicPlayer({ locale }: { locale: SiteLocale }) {
  const copy = siteCopy[locale]
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(35)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  const play = async () => {
    if (!audioRef.current) return
    try {
      if (hasError) audioRef.current.load()
      await audioRef.current.play()
      setIsPlaying(true)
      setHasError(false)
    } catch {
      setHasError(true)
    }
  }

  const stop = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setCurrentTime(0)
    setIsPlaying(false)
  }

  return (
    <section className="side-box player-box" aria-labelledby="player-title">
      <h2 id="player-title" lang="ja">おんがく</h2>
      <div className="player-display">
        <span title="Mirostar — Lofi Beats">LOFI</span>
        <span>{formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}</span>
      </div>
      <div className="player-tape" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="player-controls" aria-describedby="player-note">
        <button type="button" onClick={play} disabled={isPlaying}>
          {hasError ? copy.retryAudio : copy.play}
        </button>
        <button type="button" onClick={stop} disabled={!isPlaying && currentTime === 0}>{copy.stop}</button>
        <label>
          <span>{copy.volume}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            aria-label={copy.volumeLabel}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </label>
      </div>
      <p id="player-note" role="status" aria-live="polite">
        {hasError ? copy.audioError : copy.audioReady}
      </p>
      <audio
        ref={audioRef}
        preload="metadata"
        src={`${import.meta.env.BASE_URL}audio/mirostar-lofi-beats-531504.mp3`}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={(event) => {
          event.currentTarget.currentTime = 0
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onError={() => setHasError(true)}
      />
    </section>
  )
}

export default App
