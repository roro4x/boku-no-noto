import { describe, expect, it } from 'vitest'
import { readingPosts } from './readingPosts'

describe('reading texts collection', () => {
  it('loads the Luffy learning text from Markdown', () => {
    expect(readingPosts).toHaveLength(1)
    expect(readingPosts[0]).toMatchObject({
      slug: 'luffy-red-bag',
      title: 'ルフィと赤いかばん',
      date: '2026-09-18',
    })
    expect(readingPosts[0].content).toContain('## 本文')
    expect(readingPosts[0].content).toContain('## 読解問題')
  })
})
