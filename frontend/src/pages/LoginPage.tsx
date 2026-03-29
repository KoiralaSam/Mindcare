import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FlowShell } from '../components/flow/FlowShell'
import { NlnCheckInFlow } from '../components/flow/NlnCheckInFlow'

function safeRedirectPath(from: unknown): string | null {
  if (typeof from !== 'string' || !from.startsWith('/')) return null
  if (from.startsWith('//')) return null
  return from
}

export function LoginPage() {
  const { email, wellnessCompleted, loginWithAPI } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = safeRedirectPath((location.state as { from?: string } | null)?.from)
  const showCheckIn = Boolean(email && !wellnessCompleted)

  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (email && wellnessCompleted) {
      navigate(redirectTo ?? '/dashboard', { replace: true })
    }
  }, [email, wellnessCompleted, navigate, redirectTo])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = value.trim().toLowerCase()
    const emailInput = document.getElementById('login-email') as HTMLInputElement | null
    if (!trimmed || !emailInput?.checkValidity()) {
      setError('Enter a valid email address.')
      return
    }
    setPending(true)
    const err = await loginWithAPI({ email: trimmed })
    setPending(false)
    if (err) {
      setError(err)
      return
    }
  }

  const nextAfterCheckIn = redirectTo ?? '/dashboard'

  return (
    <main className="flow-shell__main">
      <FlowShell title="Mindcare" backTo="/" backLabel="Back to home">
        {showCheckIn ? (
          <NlnCheckInFlow
            onComplete={() => {
              navigate('/welcome/summary', { replace: true, state: { next: nextAfterCheckIn } })
            }}
          />
        ) : (
          <div className="flow-step">
            <nav className="flow-tabs" aria-label="Account">
              <span className="flow-tabs__item flow-tabs__item--active">Sign in</span>
              <Link to="/register" className="flow-tabs__item">
                Create account
              </Link>
            </nav>

            <h1 className="flow-step__title flow-step__title--tight">Sign in</h1>
            <p className="flow-step__lede flow-step__lede--tight">
              Enter your email — then you&apos;ll complete the Mindcare check-in.
            </p>

            <form className="flow-form flow-form--light" onSubmit={handleSubmit} noValidate>
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
              {error ? (
                <p className="error" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" className="btn flow-btn-continue" disabled={pending}>
                {pending ? 'Signing in…' : 'Continue'}
              </button>
            </form>

            <p className="flow-footnote">
              New here?{' '}
              <Link to="/register" className="flow-link">
                Create an account
              </Link>
            </p>
          </div>
        )}
      </FlowShell>
    </main>
  )
}
