import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ZONES } from '../assessment/zones'
import { HeroIllustration } from '../components/landing/HeroIllustration'
import {
  IconBook,
  IconHeart,
  IconLeaf,
  IconShield,
  IconSpark,
  IconSun,
} from '../components/landing/LandingIcons'
import { ThemeToggle } from '../components/landing/ThemeToggle'
import { useAuth } from '../auth/AuthContext'
import { RESOURCES } from '../content/resources'

const SECTIONS = [
  {
    title: 'Mood & anxiety',
    detail:
      'Four questions on mood, worry, and overthinking — clear, Nepal-friendly wording.',
  },
  {
    title: 'Wellbeing',
    detail: 'WHO-5–inspired items: calm, energy, meaning, and engagement.',
  },
  {
    title: 'Daily function',
    detail: 'How feelings affect study, work, focus, and sleep.',
  },
  {
    title: 'Support',
    detail:
      'Whether you have someone you can talk to honestly — support matters for risk.',
  },
  {
    title: 'Safety (when needed)',
    detail:
      'One extra question only when scores suggest it. Skip allowed. Honest answers route to human support.',
  },
] as const

const FEATURES: {
  title: string
  body: string
  Icon: typeof IconSpark
}[] = [
  {
    title: 'Quick assessment',
    body: 'About ninety seconds to two minutes. Enough signal to suggest a support zone without feeling like a clinic form.',
    Icon: IconSpark,
  },
  {
    title: 'Support zones',
    body: 'Green, yellow, orange, and red bands describe how heavy things feel — not diagnostic categories. Copy stays human.',
    Icon: IconHeart,
  },
  {
    title: 'Safety first',
    body: 'When certain answers indicate elevated concern, the app routes to human support — not streaks, XP, or cheerleading.',
    Icon: IconShield,
  },
  {
    title: 'Learn in context',
    body: 'Lessons echo brief screeners (mood, worry, wellbeing) with room for words like “overthinking” that fit everyday Nepal conversations.',
    Icon: IconBook,
  },
]

function greetingMessage(): { title: string; sub: string } {
  const h = new Date().getHours()
  if (h < 12) {
    return {
      title: 'Good morning',
      sub: 'Take a gentle moment for yourself today. Small check-ins can make a real difference.',
    }
  }
  if (h < 17) {
    return {
      title: 'Good afternoon',
      sub: 'A few calm minutes can create space for clarity — you are allowed to pause.',
    }
  }
  return {
    title: 'Good evening',
    sub: 'Rest and self-kindness matter. This space is here whenever you are ready.',
  }
}

