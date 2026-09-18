import { describe, expect, it } from 'vitest'
import { filterPrompts, prompts } from './prompts'

describe('prompt library search', () => {
  it('searches title, description and tags without case sensitivity', () => {
    expect(filterPrompts(prompts, 'pdf')).toHaveLength(1)
    expect(filterPrompts(prompts, 'интерактивного')).toHaveLength(1)
    expect(filterPrompts(prompts, 'ACROFORM')).toHaveLength(1)
  })

  it('returns all prompts for a blank query and none for a missing term', () => {
    expect(filterPrompts(prompts, '   ')).toEqual(prompts)
    expect(filterPrompts(prompts, 'несуществующий')).toEqual([])
  })

  it('finds the Minna no Nihongo reading prompt', () => {
    expect(filterPrompts(prompts, 'みんなの日本語')).toHaveLength(1)
    expect(filterPrompts(prompts, 'чтение')).toHaveLength(1)
  })
})
