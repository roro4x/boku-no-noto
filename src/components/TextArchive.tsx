import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  filterTextPosts,
  formatPostDate,
  textPosts,
  type TextPostFilters,
} from '../data/textPosts'
import { readingPosts } from '../data/readingPosts'
import type { SiteLocale } from '../i18n'

type TextArchiveProps = {
  category: 'mine' | 'reading'
  slug?: string
  locale: SiteLocale
}

const archiveCopy = {
  ru: {
    title: 'Тексты на японском',
    categories: 'Разделы текстов на японском',
    mine: 'Мои тексты',
    reading: 'Тексты для чтения',
    notFound: 'Такой текст не найден. Возможно, файл был переименован.',
    returnToList: 'Вернуться к списку',
    backMine: '← к моим текстам',
    backReading: '← к текстам для чтения',
    titleSearch: 'Поиск по названию',
    example: 'Например: 雨の日',
    year: 'Год',
    allYears: 'Все годы',
    month: 'Месяц',
    allMonths: 'Все месяцы',
    reset: 'Сбросить',
    found: (count: number) => `Найдено: ${count}`,
    empty: 'По этому запросу текстов нет.',
    showAll: 'Показать весь архив',
    read: 'Читать',
    readLabel: (title: string) => `Читать «${title}»`,
    months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  },
  ja: {
    title: '日本語の文章',
    categories: '日本語の文章のカテゴリー',
    mine: '私の文章',
    reading: '読解テキスト',
    notFound: 'この文章は見つかりません。ファイル名が変更された可能性があります。',
    returnToList: '一覧に戻る',
    backMine: '← 私の文章へ',
    backReading: '← 読解テキストへ',
    titleSearch: 'タイトルを検索',
    example: '例：雨の日',
    year: '年',
    allYears: 'すべての年',
    month: '月',
    allMonths: 'すべての月',
    reset: 'リセット',
    found: (count: number) => `${count}件`,
    empty: 'この条件に合う文章はありません。',
    showAll: 'すべての文章を表示',
    read: '読む',
    readLabel: (title: string) => `「${title}」を読む`,
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  },
} as const

const monthValues = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const

const readFilters = (): TextPostFilters => {
  const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  return {
    query: params.get('q') ?? '',
    year: params.get('year') ?? '',
    month: params.get('month') ?? '',
  }
}

const routeFor = (
  category: 'mine' | 'reading',
  slug?: string,
  filters: TextPostFilters = { query: '', year: '', month: '' },
) => {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.year) params.set('year', filters.year)
  if (filters.month) params.set('month', filters.month)
  const suffix = params.size ? `?${params.toString()}` : ''
  const base = category === 'reading' ? '#/texts/reading' : '#/texts'
  return `${base}${slug ? `/${encodeURIComponent(slug)}` : ''}${suffix}`
}

export function TextArchive({ category, slug, locale }: TextArchiveProps) {
  const posts = category === 'reading' ? readingPosts : textPosts
  const [filters, setFilters] = useState<TextPostFilters>(readFilters)
  const years = useMemo(
    () => [...new Set(posts.map((post) => post.date.slice(0, 4)))].sort().reverse(),
    [posts],
  )
  const results = useMemo(() => filterTextPosts(posts, filters), [filters, posts])
  const post = slug ? posts.find((item) => item.slug === decodeURIComponent(slug)) : undefined
  const copy = archiveCopy[locale]

  useEffect(() => {
    setFilters(readFilters())
  }, [category, slug])

  const updateFilters = (next: TextPostFilters) => {
    setFilters(next)
    window.history.replaceState(null, '', routeFor(category, undefined, next))
  }

  if (slug && !post) {
    return (
      <section className="text-archive" aria-labelledby="texts-title">
        <header className="archive-heading">
          <h2 id="texts-title" lang={locale}>{copy.title}</h2>
        </header>
        <div className="archive-empty">
          <p>{copy.notFound}</p>
          <a href={routeFor(category, undefined, filters)}>{copy.returnToList}</a>
        </div>
      </section>
    )
  }

  if (post) {
    return (
      <section className="text-archive" aria-labelledby="post-title">
        <article className="markdown-post">
          <a className="back-link" href={routeFor(category, undefined, filters)}>
            {category === 'reading' ? copy.backReading : copy.backMine}
          </a>
          <header className="post-heading">
            <time dateTime={post.date}>{formatPostDate(post.date, locale)}</time>
            <h2 id="post-title" lang="ja">{post.title}</h2>
            {post.description && <p lang="ru">{post.description}</p>}
          </header>
          <div className="markdown-body" lang="ja">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => <h3 className="markdown-heading markdown-heading--2">{children}</h3>,
                h3: ({ children }) => <h4 className="markdown-heading markdown-heading--3">{children}</h4>,
                h4: ({ children }) => <h5 className="markdown-heading markdown-heading--4">{children}</h5>,
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>
      </section>
    )
  }

  const hasFilters = Boolean(filters.query || filters.year || filters.month)

  return (
    <section className="text-archive" aria-labelledby="texts-title">
      <header className="archive-heading">
        <h2 id="texts-title" lang={locale}>{copy.title}</h2>
      </header>

      <nav className="category-tabs text-category-tabs" aria-label={copy.categories}>
        <a href="#/texts" aria-current={category === 'mine' ? 'page' : undefined}>
          <span lang="ja">私の文章</span>
          {locale === 'ru' && <span>{copy.mine}</span>}
          <small>{textPosts.length}</small>
        </a>
        <a href="#/texts/reading" aria-current={category === 'reading' ? 'page' : undefined}>
          <span lang="ja">読解テキスト</span>
          {locale === 'ru' && <span>{copy.reading}</span>}
          <small>{readingPosts.length}</small>
        </a>
      </nav>

      <div className="archive-tools">
        <label className="archive-search">
          <span>{copy.titleSearch}</span>
          <input
            type="search"
            value={filters.query}
            placeholder={copy.example}
            onChange={(event) => updateFilters({ ...filters, query: event.target.value })}
          />
        </label>

        <label>
          <span>{copy.year}</span>
          <select
            value={filters.year}
            onChange={(event) => updateFilters({ ...filters, year: event.target.value })}
          >
            <option value="">{copy.allYears}</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>

        <label>
          <span>{copy.month}</span>
          <select
            value={filters.month}
            onChange={(event) => updateFilters({ ...filters, month: event.target.value })}
          >
            <option value="">{copy.allMonths}</option>
            {monthValues.map((value, index) => (
              <option key={value} value={value}>{copy.months[index]}</option>
            ))}
          </select>
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={() => updateFilters({ query: '', year: '', month: '' })}
          >
            {copy.reset}
          </button>
        )}
      </div>

      <p className="result-count" aria-live="polite">{copy.found(results.length)}</p>

      {results.length === 0 ? (
        <div className="archive-empty">
          <p>{copy.empty}</p>
          <button
            type="button"
            onClick={() => updateFilters({ query: '', year: '', month: '' })}
          >
            {copy.showAll}
          </button>
        </div>
      ) : (
        <ol className="post-list">
          {results.map((item) => (
            <li key={item.slug}>
              <time dateTime={item.date}>{formatPostDate(item.date, locale)}</time>
              <div>
                <h3 lang="ja">{item.title}</h3>
                {item.description && <p lang="ru">{item.description}</p>}
              </div>
              <a
                className="post-read-link"
                href={routeFor(category, item.slug, filters)}
                aria-label={copy.readLabel(item.title)}
              >
                {copy.read}
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
