export type SiteLink = {
  id: string
  title: string
  url: string
  banner: string
  description?: string
}

export const siteLinks: SiteLink[] = [
  {
    id: 'fast-tool',
    title: 'Fast Tool',
    url: 'https://fast-tool.ru/',
    banner: 'assets/banners/fast-tool.svg',
  },
  {
    id: 'tae-kim-japanese-guide-ru',
    title: 'Tae Kim Japanese Guide Ru',
    url: 'https://ganqqwerty.github.io/TaeKimJapaneseGuideRu/',
    banner: 'assets/banners/tae-kim-guide-ru.svg',
  },
  {
    id: 'jisho',
    title: 'Jisho',
    url: 'https://jisho.org/',
    banner: 'assets/banners/jisho.svg',
  },
  {
    id: 'tadoku',
    title: 'Japanese Tadoku',
    url: 'https://tadoku.org/japanese/en/',
    banner: 'assets/banners/tadoku.svg',
  },
]
