import { describe, expect, it } from 'vitest'
import { filterTextPosts, formatPostDate, parseTextPost, type TextPost } from './textPosts'

const posts: TextPost[] = [
  {
    slug: 'rain',
    title: '雨の日の散歩',
    date: '2026-09-18',
    description: '',
    content: '雨が降っています。',
  },
  {
    slug: 'library',
    title: '小さな図書館',
    date: '2026-08-30',
    description: '',
    content: '本を読みます。',
  },
]

describe('parseTextPost', () => {
  it('reads frontmatter and Markdown body', () => {
    const post = parseTextPost(
      '---\ntitle: 雨の日\ndate: 2026-09-18\ndescription: 短い話\n---\n\n## 朝\n\n雨です。',
      '/content/texts/rain.md',
    )
    expect(post).toMatchObject({
      slug: 'rain',
      title: '雨の日',
      date: '2026-09-18',
      description: '短い話',
    })
    expect(post.content).toContain('## 朝')
  })
})

describe('filterTextPosts', () => {
  it('combines title search with year and month', () => {
    expect(filterTextPosts(posts, { query: '図書', year: '2026', month: '08' })).toEqual([
      posts[1],
    ])
    expect(filterTextPosts(posts, { query: '雨', year: '2026', month: '08' })).toEqual([])
  })
})

describe('formatPostDate', () => {
  it('uses the selected site language', () => {
    expect(formatPostDate('2026-09-18', 'ru')).toContain('сентября')
    expect(formatPostDate('2026-09-18', 'ja')).toBe('2026年9月18日')
  })
})
