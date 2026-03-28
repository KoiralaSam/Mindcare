import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ThemeToggle } from '../components/landing/ThemeToggle'

function safeRedirectPath(from: unknown): string | null {
  if (typeof from !== 'string' || !from.startsWith('/')) return null
  if (from.startsWith('//')) return null
  return from
}

export function LoginPage() {
  const { email, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = safeRedirectPath((location.state as { from?: string } | null)?.from)
  const [value, setValue] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (email) {
      navigate(redirectTo ?? '/dashboard', { replace: true })
    }
  }, [email, navigate, redirectTo])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = value.trim().toLowerCase()
    const emailInput = document.getElementById('login-email') as HTMLInputElement | null
    if (!trimmed || !emailInput?.checkValidity()) {
      setError('Enter a valid email address.')
      return
    }
    if (!password) {
      setError('Enter your password.')
      return
    }
    setPending(true)
    const err = await signIn(trimmed, password)
    setPending(false)
    if (err) {
      setError(err)
      return
    }
    navigate(redirectTo ?? '/dashboard', { replace: true })
  }

  return (
    <main className="shell shell--auth">
      <section className="panel panel--login" aria-labelledby="login-title">
        <div className="auth__top">
          <Link to="/" className="auth__home">
            ← NLN Mindcare
          </Link>
          <ThemeToggle />
        </div>

        <nav className="auth__tabs" aria-label="Account">
          <span className="auth__tab auth__tab--active" aria-current="page">
            Sign in
          </span>
          <Link to="/register" className="auth__tab">
            Create account
          </Link>
        </nav>

        <h1 id="login-title" className="title title--sm">
          Welcome back
        </h1>
        <p className="lede auth__lede">
          Sign in to continue your check-ins and lessons. This is a wellbeing companion — not a substitute for
          crisis lines, therapy, or medical diagnosis.
        </p>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="field__label">Email</span>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn--primary" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth__sub">
          New here?{' '}
          <Link to="/register" className="auth__link">
            Create an account
          </Link>{' '}
          — we’ll ask for consent, age band, and optional emergency contact so the experience matches a
          mental-health context.
        </p>

        <p className="auth__footer-note">
          Demo: session stays in this tab (<code>sessionStorage</code>). Accounts are stored in this browser (
          <code>localStorage</code>).
        </p>
      </section>
    </main>
  )
}
