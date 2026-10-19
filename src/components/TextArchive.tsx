import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatPostDate, textPosts } from '../data/textPosts'
import type { SiteLocale } from '../i18n'

type TextArchiveProps = {
  slug?: string
  locale: SiteLocale
}

const archiveCopy = {
  ru: {
    title: 'Мои тексты',
    notFound: 'Такой текст не найден. Возможно, файл был переименован.',
    returnToList: 'Вернуться к списку',
    backMine: '← к моим текстам',
    empty: 'Текстов пока нет.',
    read: 'Читать',
    readLabel: (title: string) => `Читать «${title}»`,
  },
  ja: {
    title: '私の文章',
    notFound: 'この文章は見つかりません。ファイル名が変更された可能性があります。',
    returnToList: '一覧に戻る',
    backMine: '← 私の文章へ',
    empty: '文章はまだありません。',
    read: '読む',
    readLabel: (title: string) => `「${title}」を読む`,
  },
} as const

const routeFor = (slug?: string) => `#/texts${slug ? `/${encodeURIComponent(slug)}` : ''}`

export function TextArchive({ slug, locale }: TextArchiveProps) {
  const posts = textPosts
  const post = slug ? posts.find((item) => item.slug === decodeURIComponent(slug)) : undefined
  const copy = archiveCopy[locale]

  if (slug && !post) {
    return (
      <section className="text-archive" aria-labelledby="texts-title">
        <header className="archive-heading">
          <h2 id="texts-title" lang={locale}>{copy.title}</h2>
        </header>
        <div className="archive-empty">
          <p>{copy.notFound}</p>
          <a className="utility-link" href={routeFor()}>{copy.returnToList}</a>
        </div>
      </section>
    )
  }

  if (post) {
    return (
      <section className="text-archive" aria-labelledby="post-title">
        <article className="markdown-post">
          <a className="back-link utility-link" href={routeFor()}>
            {copy.backMine}
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

  return (
    <section className="text-archive" aria-labelledby="texts-title">
      <header className="archive-heading">
        <h2 id="texts-title" lang={locale}>{copy.title}</h2>
      </header>

      {posts.length === 0 ? (
        <div className="archive-empty">
          <p>{copy.empty}</p>
        </div>
      ) : (
        <ol className="post-list">
          {posts.map((item) => (
            <li key={item.slug}>
              <time dateTime={item.date}>{formatPostDate(item.date, locale)}</time>
              <div>
                <h3 lang="ja">{item.title}</h3>
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
