import { siteLinks } from '../data/links'
import type { SiteLocale } from '../i18n'

const linksCopy = {
  ru: {
    title: 'Ссылки',
    intro: 'Небольшой каталог мест, которые хочется сохранить.',
    count: (value: number) => `${value} сайт`,
    visit: (title: string) => `Открыть сайт ${title} в новой вкладке`,
  },
  ja: {
    title: 'おすすめリンク',
    intro: '残しておきたいウェブサイトの小さなリンク集です。',
    count: (value: number) => `${value}件`,
    visit: (title: string) => `${title}を新しいタブで開く`,
  },
} as const

export function LinksDirectory({ locale }: { locale: SiteLocale }) {
  const copy = linksCopy[locale]

  return (
    <section className="links-directory" aria-labelledby="links-title">
      <header className="archive-heading">
        <div>
          <h2 id="links-title">{copy.title}</h2>
          <p>{copy.intro}</p>
        </div>
        <span>{copy.count(siteLinks.length)}</span>
      </header>

      <ul className="links-list">
        {siteLinks.map((item) => (
          <li key={item.id}>
            <div className="link-entry">
              <a
                className="link-banner"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.visit(item.title)}
              >
                <img
                  src={`${import.meta.env.BASE_URL}${item.banner}`}
                  width="88"
                  height="31"
                  alt={`${item.title} — 88 × 31`}
                />
              </a>
              <a className="link-url" href={item.url} target="_blank" rel="noopener noreferrer">
                {new URL(item.url).hostname}
              </a>
              {item.description && <p>{item.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
