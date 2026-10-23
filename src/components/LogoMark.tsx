/**
 * Logotypen: ett vitt M på lila bakgrund, där högra benet slutar i en orange bock.
 * Används i sidhuvudet, som app- och flikikon och i delningsbilder (fungerar även i
 * next/og). Allt viktigt ligger inom mitten så att den tål att beskäras till en cirkel.
 * Samma motiv finns som fil i marknadsforing/profilbild/logo.svg.
 */
export function LogoMark({ size, rounded = 0, id = "logo" }: { size: number; rounded?: number; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ borderRadius: rounded, flexShrink: 0 }}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b3ee0" />
          <stop offset="1" stopColor="#3a21a3" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id}-bg)`} />
      <polyline
        points="25,69 25,31 48,55 71,31 71,51"
        fill="none"
        stroke="#ffffff"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="68" cy="67" r="15.5" fill="#d9480f" stroke="#ffffff" strokeWidth="4" />
      <polyline
        points="60.8,67.5 66,72.7 75.5,61.8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
