import type { Season } from '../data/season'

// Integer-grid silhouettes keep the seasonal accents in the site's pixel-art world.
const mapleSilhouettes = [
  'M11 1h2v3h2v3h2v3h3V8h3v4h-2v3h2v2h-4v2h-2v2h-4v3h-2v-3H7v-2H5v-2H1v-2h2v-3H1V8h3v2h3V7h2V4h2Z',
  'M11 2h2v3h2v2h2v4h3V9h3v4h-2v2h1v2h-3v2h-3v2h-3v3h-2v-3H8v-2H5v-2H2v-2h1v-2H1V9h3v2h3V7h2V5h2Z',
  'M11 1h2v4h2v3h2v2h2V7h3v5h-2v3h3v2h-4v2h-3v2h-3v3h-2v-3H8v-2H5v-2H1v-2h3v-3H2V7h3v3h2V8h2V5h2Z',
]

const snowflakeArm = 'M12 2v20M9 4l3 3 3-3M9 20l3-3 3 3'

export function SeasonalParticleGlyph({ season, variant }: { season: Season; variant: number }) {
  if (season === 'summer') return null
  return (
    <svg className={`seasonal-glyph seasonal-glyph--${season}`} viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      {season === 'autumn' && <>
        <path d={mapleSilhouettes[variant % mapleSilhouettes.length]} />
        <path className="seasonal-maple-highlight" d="M11 5h2v5h-2ZM5 11h2v2H5Zm12 0h2v2h-2Z" />
        <path className="seasonal-maple-veins" d="M11 11h2v13h-2v-5H9v-2H7v-2H5v-2h2v2h2v2h2Zm2 6h2v-2h2v-2h2v2h-2v2h-2v2h-2Z" />
      </>}
      {season === 'spring' && <>
        <path d="M7 3h3v2h4V3h3v2h2v3h1v5h-2v3h-3v3h-2v3h-2v-3H9v-3H6v-3H4V8h1V5h2Z" />
        <path className="seasonal-petal-highlight" d="M7 6h2v5H7Zm2 5h2v4H9Z" />
      </>}
      {season === 'winter' && <>
        <g className="seasonal-snowflake-edge">
          {[0, 60, 120].map(angle => <path key={angle} d={snowflakeArm} transform={`rotate(${angle} 12 12)`} />)}
        </g>
        <g className="seasonal-snowflake-ice">
          {[0, 60, 120].map(angle => <path key={angle} d={snowflakeArm} transform={`rotate(${angle} 12 12)`} />)}
        </g>
      </>}
    </svg>
  )
}
