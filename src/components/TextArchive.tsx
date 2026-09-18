import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  filterTextPosts,
  formatPostDate,
  textPosts,
  type TextPostFilters,
} from '../data/textPosts'
import type { SiteLocale } from '../i18n'

type TextArchiveProps = {
  slug?: string
  locale: SiteLocale
}

const archiveCopy = {
  ru: {
    notFound: 'Такой текст не найден. Возможно, файл был переименован.',
    returnToList: 'Вернуться к списку',
    back: '← ко всем текстам',
    intro: 'Небольшой архив японских текстов в Markdown.',
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
    read: 'читать',
    months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  },
  ja: {
    notFound: 'この文章は見つかりません。ファイル名が変更された可能性があります。',
    returnToList: '一覧に戻る',
    back: '← 文章一覧へ',
    intro: 'Markdownで追加した日本語の文章をまとめた小さなアーカイブです。',
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
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  },
} as const

const monthValues = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const

const formatFileCount = (count: number, locale: SiteLocale) => {
  if (locale === 'ja') return `${count}件`
  const mod100 = count % 100
  const mod10 = count % 10
  if (mod10 === 1 && mod100 !== 11) return `${count} файл`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} файла`
  return `${count} файлов`
}

const readFilters = (): TextPostFilters => {
  const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  return {
    query: params.get('q') ?? '',
    year: params.get('year') ?? '',
    month: params.get('month') ?? '',
  }
}

const routeFor = (slug?: string, filters: TextPostFilters = { query: '', year: '', month: '' }) => {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.year) params.set('year', filters.year)
  if (filters.month) params.set('month', filters.month)
  const suffix = params.size ? `?${params.toString()}` : ''
  return `#/texts${slug ? `/${encodeURIComponent(slug)}` : ''}${suffix}`
}

export function TextArchive({ slug, locale }: TextArchiveProps) {
  const [filters, setFilters] = useState<TextPostFilters>(readFilters)
  const years = useMemo(
    () => [...new Set(textPosts.map((post) => post.date.slice(0, 4)))].sort().reverse(),
    [],
  )
  const results = useMemo(() => filterTextPosts(textPosts, filters), [filters])
  const post = slug ? textPosts.find((item) => item.slug === decodeURIComponent(slug)) : undefined
  const copy = archiveCopy[locale]

  useEffect(() => {
    setFilters(readFilters())
  }, [slug])

  const updateFilters = (next: TextPostFilters) => {
    setFilters(next)
    window.history.replaceState(null, '', routeFor(undefined, next))
  }

  if (slug && !post) {
    return (
      <section className="text-archive" aria-labelledby="texts-title">
        <header className="archive-heading">
          <h2 id="texts-title" lang="ja">日本語の文章</h2>
        </header>
        <div className="archive-empty">
          <p>{copy.notFound}</p>
          <a href={routeFor(undefined, filters)}>{copy.returnToList}</a>
        </div>
      </section>
    )
  }

  if (post) {
    return (
      <section className="text-archive" aria-labelledby="post-title">
        <article className="markdown-post">
          <a className="back-link" href={routeFor(undefined, filters)}>{copy.back}</a>
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
        <div>
          <h2 id="texts-title" lang="ja">日本語の文章</h2>
          <p>{copy.intro}</p>
        </div>
        <span>{formatFileCount(textPosts.length, locale)}</span>
      </header>

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
                <h3 lang="ja">
                  <a href={routeFor(item.slug, filters)}>{item.title}</a>
                </h3>
                {item.description && <p lang="ru">{item.description}</p>}
              </div>
              <a className="post-read-link" href={routeFor(item.slug, filters)}>{copy.read}</a>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
