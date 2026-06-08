/* The Travel Planner mascot: a single goose with a backpack and sunglasses.
 *
 * Deliberately ONE variant (no status/emotion set like Gänsemünchen) and meant
 * to be used sparingly — empty states, onboarding, the login accent.
 *
 * Inline SVG so there's no asset dependency; `currentColor` drives the body so
 * it themes via Tailwind text-* classes.
 */

export default function Mascot({
  size = 96,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      role="img"
      aria-label="Reise-Gans mit Rucksack und Sonnenbrille"
    >
      {/* Backpack */}
      <rect x="20" y="52" width="34" height="40" rx="10" fill="#c8623f" />
      <rect x="28" y="60" width="18" height="14" rx="4" fill="#7d3a22" opacity="0.55" />
      {/* Strap */}
      <path
        d="M50 50 C 60 54, 62 70, 56 86"
        stroke="#7d3a22"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Body */}
      <path
        d="M58 96 C 38 96, 40 66, 52 56 C 58 51, 70 50, 78 56 C 92 66, 92 96, 74 96 Z"
        fill="currentColor"
      />
      {/* Neck + head */}
      <path
        d="M74 60 C 74 44, 72 34, 82 28 C 90 23, 98 26, 98 26"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="90" cy="28" r="9" fill="currentColor" />

      {/* Sunglasses */}
      <rect x="86" y="24" width="9" height="6" rx="2" fill="#22201b" />
      <rect x="96" y="24" width="9" height="6" rx="2" fill="#22201b" />
      <line x1="95" y1="27" x2="96" y2="27" stroke="#22201b" strokeWidth="2" />
      <line x1="86" y1="26" x2="82" y2="27" stroke="#22201b" strokeWidth="2" strokeLinecap="round" />

      {/* Beak */}
      <path d="M99 31 L 110 33 L 99 36 Z" fill="#e8b13e" />
      {/* Feet */}
      <path d="M56 95 l 0 8 M52 103 l 8 0" stroke="#e8b13e" strokeWidth="3" strokeLinecap="round" />
      <path d="M70 95 l 0 8 M66 103 l 8 0" stroke="#e8b13e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
