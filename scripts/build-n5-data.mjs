import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [openJlptDir, jmdictPath, kanjidicPath] = process.argv.slice(2)

if (!openJlptDir || !jmdictPath || !kanjidicPath) {
  throw new Error(
    'Usage: node scripts/build-n5-data.mjs <openjlpt-dir> <jmdict-rus.json> <kanjidic2-all.json>',
  )
}

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const [openVocabulary, openGrammar, openKanji, jmdict, kanjidic] = await Promise.all([
  readJson(resolve(openJlptDir, 'openjlpt-vocab-n5.json')),
  readJson(resolve(openJlptDir, 'openjlpt-grammar-n5.json')),
  readJson(resolve(openJlptDir, 'openjlpt-kanji-n5.json')),
  readJson(resolve(jmdictPath)),
  readJson(resolve(kanjidicPath)),
])

const grammarRu = [
  ['но; однако', 'Соединяет две части высказывания и вводит противопоставление.', 'Эта книга дорогая, но интересная.'],
  ['есть; находится', 'います употребляется с живыми существами, あります — с предметами и явлениями.', 'В парке есть кошка.'],
  ['потому что; так как', 'Ставит причину перед результатом или объяснением.', 'Я не выхожу, потому что идёт дождь.'],
  ['любить / не любить', '好き и 嫌い описывают предпочтение; объект отмечается частицей が.', 'Я люблю кошек.'],
  ['хотеть сделать', 'Присоединяется к основе глагола и выражает желание говорящего.', 'Я хочу поехать в Японию.'],
  ['когда-либо делал', 'Описывает прошлый опыт с формой глагола на た.', 'Я уже бывал в Японии.'],
  ['место действия / средство', 'Частица で отмечает место действия или средство, которым оно выполняется.', 'Я занимаюсь в школе.'],
  ['делает сейчас / состояние', 'Форма на ている передаёт продолжающееся действие или возникшее состояние.', 'Сейчас я ем.'],
  ['пожалуйста, сделайте', 'Вежливая просьба с формой глагола на て.', 'Пожалуйста, откройте окно.'],
  ['был / была / было', 'Вежливая прошедшая форма связки です.', 'Вчера было воскресенье.'],
  ['не является', 'Вежливое отрицание для существительных и な-прилагательных.', 'Я не студент.'],
  ['нельзя делать', 'Выражает запрет с формой глагола на て.', 'Здесь нельзя фотографировать.'],
  ['можно делать', 'Выражает разрешение с формой глагола на て.', 'Можно сфотографировать?'],
  ['и; вместе с', 'Соединяет существительные или отмечает совместное действие.', 'Я смотрю фильм с другом.'],
  ['можно не делать', 'Показывает, что действие не обязательно.', 'Завтра можно не приходить рано.'],
  ['нужно; необходимо', 'Выражает обязанность или необходимость.', 'Нужно сдать доклад до завтра.'],
  ['время / направление / адресат', 'Частица に отмечает время, направление движения или адресата.', 'Я встаю в семь часов.'],
  ['давайте сделаем', 'Вежливое приглашение выполнить действие вместе.', 'Давайте пойдём вместе.'],
  ['не хотите ли?', 'Вежливое приглашение или предложение.', 'Не хотите поесть вместе?'],
  ['прямое дополнение', 'Частица を отмечает объект действия.', 'Я читаю книгу.'],
]

