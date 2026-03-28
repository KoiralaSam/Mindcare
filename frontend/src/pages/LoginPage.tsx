import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { email, signIn } = useAuth()
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (email) {
      navigate('/dashboard', { replace: true })
    }
  }, [email, navigate])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = value.trim().toLowerCase()
    const input = document.getElementById('login-email') as HTMLInputElement | null
    if (!trimmed || !input?.checkValidity()) {
      setError('Enter a valid email address.')
      return
    }
    signIn(trimmed)
    navigate('/dashboard', { replace: true })
  }

  return (
    <main className="shell">
      <section className="panel panel--login" aria-labelledby="login-title">
        <p className="eyebrow">G7</p>
        <h1 id="login-title" className="title">
          Sign in with email
        </h1>
        <p className="lede">
          Demo only: your email is kept in <code>sessionStorage</code> for this tab until you sign
          out.
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
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn--primary">
            Continue
          </button>
        </form>
      </section>
    </main>
  )
}
