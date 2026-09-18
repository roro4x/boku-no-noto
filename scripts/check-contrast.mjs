const pairs = [
  ['Основной текст / бумага', '#3e3a34', '#fff9f0'],
  ['Сильный текст / бумага', '#2e4534', '#fff9f0'],
  ['Вторичный текст / бумага', '#5f655e', '#fff9f0'],
  ['Ссылки / бумага', '#3f6384', '#fff9f0'],
  ['Светлый текст / зелёная шапка', '#eef3e9', '#4f6b52'],
  ['Текст / светло-зелёная карточка', '#2e4534', '#e3ead8'],
  ['Подпись / светло-зелёная карточка', '#4d5b4e', '#e3ead8'],
  ['Дата / бумага', '#4c5b52', '#fff9f0'],
  ['Экран плеера', '#24342b', '#b8c8af'],
  ['Неактивные кнопки плеера', '#51544f', '#e8e5df'],
]

const toRgb = (hex) => hex.match(/[a-f\d]{2}/giu).map((part) => Number.parseInt(part, 16) / 255)
const luminance = (hex) => {
  const [red, green, blue] = toRgb(hex).map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ))
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}
const ratio = (foreground, background) => {
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

let failed = false
for (const [label, foreground, background] of pairs) {
  const value = ratio(foreground, background)
  const passes = value >= 4.5
  failed ||= !passes
  console.log(`${passes ? 'PASS' : 'FAIL'} ${value.toFixed(2)}:1  ${label}`)
}

if (failed) process.exitCode = 1
