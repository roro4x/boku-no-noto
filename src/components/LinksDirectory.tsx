import { siteLinks } from '../data/links'
import type { SiteLocale } from '../i18n'
import { useEffect, useState } from 'react'
import { copyText } from '../data/clipboard'

const linksCopy = {
  ru: {
    title: 'Ссылки',
    visit: (title: string) => `Открыть сайт ${title} в новой вкладке`,
    bannerTitle: 'Баннер моего сайта', bannerHint: 'Если хотите оставить ссылку на этот уголок.',
    download: 'Скачать PNG', copy: 'Копировать HTML', copied: 'Скопировано',
    copyError: 'Не удалось скопировать. Можно выделить код ниже.', code: 'Код баннера',
  },
  ja: {
    title: 'おすすめリンク',
    visit: (title: string) => `${title}を新しいタブで開く`,
    bannerTitle: 'このサイトのバナー', bannerHint: 'この小さな場所へのリンクにどうぞ。',
    download: 'PNGを保存', copy: 'HTMLをコピー', copied: 'コピーしました',
    copyError: 'コピーできませんでした。下のコードを選択してください。', code: 'バナーのHTML',
  },
} as const

export function LinksDirectory({ locale }: { locale: SiteLocale }) {
  const copy = linksCopy[locale]
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle')
  useEffect(() => {
    if (copyState !== 'success') return
    const timer = window.setTimeout(() => setCopyState('idle'), 2500)
    return () => window.clearTimeout(timer)
  }, [copyState])
  const bannerPath = `${import.meta.env.BASE_URL}assets/banners/boku-no-noto.png`
  const siteUrl = 'https://roro4x.github.io/boku-no-noto/'
  const bannerCode = `<a href="${siteUrl}"><img src="${siteUrl}assets/banners/boku-no-noto.png" width="88" height="31" alt="僕のノート · Boku no Nōto"></a>`

  return (
    <section className="links-directory" aria-labelledby="links-title">
      <header className="archive-heading">
        <h2 id="links-title">{copy.title}</h2>
      </header>

      <ul className="links-list">
        {siteLinks.map((item) => (
          <li key={item.id}>
            <a
              className="link-banner"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.visit(item.title)}
              title={item.title}
            >
              <span className="link-banner__title">{item.label}</span>
              <span className="link-banner__caption">{item.caption}</span>
            </a>
          </li>
        ))}
      </ul>
      <section className="site-banner" aria-labelledby="site-banner-title">
        <h3 id="site-banner-title">{copy.bannerTitle}</h3>
        <p>{copy.bannerHint}</p>
        <div className="site-banner__actions">
          <img src={bannerPath} width="176" height="62" alt="僕のノート · Boku no Nōto" />
          <a href={bannerPath} download="boku-no-noto.png">{copy.download}</a>
          <button type="button" className="banner-copy" data-state={copyState} aria-live="polite" onClick={async () => {
            try { await copyText(bannerCode); setCopyState('success') }
            catch { setCopyState('error') }
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="8" y="8" width="12" height="13" rx="1" />
              <path d="M15 8V3H3v13h5" />
            </svg>
            {copyState === 'success' ? copy.copied : copy.copy}
          </button>
        </div>
        <details><summary>{copy.code}</summary><pre><code>{bannerCode}</code></pre></details>
        {copyState === 'error' && <p className="site-banner__status" role="alert">{copy.copyError}</p>}
      </section>
    </section>
  )
}
