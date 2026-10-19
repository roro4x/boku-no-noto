import { SearchField } from './SearchField'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { notes, searchNotes } from '../data/notes'
import { formatPostDate } from '../data/textPosts'
import type { SiteLocale } from '../i18n'

type NotesArchiveProps = {
  slug?: string
  locale: SiteLocale
}

const notesCopy = {
  ru: {
    title: 'Заметки',
    search: 'Поиск по тексту заметок',
    placeholder: 'Название или текст',
    clear: 'Очистить',
    found: (count: number) => `Найдено: ${count}`,
    noResults: 'По этому запросу заметок нет.',
    back: '← ко всем заметкам',
    notFound: 'Такая заметка не найдена. Возможно, файл был переименован.',
    returnToList: 'Вернуться к заметкам',
    empty: 'Заметок пока нет.',
    read: 'Читать',
    readLabel: (title: string) => `Читать заметку «${title}»`,
  },
  ja: {
    title: 'ノート',
    search: 'ノートの全文を検索',
    placeholder: 'タイトル・説明・本文',
    clear: 'クリア',
    found: (count: number) => `${count}件`,
    noResults: '条件に合うノートはありません。',
    back: '← ノート一覧へ',
    notFound: 'このノートは見つかりません。ファイル名が変更された可能性があります。',
    returnToList: 'ノート一覧に戻る',
    empty: 'ノートはまだありません。',
    read: '読む',
    readLabel: (title: string) => `「${title}」を読む`,
  },
} as const

const readQuery = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('q') ?? ''

const routeFor = (slug?: string, query = '') =>
  `#/notes${slug ? `/${encodeURIComponent(slug)}` : ''}${query ? `?${new URLSearchParams({ q: query })}` : ''}`

export function NotesArchive({ slug, locale }: NotesArchiveProps) {
  const copy = notesCopy[locale]
  const [query, setQuery] = useState(readQuery)
  const results = useMemo(() => searchNotes(notes, query), [query])
  useEffect(() => {
    const restoreQuery = () => setQuery(readQuery())
    restoreQuery()
    window.addEventListener('hashchange', restoreQuery)
    return () => window.removeEventListener('hashchange', restoreQuery)
  }, [slug])
  const updateQuery = (value: string) => {
    setQuery(value)
    window.history.replaceState(null, '', routeFor(undefined, value))
  }
  const note = slug ? notes.find((item) => item.slug === decodeURIComponent(slug)) : undefined

  if (slug && !note) {
    return (
      <section className="notes-archive" aria-labelledby="notes-title">
        <header className="archive-heading">
          <h2 id="notes-title" lang={locale}>{copy.title}</h2>
        </header>
        <div className="archive-empty">
          <p>{copy.notFound}</p>
          <a className="utility-link" href={routeFor(undefined, query)}>{copy.returnToList}</a>
        </div>
      </section>
    )
  }

  if (note) {
    return (
      <section className="notes-archive" aria-labelledby="note-title">
        <article className="markdown-post">
          <a className="back-link utility-link" href={routeFor(undefined, query)}>{copy.back}</a>
          <header className="post-heading">
            <time dateTime={note.date}>{formatPostDate(note.date, locale)}</time>
            <h2 id="note-title" lang="ru">{note.title}</h2>
            {note.description && <p lang="ru">{note.description}</p>}
          </header>
          <div className="markdown-body" lang="ru">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => <h3 className="markdown-heading markdown-heading--2">{children}</h3>,
                h3: ({ children }) => <h4 className="markdown-heading markdown-heading--3">{children}</h4>,
                h4: ({ children }) => <h5 className="markdown-heading markdown-heading--4">{children}</h5>,
              }}
            >
              {note.content}
            </ReactMarkdown>
          </div>
        </article>
      </section>
    )
  }

  return (
    <section className="notes-archive" aria-labelledby="notes-title">
      <header className="archive-heading">
        <h2 id="notes-title" lang={locale}>{copy.title}</h2>
      </header>

      <SearchField label={copy.search} placeholder={copy.placeholder} value={query}
        clearLabel={copy.clear} onChange={updateQuery} />
      <p className="result-count" role="status">{copy.found(results.length)}</p>
      {notes.length === 0 ? (
        <div className="archive-empty"><p>{copy.empty}</p></div>
      ) : results.length === 0 ? (
        <div className="archive-empty">
          <p>{copy.noResults}</p>
          <button type="button" onClick={() => updateQuery('')}>{copy.clear}</button>
        </div>
      ) : (
        <ol className="post-list note-list">
          {results.map((item) => (
            <li key={item.slug}>
              <time dateTime={item.date}>{formatPostDate(item.date, locale)}</time>
              <div>
                <h3 lang="ru">{item.title}</h3>
                {item.description && <p lang="ru">{item.description}</p>}
              </div>
              <a
                className="post-read-link"
                href={routeFor(item.slug, query)}
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
