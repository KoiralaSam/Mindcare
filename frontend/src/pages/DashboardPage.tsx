import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function DashboardPage() {
  const { email, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="shell shell--wide">
      <section className="panel panel--dash" aria-labelledby="dash-title">
        <header className="dash-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 id="dash-title" className="title title--sm">
              Welcome back
            </h1>
            <p className="lede lede--compact">
              Signed in as <strong>{email}</strong>
            </p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
            Sign out
          </button>
        </header>

        <div className="dash-grid">
          <article className="card">
            <h2 className="card__title">Overview</h2>
            <p className="card__text">Main workspace — add widgets, tables, or metrics here.</p>
          </article>
          <article className="card">
            <h2 className="card__title">Activity</h2>
            <p className="card__text">Recent events and notifications can live in this panel.</p>
          </article>
          <article className="card card--wide">
            <h2 className="card__title">Backend</h2>
            <p className="card__text">
              Replace session-only auth with your API: magic links, OTP, or SSO, then store
              sessions in HTTP-only cookies or tokens.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
