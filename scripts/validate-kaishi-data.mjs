import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = (file) => JSON.parse(readFileSync(new URL(`../public/data/kaishi/${file}`, import.meta.url), 'utf8'))
const words = read('vocabulary.json')
const source = read('source.json')
assert.equal(words.length, 1500)
assert.equal(source.count, words.length)
assert.equal(new Set(words.map((word) => word.id)).size, words.length)
for (const [index, word] of words.entries()) {
  assert.equal(word.order, index + 1)
  for (const key of ['id', 'term', 'reading', 'sentence', 'sentenceMeaningRu', 'notesRu']) {
    assert.equal(typeof word[key], 'string', `${word.id}: ${key}`)
    assert.ok(!/<\/?[a-z][^>]*>/iu.test(word[key]), `${word.id}: HTML in ${key}`)
  }
  assert.ok(word.term && word.reading && word.meaningsRu[0])
  assert.ok(word.meaningsRu.every((meaning) => typeof meaning === 'string' && meaning.trim()))
}
console.log(`Validated ${words.length} Kaishi words`)