const kanjiMeaningsRu = {
  日: ['день', 'солнце'], 一: ['один'], 国: ['страна'], 人: ['человек'], 年: ['год'],
  大: ['большой'], 十: ['десять'], 二: ['два'], 本: ['книга', 'основа'], 中: ['середина', 'внутри'],
  長: ['длинный', 'старший'], 出: ['выходить', 'вынимать'], 三: ['три'], 時: ['время', 'час'],
  行: ['идти', 'проводить'], 見: ['смотреть', 'видеть'], 月: ['месяц', 'луна'], 後: ['после', 'позади'],
  前: ['перед', 'до'], 生: ['жизнь', 'рождаться'], 五: ['пять'], 間: ['промежуток', 'между'],
  上: ['верх', 'над'], 東: ['восток'], 四: ['четыре'], 今: ['сейчас'], 金: ['золото', 'деньги'],
  九: ['девять'], 入: ['входить', 'вставлять'], 学: ['учёба', 'изучать'], 高: ['высокий', 'дорогой'],
  円: ['круг', 'иена'], 子: ['ребёнок'], 外: ['снаружи', 'вне'], 八: ['восемь'], 六: ['шесть'],
  下: ['низ', 'под'], 来: ['приходить', 'следующий'], 気: ['дух', 'настроение'], 小: ['маленький'],
  七: ['семь'], 山: ['гора'], 話: ['разговор', 'говорить'], 女: ['женщина'], 北: ['север'],
  午: ['полдень'], 百: ['сто'], 書: ['писать'], 先: ['впереди', 'прежде'], 名: ['имя'],
  川: ['река'], 千: ['тысяча'], 水: ['вода'], 半: ['половина'], 男: ['мужчина'], 西: ['запад'],
  電: ['электричество'], 校: ['школа'], 語: ['язык', 'слово'], 土: ['земля', 'почва'], 木: ['дерево'],
  聞: ['слышать', 'спрашивать'], 食: ['есть', 'пища'], 車: ['машина', 'повозка'], 何: ['что'],
  南: ['юг'], 万: ['десять тысяч'], 毎: ['каждый'], 白: ['белый'], 天: ['небо'], 母: ['мать'],
  火: ['огонь'], 右: ['право'], 読: ['читать'], 友: ['друг'], 左: ['лево'], 休: ['отдыхать'],
  父: ['отец'], 雨: ['дождь'],
}

const vocabularyEditorialFallback = {
  'ええ|': [['да'], 'междометие'],
  'お菓子|おかし': [['сладости', 'конфеты'], 'существительное'],
  'お皿|おさら': [['тарелка', 'блюдо'], 'существительное'],
  'お酒|おさけ': [['алкоголь', 'сакэ'], 'существительное'],
  'お風呂|おふろ': [['ванна', 'купание'], 'существительное'],
  'お弁当|おべんとう': [['бэнто', 'еда в коробке'], 'существительное'],
  'カレー|': [['карри'], 'существительное'],
  'ください|': [['пожалуйста, дайте'], 'выражение'],
  'グラム|': [['грамм'], 'существительное'],
  'コーヒー|': [['кофе'], 'существительное'],
  'コピーする|': [['копировать', 'делать копию'], 'глагол'],
  'ズボン|': [['брюки'], 'существительное'],
  'ゼロ|': [['ноль'], 'числительное'],
  'そちら|': [['там', 'в ту сторону'], 'местоимение'],
  'そっち|': [['там', 'туда'], 'местоимение'],
  'それから|': [['после этого', 'затем'], 'союз'],
  'それでは|': [['тогда', 'в таком случае'], 'союз'],
  'たばこ|': [['табак', 'сигареты'], 'существительное'],
  'どうぞ|': [['пожалуйста'], 'наречие'],
  'パン|': [['хлеб'], 'существительное'],
  'まずい|': [['невкусный', 'неудачный'], 'прилагательное'],
  'メートル|': [['метр'], 'существительное'],
  'ゆっくりと|': [['медленно', 'не спеша'], 'наречие'],
  'より、ほう|': [['чем; более предпочтительный вариант'], 'выражение'],
  'ワイシャツ|': [['деловая рубашка'], 'существительное'],
  '嫌|いや': [['неприятный', 'не нравиться'], 'прилагательное'],
  '見る 観る|みる': [['смотреть', 'видеть'], 'глагол'],
  '撮る|とる': [['снимать фото или видео'], 'глагол'],
  '昼御飯|ひるごはん': [['обед'], 'существительное'],
  '朝御飯|あさごはん': [['завтрак'], 'существительное'],
  '晩御飯|ばんごはん': [['ужин'], 'существительное'],
  '無くす|なくす': [['терять', 'утрачивать'], 'глагол'],
}

