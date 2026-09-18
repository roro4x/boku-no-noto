import { describe, expect, it } from 'vitest'
import { notes } from './notes'

describe('notes collection', () => {
  it('loads the Goeido reference note from Markdown', () => {
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({
      slug: 'goeido-gotaro',
      title: 'Гоэйдо Готаро (豪栄道 豪太郎)',
      date: '2026-09-18',
    })
    expect(notes[0].content).toContain('696 побед')
    expect(notes[0].content).toContain('sumo.or.jp')
  })
})
