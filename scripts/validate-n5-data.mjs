import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const dataDir = resolve(process.argv[2] ?? 'public/data/n5')
const readJson = async (name) => JSON.parse(await readFile(resolve(dataDir, name), 'utf8'))
const [manifest, sourcesFile, grammar, vocabulary, kanji] = await Promise.all([
  readJson('manifest.json'),
  readJson('sources.json'),
  readJson('grammar.json'),
  readJson('vocabulary.json'),
  readJson('kanji.json'),
])

const failures = []
const assert = (condition, message) => {
  if (!condition) failures.push(message)
}
const sourceIds = new Set(sourcesFile.sources.map((source) => source.id))
const allItems = [
  ['grammar', grammar],
  ['vocabulary', vocabulary],
  ['kanji', kanji],
]

assert(manifest.schemaVersion === 1, 'manifest.schemaVersion must be 1')
assert(/^\d{4}-\d{2}-[a-z0-9-]+$/u.test(manifest.datasetVersion), 'datasetVersion is invalid')
assert(manifest.language === 'ru', 'manifest language must be ru')
assert(manifest.level === 'N5', 'manifest level must be N5')

for (const [category, items] of allItems) {
  assert(items.length === manifest.categories[category], `${category} count differs from manifest`)
  const ids = new Set()
  const orders = new Set()
  for (const [index, item] of items.entries()) {
    assert(typeof item.id === 'string' && item.id.startsWith(`${category === 'vocabulary' ? 'vocab' : category}:`), `${category}[${index}] has invalid id`)
    assert(!ids.has(item.id), `${category} has duplicate id ${item.id}`)
    assert(!orders.has(item.order), `${category} has duplicate order ${item.order}`)
    ids.add(item.id)
    orders.add(item.order)
    assert(item.order === index + 1, `${item.id} has a non-sequential order`)
    assert(Array.isArray(item.sourceRefs) && item.sourceRefs.length > 0, `${item.id} has no sourceRefs`)
    for (const sourceRef of item.sourceRefs ?? []) {
      assert(sourceIds.has(sourceRef), `${item.id} has unknown sourceRef ${sourceRef}`)
    }
  }
}

for (const item of grammar) {
  assert(item.pattern?.trim(), `${item.id} has no pattern`)
  assert(item.meaningRu?.trim(), `${item.id} has no Russian meaning`)
  assert(item.explanationRu?.trim(), `${item.id} has no Russian explanation`)
  assert(item.examples?.length > 0, `${item.id} has no example`)
  assert(item.examples.every((example) => example.textJa?.trim() && example.translationRu?.trim()), `${item.id} has an incomplete example`)
}

for (const item of vocabulary) {
  assert(item.term?.trim(), `${item.id} has no term`)
  assert(item.reading?.trim(), `${item.id} has no reading`)
  assert(item.meaningsRu?.length > 0 && item.meaningsRu.every((meaning) => meaning.trim()), `${item.id} has no Russian meanings`)
  assert(item.partOfSpeech?.trim(), `${item.id} has no part of speech`)
}

for (const item of kanji) {
  assert(/^\p{Script=Han}$/u.test(item.character), `${item.id} does not contain one kanji`)
  assert(item.meaningsRu?.length > 0, `${item.id} has no Russian meanings`)
  assert(item.readings?.on?.length + item.readings?.kun?.length > 0, `${item.id} has no Japanese readings`)
  assert(item.examples?.length > 0, `${item.id} has no vocabulary examples`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(
    `Validated ${grammar.length} grammar, ${vocabulary.length} vocabulary and ${kanji.length} kanji items (${manifest.datasetVersion}).`,
  )
}
