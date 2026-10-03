import { describe, expect, it } from 'vitest'
import { notes } from './notes'

describe('notes collection', () => {
  it('loads the Goeido reference note from Markdown', () => {
    const note = notes.find((item) => item.slug === 'goeido-gotaro')
    expect(note).toMatchObject({
      slug: 'goeido-gotaro',
      title: 'Гоэйдо Готаро (豪栄道 豪太郎)',
      date: '2026-09-18',
    })
    expect(note?.content).toContain('696 побед')
    expect(note?.content).toContain('sumo.or.jp')
  })
})
