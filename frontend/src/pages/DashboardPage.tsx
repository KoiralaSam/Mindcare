import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { ZoneId } from '../assessment/zones'
import { zoneById } from '../assessment/zones'
import { useAssessment } from '../assessment/useAssessment'
import { RESOURCES } from '../content/resources'

const LANGUAGE_LABEL: Record<string, string> = {
  en: 'English',
  ne: 'Nepali',
  hi: 'Hindi',
  other: 'Other',
}

const TRACKS = [
  {
    slug: 'emotional-fitness',
    title: 'Emotional Fitness',
    blurb: 'Name feelings, tell thoughts from facts, ride waves — build emotional fitness.',
    lessons: 5,
  },
  {
    slug: 'stress-prevention',
    title: 'Stress Prevention',
    blurb: 'Spot stress signals, breathing tools, reframing, and a personal stress kit.',
    lessons: 5,
  },
  {
    slug: 'self-awareness',
    title: 'Self-Awareness',
    blurb: 'Inner weather, triggers, values, inner coach, micro-reflection.',
    lessons: 5,
  },
  {
    slug: 'healthy-habits',
    title: 'Healthy Habits',
    blurb: 'Sleep, movement, connection, digital boundaries, and your daily routine.',
    lessons: 5,
  },
] as const

function recommendationForZone(zoneId: ZoneId | null): string {
  if (!zoneId) {
    return 'Complete a quick check-in to see a support zone and a suggested place to start.'
  }
  switch (zoneId) {
    case 'green':
      return 'Any track fits — Emotional Fitness is a natural default for prevention and habits.'
    case 'yellow':
      return 'Stress Prevention or Self-Awareness often match when pressure and overthinking build up.'
    case 'orange':
      return 'Stress Prevention is a gentle start — try grounding and breathing lessons before heavier reflection.'
    case 'red':
      return 'Human support and safety come first. Lessons stay minimal until you feel a bit steadier.'
    default:
      return ''
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { email, profile, signOut } = useAuth()
  const { stored } = useAssessment()

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  const displayName = profile?.preferredName?.trim() || email?.split('@')[0] || 'there'
  const zoneMeta = stored ? zoneById(stored.zoneId) : null
  const zoneStyle = zoneMeta ? ({ '--zone': zoneMeta.tone } as CSSProperties) : undefined

  return (
    <main className="shell shell--wide">
      <section className="panel panel--dash" aria-labelledby="dash-title">
        <header className="dash-header">
          <div>
            <p className="eyebrow">NLN · Dashboard</p>
            <h1 id="dash-title" className="title title--sm">
              Welcome, {displayName}
            </h1>
            <p className="lede lede--compact">
              Signed in as <strong>{email}</strong>
              {profile?.primaryLanguage ? (
                <>
                  {' '}
                  · Language:{' '}
                  <strong>
                    {LANGUAGE_LABEL[profile.primaryLanguage] ?? profile.primaryLanguage}
                  </strong>
                </>
              ) : null}
            </p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
            Sign out
          </button>
        </header>

        <div className="dash-hero">
          <div className="dash-hero__copy">
            <h2 className="dash-hero__title">Quick check-in</h2>
            <p className="dash-hero__text">
              About two minutes. Twelve core questions plus an optional safety question when scores suggest it — same
              structure as the public landing page.
            </p>
            <div className="dash-hero__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => navigate('/dashboard/check-in')}
              >
                {stored ? 'Retake check-in' : 'Start check-in'}
              </button>
              {stored && !stored.safetyOverride ? (
                <span className="dash-hero__meta">
                  Last completed{' '}
                  {new Date(stored.completedAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              ) : null}
            </div>
          </div>
          {zoneMeta && !stored?.safetyOverride ? (
            <aside className="dash-zone-pill" style={zoneStyle} aria-label="Your last support zone">
              <p className="dash-zone-pill__label">{zoneMeta.name}</p>
              <p className="dash-zone-pill__title">{zoneMeta.label}</p>
              <p className="dash-zone-pill__score">Score {stored?.totalRisk} / 48</p>
            </aside>
          ) : stored?.safetyOverride ? (
            <aside className="dash-zone-pill dash-zone-pill--alert" aria-label="Support">
              <p className="dash-zone-pill__label">Support</p>
              <p className="dash-zone-pill__title">Human help first</p>
              <button
                type="button"
                className="dash-zone-pill__link"
                onClick={() => navigate('/dashboard/safety')}
              >
                View support resources →
              </button>
            </aside>
          ) : null}
        </div>

        <p className="dash-recommendation">{recommendationForZone(stored?.safetyOverride ? 'red' : stored?.zoneId ?? null)}</p>

        <div className="dash-stats" aria-label="Progress placeholders">
          <div className="dash-stat">
            <span className="dash-stat__value">0</span>
            <span className="dash-stat__label">XP (lessons coming)</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat__value">0</span>
            <span className="dash-stat__label">Day streak</span>
          </div>
        </div>

        <h2 className="dash-section-title">Learning tracks</h2>
        <p className="dash-section-lede">Five micro-lessons each — content matches your zone tone when the lesson player ships.</p>
        <div className="dash-tracks">
          {TRACKS.map((t) => (
            <article key={t.slug} className="dash-track-card">
              <h3 className="dash-track-card__title">{t.title}</h3>
              <p className="dash-track-card__text">{t.blurb}</p>
              <p className="dash-track-card__meta">{t.lessons} micro-lessons</p>
              <span className="dash-track-card__soon">Coming soon</span>
            </article>
          ))}
        </div>

        <section className="dash-resources" aria-labelledby="dash-res-title">
          <h2 id="dash-res-title" className="dash-section-title">
            Trusted references (green zone)
          </h2>
          <ul className="dash-resource-list">
            {RESOURCES.map((r) => (
              <li key={r.href}>
                <a href={r.href} target="_blank" rel="noreferrer">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <aside className="dash-disclaimer" role="note">
          <p>
            <strong>This is a self-check for emotional wellbeing, not a diagnosis.</strong> It does not replace care from
            a qualified professional. If you are in crisis, use local emergency services or a crisis line.
          </p>
        </aside>
      </section>
    </main>
  )
}
