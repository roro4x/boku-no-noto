import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { notes } from '../data/notes'
import { formatPostDate } from '../data/textPosts'
import type { SiteLocale } from '../i18n'

type NotesArchiveProps = {
  slug?: string
  locale: SiteLocale
}

const notesCopy = {
  ru: {
    title: 'Заметки',
    back: '← ко всем заметкам',
    notFound: 'Такая заметка не найдена. Возможно, файл был переименован.',
    returnToList: 'Вернуться к заметкам',
    empty: 'Заметок пока нет.',
    read: 'Читать',
    readLabel: (title: string) => `Читать заметку «${title}»`,
  },
  ja: {
    title: 'ノート',
    back: '← ノート一覧へ',
    notFound: 'このノートは見つかりません。ファイル名が変更された可能性があります。',
    returnToList: 'ノート一覧に戻る',
    empty: 'ノートはまだありません。',
    read: '読む',
    readLabel: (title: string) => `「${title}」を読む`,
  },
} as const

const routeFor = (slug?: string) => `#/notes${slug ? `/${encodeURIComponent(slug)}` : ''}`

export function NotesArchive({ slug, locale }: NotesArchiveProps) {
  const copy = notesCopy[locale]
  const note = slug ? notes.find((item) => item.slug === decodeURIComponent(slug)) : undefined

  if (slug && !note) {
    return (
      <section className="notes-archive" aria-labelledby="notes-title">
        <header className="archive-heading">
          <h2 id="notes-title" lang={locale}>{copy.title}</h2>
        </header>
        <div className="archive-empty">
          <p>{copy.notFound}</p>
          <a href={routeFor()}>{copy.returnToList}</a>
        </div>
      </section>
    )
  }

  if (note) {
    return (
      <section className="notes-archive" aria-labelledby="note-title">
        <article className="markdown-post">
          <a className="back-link" href={routeFor()}>{copy.back}</a>
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

      {notes.length === 0 ? (
        <div className="archive-empty"><p>{copy.empty}</p></div>
      ) : (
        <ol className="post-list note-list">
          {notes.map((item) => (
            <li key={item.slug}>
              <time dateTime={item.date}>{formatPostDate(item.date, locale)}</time>
              <div>
                <h3 lang="ru">{item.title}</h3>
                {item.description && <p lang="ru">{item.description}</p>}
              </div>
              <a
                className="post-read-link"
                href={routeFor(item.slug)}
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