const posRu = (codes) => {
  const code = codes[0] ?? ''
  if (code.startsWith('v')) return 'глагол'
  if (code.startsWith('adj')) return 'прилагательное'
  if (code === 'adv') return 'наречие'
  if (code === 'prt') return 'частица'
  if (code === 'conj') return 'союз'
  if (code === 'pn') return 'местоимение'
  if (code === 'num') return 'числительное'
  if (code === 'ctr') return 'счётный суффикс'
  if (code === 'exp') return 'выражение'
  return 'существительное'
}

const isKana = (value) => /^[\u3040-\u30ffー・]+$/u.test(value)
const cleanGloss = (value) => value.replace(/^\d+[.)）]\s*/u, '').replace(/^[а-я]\)\s*/iu, '').trim()
const stableId = (prefix, ...parts) =>
  `${prefix}:${createHash('sha1').update(parts.join('\u0000')).digest('hex').slice(0, 12)}`

const wordIndex = new Map()
for (const entry of jmdict.words) {
  for (const form of [...entry.kanji, ...entry.kana]) {
    const bucket = wordIndex.get(form.text) ?? []
    bucket.push(entry)
    wordIndex.set(form.text, bucket)
  }
}

const chooseEntry = (item) => {
  const forms = item.word.split('/').map((value) => value.trim())
  const candidates = [...new Set(forms.flatMap((form) => wordIndex.get(form) ?? []))]
  const matchingReading = item.reading
    ? candidates.filter((entry) => entry.kana.some((kana) => kana.text === item.reading))
    : candidates
  const pool = matchingReading.length > 0 ? matchingReading : candidates
  return (
    pool.find((entry) => entry.kanji.some((form) => form.common) || entry.kana.some((form) => form.common)) ??
    pool[0]
  )
}

const missingVocabulary = []
const vocabulary = openVocabulary.map((item, index) => {
  const entry = chooseEntry(item)
  const senses = entry?.sense ?? []
  let meaningsRu = [
    ...new Set(
      senses.flatMap((sense) => sense.gloss)
        .filter((gloss) => gloss.lang === 'rus')
        .map((gloss) => cleanGloss(gloss.text))
        .filter(Boolean),
    ),
  ].slice(0, 5)

  const editorialFallback = vocabularyEditorialFallback[`${item.word}|${item.reading}`]
  if (meaningsRu.length === 0 && editorialFallback) {
    meaningsRu = editorialFallback[0]
  }

  if (meaningsRu.length === 0) {
    missingVocabulary.push({ word: item.word, reading: item.reading, meanings: item.meanings })
  }

  const reading = item.reading || (isKana(item.word) || editorialFallback ? item.word : entry?.kana[0]?.text ?? '')
  return {
    id: stableId('vocab', item.word, reading),
    term: item.word,
    reading,
    meaningsRu,
    partOfSpeech: editorialFallback?.[1] ?? posRu(senses[0]?.partOfSpeech ?? []),
    sourceRefs: ['openjlpt', 'jmdict-rus'],
    order: index + 1,
  }
})

const kanjidicByCharacter = new Map(kanjidic.characters.map((item) => [item.literal, item]))
const kanji = openKanji.map((item, index) => {
  const source = kanjidicByCharacter.get(item.character)
  const readings = source?.readingMeaning?.groups?.flatMap((group) => group.readings) ?? []
  return {
    id: `kanji:u${item.character.codePointAt(0).toString(16)}`,
    character: item.character,
    meaningsRu: kanjiMeaningsRu[item.character] ?? [],
    readings: {
      on: readings.filter((reading) => reading.type === 'ja_on').map((reading) => reading.value),
      kun: readings.filter((reading) => reading.type === 'ja_kun').map((reading) => reading.value),
    },
    examples: vocabulary
      .filter((word) => word.term.includes(item.character))
      .slice(0, 3)
      .map((word) => ({
        term: word.term,
        reading: word.reading,
        meaningRu: word.meaningsRu[0],
      })),
    sourceRefs: ['openjlpt', 'kanjidic2'],
    order: index + 1,
  }
})

