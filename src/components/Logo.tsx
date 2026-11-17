type LogoProps = {
  compact?: boolean
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="Hackmate">
      <svg
        className="brand-mark"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="44" height="44" rx="13" fill="#123C32" />
        <path
          d="M8 27c7-1 12-5 16-11 1.5 4 4.5 6 8 6-3.5 4.5-8.5 7-14 7-4 0-8-1-10-2z"
          fill="#BDF3D9"
        />
        <circle cx="33" cy="11" r="2.8" fill="#F2CA7E" />
      </svg>
      {!compact && (
        <span className="brand-word">
          hackmate<span className="brand-dot">.</span>
        </span>
      )}
    </div>
  )
}
