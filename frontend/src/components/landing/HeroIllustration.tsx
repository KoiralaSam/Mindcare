export function HeroIllustration() {
  return (
    <div className="landing__art" aria-hidden>
      <svg className="landing__art-svg" viewBox="0 0 320 280" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hero-sun" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--landing-art-sun-mid)" />
            <stop offset="100%" stopColor="var(--landing-art-sun-edge)" />
          </linearGradient>
        </defs>
        <circle className="landing__art-sun" cx="220" cy="80" r="56" fill="url(#hero-sun)" />
        <path
          fill="var(--landing-art-hill-1)"
          d="M0 200 Q80 160 160 190 T320 175 V280 H0Z"
        />
        <path
          fill="var(--landing-art-hill-2)"
          d="M0 220 Q120 200 200 215 T320 205 V280 H0Z"
        />
      </svg>
    </div>
  )
}
