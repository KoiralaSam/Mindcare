/**
 * Abstract calm landscape — soft shapes, no literal medical imagery.
 */
export function HeroIllustration() {
  return (
    <div className="landing__art" aria-hidden>
      <svg
        className="landing__art-svg"
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="landing-sun" x1="200" y1="40" x2="260" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--landing-art-sun-mid)" />
            <stop offset="1" stopColor="var(--landing-art-sun-edge)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="landing-hill1" x1="0" y1="200" x2="200" y2="280" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--landing-art-hill-1)" />
            <stop offset="1" stopColor="var(--landing-art-hill-2)" />
          </linearGradient>
          <linearGradient id="landing-hill2" x1="200" y1="220" x2="400" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--landing-art-hill-3)" />
            <stop offset="1" stopColor="var(--landing-art-hill-4)" />
          </linearGradient>
        </defs>
        <circle cx="220" cy="72" r="48" fill="url(#landing-sun)" className="landing__art-sun" />
        <path
          d="M0 240 C80 200 140 220 200 200 C260 180 320 160 400 200 V320 H0 Z"
          fill="url(#landing-hill2)"
          opacity="0.85"
        />
        <path
          d="M0 260 C100 230 180 250 280 228 C320 218 360 232 400 248 V320 H0 Z"
          fill="url(#landing-hill1)"
        />
        <path
          d="M60 248 Q120 220 180 236 T300 228"
          stroke="var(--landing-art-line)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
        />
        <g className="landing__art-leaf" opacity="0.9">
          <ellipse cx="320" cy="118" rx="6" ry="11" fill="var(--landing-art-leaf)" transform="rotate(-25 320 118)" />
          <ellipse cx="300" cy="132" rx="5" ry="9" fill="var(--landing-art-leaf)" transform="rotate(15 300 132)" />
          <ellipse cx="338" cy="136" rx="5" ry="9" fill="var(--landing-art-leaf-2)" transform="rotate(-8 338 136)" />
        </g>
      </svg>
    </div>
  )
}
