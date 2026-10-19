import { describe, expect, it } from 'vitest'
import { notes, searchNotes } from './notes'

describe('notes collection', () => {
  it('searches note bodies as well as titles and descriptions', () => {
    const note = notes.find((item) => item.slug === 'goeido-gotaro')!
    expect(searchNotes(notes, '  696 ПОБЕД ')).toEqual([note])
    expect(searchNotes(notes, '豪栄道')).toContain(note)
    expect(searchNotes([{ ...note, description: 'Уникальное описание' }], 'уникальное')).toHaveLength(1)
    expect(searchNotes(notes, 'несуществующая фраза')).toEqual([])
    expect(searchNotes(notes, '   ')).toEqual(notes)
  })

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