export function LandingPage() {
  const { email } = useAuth()
  const greet = greetingMessage()

  return (
    <div className="landing">
      <a href="#main" className="landing__skip">
        Skip to content
      </a>

      <header className="landing__nav">
        <div className="landing__nav-inner">
          <Link to="/" className="landing__brand">
            <span className="landing__brand-mark" aria-hidden />
            <span>
              <span className="landing__brand-name">NLN</span>
              <span className="landing__brand-sub">Mindcare</span>
            </span>
          </Link>
          <nav className="landing__links" aria-label="Page sections">
            <a href="#quick">Daily mood</a>
            <a href="#how">Check-in</a>
            <a href="#zones">Zones</a>
            <a href="#safety">Safety</a>
            <a href="#resources">Resources</a>
          </nav>
          <div className="landing__nav-actions">
            <ThemeToggle />
            {email ? (
              <Link to="/dashboard" className="btn btn--primary landing__nav-cta">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost landing__nav-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn--primary landing__nav-cta">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="landing__greeting" id="greeting" aria-labelledby="greeting-title">
        <div className="landing__greeting-inner">
          <h2 id="greeting-title">{greet.title}</h2>
          <p>{greet.sub}</p>
        </div>
      </section>

      <main id="main">
        <section className="landing__hero" aria-labelledby="hero-title">
          <div className="landing__hero-glow" aria-hidden />
          <div className="landing__hero-layout">
            <div className="landing__hero-inner">
              <p className="landing__pill">
                <span className="landing__pill-dot" aria-hidden />
                Nepal-first · ~2 minute check-in
              </p>
              <h1 id="hero-title" className="landing__hero-title">
                Mental wellbeing,
                <span className="landing__hero-accent"> one gentle step at a time</span>
              </h1>
              <p className="landing__hero-lede">
                Project NLN is a calm, bite-sized path through emotional health — grounded in validated
                screeners, rewritten in simpler English and relatable wording. See where you stand, then learn
                at a pace that fits you.
              </p>
              <div className="landing__hero-cta">
                <Link
                  to={email ? '/dashboard' : '/register'}
                  className="btn btn--primary landing__btn-lg"
                >
                  {email ? 'Open app' : 'Quick check-in'}
                </Link>
                <a href="#how" className="btn btn--ghost landing__btn-lg">
                  How it works
                </a>
              </div>
              <ul className="landing__stats" aria-label="Product highlights">
                <li>
                  <strong>~2 min</strong>
                  <span>Core questions</span>
                </li>
                <li>
                  <strong>12 + 1</strong>
                  <span>Safety when needed</span>
                </li>
                <li>
                  <strong>4 zones</strong>
                  <span>Support-focused</span>
                </li>
              </ul>
            </div>
            <HeroIllustration />
          </div>
        </section>

        <section className="landing__quick" id="quick" aria-labelledby="quick-title">
          <div className="landing__quick-head">
            <h2 id="quick-title">Start your day</h2>
            <p>Pick a small, low-pressure step — you can always come back later.</p>
          </div>
          <div className="landing__quick-grid">
            <Link to={email ? '/dashboard' : '/register'} className="landing__quick-card">
              <span className="landing__quick-icon" aria-hidden>
                <IconLeaf />
              </span>
              <h3>Daily mood</h3>
              <p>Notice how you feel without judging it — a simple pause before the rest of your day.</p>
              <span className="landing__quick-cta">
                {email ? 'Open app →' : 'Sign in or create account →'}
              </span>
            </Link>
            <Link to={email ? '/dashboard' : '/register'} className="landing__quick-card">
              <span className="landing__quick-icon" aria-hidden>
                <IconSpark />
              </span>
              <h3>Quick check-in</h3>
              <p>Our short questionnaire helps place you in a support zone — never a diagnosis.</p>
              <span className="landing__quick-cta">{email ? 'Open app →' : 'Begin check-in →'}</span>
            </Link>
            <a href="#features" className="landing__quick-card">
              <span className="landing__quick-icon" aria-hidden>
                <IconSun />
              </span>
              <h3>Explore lessons</h3>
              <p>Preview how NLN pairs learning paths with how you are doing emotionally.</p>
              <span className="landing__quick-cta">See what’s inside ↓</span>
            </a>
          </div>
        </section>

        <aside className="landing__disclaimer" role="note">
          <p>
            <strong>This is a self-check for emotional wellbeing, not a diagnosis.</strong> It does not replace
            care from a qualified professional. If you are in crisis, use local emergency services or a crisis
            line right away.
          </p>
        </aside>

        <section className="landing__section" id="features" aria-labelledby="features-title">
          <div className="landing__section-head">
            <h2 id="features-title">Built for real life</h2>
            <p>Small steps, honest language, and help when answers call for it.</p>
          </div>
          <div className="landing__feature-grid">
            {FEATURES.map(({ title, body, Icon }) => (
              <article key={title} className="landing__feature">
                <div className="landing__feature-top">
                  <span className="landing__feature-icon" aria-hidden>
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                </div>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing__section landing__section--alt" id="how" aria-labelledby="how-title">
          <div className="landing__section-head">
            <h2 id="how-title">What the check-in covers</h2>
            <p>Five blocks, one question at a time — calm pacing and a visible progress path.</p>
          </div>
          <ol className="landing__timeline">
            {SECTIONS.map((s, i) => (
              <li key={s.title} className="landing__timeline-item">
                <span className="landing__timeline-index" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing__section" id="zones" aria-labelledby="zones-title">
          <div className="landing__section-head">
            <h2 id="zones-title">Where you stand</h2>
            <p>
              A simple product score combines mood, inverted wellbeing, functioning, and support — max 48.
              These bands guide what you unlock next.
            </p>
          </div>
          <div className="landing__zone-grid">
            {ZONES.map((z) => (
              <article
                key={z.name}
                className="landing__zone-card"
                style={{ '--zone': z.tone } as CSSProperties}
              >
                <p className="landing__zone-meta">
                  {z.name} · {z.range}
                </p>
                <h3>{z.label}</h3>
                <p>{z.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing__section landing__safety" id="safety" aria-labelledby="safety-title">
          <div className="landing__safety-inner">
            <h2 id="safety-title">If things feel too heavy</h2>
            <p>
              If the optional safety question is shown and you answer in a way that suggests ongoing thoughts
              of not wanting to continue, NLN is designed to leave the normal lesson path and show{' '}
              <strong>immediate human support options</strong> — trusted people, counseling, and helplines.
              That behavior is intentional and non-optional in the product spec.
            </p>
          </div>
        </section>

        <section className="landing__section landing__section--narrow" id="resources" aria-labelledby="res-title">
          <div className="landing__section-head">
            <h2 id="res-title">Public resources behind the curriculum</h2>
            <p>Green-zone learning paths can point to trusted global references (examples below).</p>
          </div>
          <ul className="landing__resource-list">
            {RESOURCES.map((r) => (
              <li key={r.href}>
                <a href={r.href} target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing__closing">
          <h2>Ready when you are</h2>
          <p>No pressure — you can skip for now inside the app when that flow exists.</p>
          <Link to={email ? '/dashboard' : '/register'} className="btn btn--primary landing__btn-lg">
            {email ? 'Go to dashboard' : 'Create account'}
          </Link>
        </section>
      </main>

      <footer className="landing__footer">
        <p>
          <strong>Mindcare</strong> · Project NLN — supportive, non-judgmental language. Not clinical or legal
          advice.
        </p>
      </footer>
    </div>
  )
}
