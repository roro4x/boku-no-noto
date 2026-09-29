import { describe, expect, it } from 'vitest'
import type { VocabularyItem } from './study'
import {
  formatJapaneseDate,
  formatZonedTime,
  MOSCOW_TIME_ZONE,
  pickRandomVocabulary,
  splitMeaningParts,
  summarizeMeaning,
  TOKYO_TIME_ZONE,
} from './homeGlance'

const word = (id: string, meaning = 'значение'): VocabularyItem => ({
  id,
  term: `語${id}`,
  reading: `ご${id}`,
  meaningsRu: [meaning],
  partOfSpeech: 'существительное',
  sourceRefs: ['test'],
  order: 1,
  minnaLesson: 1,
  minnaOrder: 1,
})

describe('home glance helpers', () => {
  it('does not repeat the previously shown word when another word is available', () => {
    expect(pickRandomVocabulary([word('one'), word('two')], 'one', () => 0)?.id).toBe('two')
  })

  it('keeps random meanings short and readable', () => {
    const awkward = word('awkward', ': служебная помета')
    expect(pickRandomVocabulary([awkward, word('clear')], null, () => 0)?.id).toBe('clear')
    expect(summarizeMeaning('петь; щебетать; чирикать')).toBe('петь')
  })

  it('splits translation variants without breaking explanations in brackets', () => {
    expect(splitMeaningParts('нуждаться (в чём-л.), зависеть (от чего-л.)')).toEqual([
      'нуждаться (в чём-л.)',
      'зависеть (от чего-л.)',
    ])
    expect(splitMeaningParts('петь, щебетать, чирикать; звучать', 3)).toEqual([
      'петь',
      'щебетать',
      'чирикать',
    ])
  })

  it('formats the same instant for Moscow, Tokyo, and a Japanese calendar line', () => {
    const date = new Date('2026-09-29T12:34:56Z')
    expect(formatJapaneseDate(date)).toBe('2026年9月29日(火)')
    expect(formatZonedTime(date, MOSCOW_TIME_ZONE)).toBe('15:34:56')
    expect(formatZonedTime(date, TOKYO_TIME_ZONE)).toBe('21:34:56')
  })
})
