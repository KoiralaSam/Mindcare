import { Link } from 'react-router-dom'
import { HeroIllustration } from '../components/landing/HeroIllustration'
import { ThemeToggle } from '../components/landing/ThemeToggle'
import { useAuth } from '../auth/AuthContext'

function postAuthPath(email: string | null, wellnessCompleted: boolean): string {
  if (!email) return '/register'
  if (!wellnessCompleted) return '/login'
  return '/dashboard'
}

export function LandingPage() {
  const { email, wellnessCompleted } = useAuth()
  const primaryTo = postAuthPath(email, wellnessCompleted)

  return (
    <div className="landing landing--minimal">
      <a href="#main" className="landing__skip">
        Skip to content
      </a>

      <header className="landing__nav landing__nav--minimal">
        <div className="landing__nav-inner landing__nav-inner--minimal">
          <Link to="/" className="landing__brand">
            <span className="landing__brand-mark" aria-hidden />
            <span>
              <span className="landing__brand-name">Mindcare</span>
            </span>
          </Link>
          <div className="landing__nav-actions">
            <ThemeToggle />
            {email ? (
              <Link to={primaryTo} className="btn btn--primary landing__nav-cta landing__nav-cta--minimal">
                {wellnessCompleted ? 'Open app' : 'Continue'}
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost landing__nav-secondary landing__nav-secondary--minimal">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn--primary landing__nav-cta landing__nav-cta--minimal">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="landing__main-minimal">
        <section className="landing__hero landing__hero--minimal" aria-labelledby="hero-title">
          <div className="landing__hero-glow landing__hero-glow--soft" aria-hidden />
          <div className="landing__hero-layout landing__hero-layout--minimal">
            <div className="landing__hero-inner">
              <p className="landing__eyebrow">Nepal-first · about 2 minutes</p>
              <h1 id="hero-title" className="landing__hero-title landing__hero-title--minimal">
                Mental wellbeing, <span className="landing__hero-accent">one gentle step at a time</span>
              </h1>
              <p className="landing__hero-lede landing__hero-lede--minimal">
                A calm check-in — not a diagnosis. See where you stand, then learn at your own pace.
              </p>
              <div className="landing__hero-cta landing__hero-cta--minimal">
                <Link to={primaryTo} className="btn btn--primary landing__btn-lg landing__btn-lg--minimal">
                  {email ? (wellnessCompleted ? 'Open app' : 'Finish setup') : 'Begin'}
                </Link>
              </div>
            </div>
            <HeroIllustration />
          </div>
        </section>

        <aside className="landing__disclaimer landing__disclaimer--minimal" role="note">
          <p>
            <strong>Self-reflection only — not clinical care.</strong> If you’re in crisis, contact local emergency
            services or a crisis line.
          </p>
        </aside>
      </main>

      <footer className="landing__footer landing__footer--minimal">
        <p>Mindcare · supportive language, not medical or legal advice.</p>
      </footer>
    </div>
  )
}
