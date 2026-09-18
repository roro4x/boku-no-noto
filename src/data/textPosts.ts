export type TextPost = {
  slug: string
  title: string
  date: string
  description: string
  content: string
}

export type TextPostFilters = {
  query: string
  year: string
  month: string
}

const unquote = (value: string) => {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

export const parseTextPost = (source: string, path: string): TextPost => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u)
  if (!match) throw new Error(`В ${path} нет frontmatter между строками ---`)

  const metadata = Object.fromEntries(
    match[1]
      .split(/\r?\n/u)
      .map((line) => {
        const separator = line.indexOf(':')
        return separator === -1
          ? [line.trim(), '']
          : [line.slice(0, separator).trim(), unquote(line.slice(separator + 1))]
      })
      .filter(([key]) => key.length > 0),
  )

  if (!metadata.title) throw new Error(`В ${path} не заполнен title`)
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(metadata.date ?? '')) {
    throw new Error(`В ${path} дата должна иметь формат YYYY-MM-DD`)
  }

  const fileName = path.split('/').pop() ?? path
  return {
    slug: fileName.replace(/\.md$/u, ''),
    title: metadata.title,
    date: metadata.date,
    description: metadata.description ?? '',
    content: match[2].trim(),
  }
}

export const normalizeTitleSearch = (value: string) =>
  value.normalize('NFKC').toLocaleLowerCase('ja').trim().replace(/\s+/gu, ' ')

export const filterTextPosts = (posts: TextPost[], filters: TextPostFilters) => {
  const query = normalizeTitleSearch(filters.query)
  return posts.filter((post) => {
    const [year, month] = post.date.split('-')
    const matchesTitle = query.length === 0 || normalizeTitleSearch(post.title).includes(query)
    const matchesYear = filters.year.length === 0 || filters.year === year
    const matchesMonth = filters.month.length === 0 || filters.month === month
    return matchesTitle && matchesYear && matchesMonth
  })
}

export const formatPostDate = (date: string, locale: 'ru' | 'ja' = 'ru') =>
  new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))

const textModules = import.meta.glob('/content/texts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const textPosts = Object.entries(textModules)
  .map(([path, source]) => parseTextPost(source, path))
  .sort((a, b) => b.date.localeCompare(a.date))
