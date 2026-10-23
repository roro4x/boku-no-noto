export type SiteLink = {
  id: string
  title: string
  label: string
  caption: string
  url: string
  banner: string
  description?: string
}

export const siteLinks: SiteLink[] = [
  {
    id: 'fast-tool',
    title: 'Fast Tool',
    label: 'FAST',
    caption: 'TOOL',
    url: 'https://fast-tool.ru/',
    banner: 'assets/banners/fast-tool.svg',
  },
  {
    id: 'tae-kim-japanese-guide-ru',
    title: 'Tae Kim Japanese Guide Ru',
    label: 'TAE KIM',
    caption: 'GUIDE RU',
    url: 'https://ganqqwerty.github.io/TaeKimJapaneseGuideRu/',
    banner: 'assets/banners/tae-kim-guide-ru.svg',
  },
  {
    id: 'jisho',
    title: 'Jisho',
    label: 'JISHO',
    caption: 'JP DICTIONARY',
    url: 'https://jisho.org/',
    banner: 'assets/banners/jisho.svg',
  },
  {
    id: 'tadoku',
    title: 'Japanese Tadoku',
    label: 'TADOKU',
    caption: 'READ JAPANESE',
    url: 'https://tadoku.org/japanese/en/',
    banner: 'assets/banners/tadoku.svg',
  },
  {
    id: 'tofugu',
    title: 'Tofugu',
    label: 'TOFUGU',
    caption: 'LEARN JAPANESE',
    url: 'https://www.tofugu.com/',
    banner: 'assets/banners/tofugu.svg',
  },
  {
    id: 'nhk-school',
    title: 'NHK for School',
    label: 'NHK',
    caption: 'FOR SCHOOL',
    url: 'https://edu.web.nhk/school/',
    banner: 'assets/banners/nhk-school.svg',
  },
  {
    id: 'anisub',
    title: 'AniSub',
    label: 'AniSub',
    caption: 'ANISUB.TV',
    url: 'https://anisub.tv/',
    banner: 'assets/banners/anisub.svg',
  },
  {
    id: 'radiko',
    title: 'radiko',
    label: 'radiko',
    caption: 'RADIKO.JP',
    url: 'https://radiko.jp/',
    banner: 'assets/banners/radiko.svg',
  },
  {
    id: 'podcast-qr',
    title: 'PodcastQR',
    label: 'PodcastQR',
    caption: 'JOQR.CO.JP',
    url: 'https://podcastqr.joqr.co.jp/',
    banner: 'assets/banners/podcast-qr.svg',
  },
]