const grammar = openGrammar.map((item, index) => {
  const translation = grammarRu[index]
  if (!translation) throw new Error(`Missing Russian editorial translation for grammar item ${index + 1}`)
  return {
    id: `grammar:n5-${String(index + 1).padStart(3, '0')}`,
    pattern: item.pattern.replace(/（[^）]+）/gu, ''),
    meaningRu: translation[0],
    explanationRu: translation[1],
    examples: [{ textJa: item.examples[0]?.ja ?? '', translationRu: translation[2] }],
    sourceRefs: ['openjlpt'],
    order: index + 1,
    tags: item.tags ?? [],
  }
})

if (missingVocabulary.length > 0) {
  await writeFile(
    resolve(openJlptDir, 'missing-vocabulary.json'),
    `${JSON.stringify(missingVocabulary, null, 2)}\n`,
  )
  throw new Error(
    `${missingVocabulary.length} vocabulary items have no Russian JMdict match; see missing-vocabulary.json`,
  )
}

const missingKanji = kanji.filter((item) => item.meaningsRu.length === 0 || (!item.readings.on.length && !item.readings.kun.length))
if (missingKanji.length > 0) {
  throw new Error(`Incomplete kanji editorial data: ${missingKanji.map((item) => item.character).join(', ')}`)
}

const outputDir = resolve('public/data/n5')
await mkdir(outputDir, { recursive: true })

const sources = {
  schemaVersion: 1,
  accessedAt: '2026-09-18',
  sources: [
    {
      id: 'openjlpt',
      title: 'OpenJLPT',
      url: 'https://github.com/evanclan/OpenJLPT',
      license: 'CC BY-SA 4.0',
      usage: 'Community N5 classification, grammar structure, vocabulary and kanji selection.',
    },
    {
      id: 'jmdict-rus',
      title: 'JMdict Russian via jmdict-simplified',
      url: 'https://github.com/scriptin/jmdict-simplified',
      version: jmdict.version,
      dictionaryDate: jmdict.dictDate,
      license: 'EDRDG licence / CC BY-SA 4.0 distribution terms',
      usage: 'Russian vocabulary glosses and part-of-speech metadata.',
    },
    {
      id: 'kanjidic2',
      title: 'KANJIDIC2 via jmdict-simplified',
      url: 'https://www.edrdg.org/kanjidic/kanjd2index_legacy.html',
      version: kanjidic.version,
      dictionaryDate: kanjidic.dictDate,
      license: 'EDRDG licence / CC BY-SA 4.0 distribution terms',
      usage: 'Japanese readings for the selected kanji.',
    },
    {
      id: 'jlpt-official',
      title: 'Official JLPT FAQ',
      url: 'https://www.jlpt.jp/e/faq/',
      license: 'Reference only; no test questions reproduced.',
      usage: 'Confirms that the JLPT does not publish an official vocabulary, kanji and grammar list.',
    },
  ],
  editorialNotes: [
    'Russian kanji glosses and grammar explanations are concise project editorial translations checked against the cited English source fields.',
    'This is a community-aligned study dataset, not an official or exhaustive JLPT syllabus.',
  ],
}

const manifest = {
  schemaVersion: 1,
  datasetVersion: '2026-09-openjlpt-1',
  language: 'ru',
  level: 'N5',
  categories: { grammar: grammar.length, vocabulary: vocabulary.length, kanji: kanji.length },
  sourceIds: sources.sources.map((source) => source.id),
}

for (const [filename, value] of Object.entries({
  'manifest.json': manifest,
  'sources.json': sources,
  'grammar.json': grammar,
  'vocabulary.json': vocabulary,
  'kanji.json': kanji,
})) {
  await writeFile(resolve(outputDir, filename), `${JSON.stringify(value, null, 2)}\n`)
}

console.log(JSON.stringify(manifest))
