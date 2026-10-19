import { describe, expect, it } from 'vitest'
import words from '../../public/data/kaishi/vocabulary.json'
import { normalizeSearch, searchVocabulary } from './vocabulary'
import { pickRandomVocabulary } from './homeGlance'

describe('Kaishi vocabulary', () => {
  it('preserves all 1500 notes with Russian translations and stable IDs', () => {
    expect(words).toHaveLength(1500)
    expect(new Set(words.map((word) => word.id)).size).toBe(1500)
    expect(words.every((word, index) => word.order === index + 1 && word.term && word.reading && word.meaningsRu[0])).toBe(true)
    expect(words[0]).toMatchObject({ term: '私', reading: 'わたし', meaningsRu: ['Я'], sentence: '私はアンです。', sentenceMeaningRu: 'Я Анна.' })
  })

  it('searches by writing, reading and Russian meaning, normalizing case and width', () => {
    const school = words.find((word) => word.term === '学校')!
    expect(searchVocabulary(words, '学校')).toContain(school)
    expect(searchVocabulary(words, 'がっこう')).toContain(school)
    expect(searchVocabulary(words, ' ШКОЛА ')).toContain(school)
    expect(searchVocabulary(words, 'несуществующий запрос')).toEqual([])
    expect(searchVocabulary(words, '')).toHaveLength(1500)
    expect(normalizeSearch(' ＡＢＣ ')).toBe('abc')
  })

  it('uses the imported deck for home words and permits long terms and translations', () => {
    const long = { ...words[0], term: 'ありがとうございます', meaningsRu: ['Благодарю вас за помощь и за всё то время, которое вы уделили этому важному для меня вопросу.'] }
    expect(pickRandomVocabulary([long], null)).toEqual(long)
    expect(words).toContain(pickRandomVocabulary(words, words[0].id, () => 0))
  })
})
