/* eslint-disable react-refresh/only-export-components -- context + hook pattern */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { readRegistry, registerUser, verifyCredentials } from './registry'
import type { SignUpPayload, UserProfile } from './types'

const SESSION_KEY = 'g7:session'
const LEGACY_EMAIL_KEY = 'g7:user-email'

type Session = {
  email: string
  profile: UserProfile | null
}

type AuthContextValue = {
  email: string | null
  profile: UserProfile | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (payload: SignUpPayload) => Promise<string | null>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const s = JSON.parse(raw) as Session
      if (s && typeof s.email === 'string') {
        return { email: s.email, profile: s.profile ?? null }
      }
    }
    const legacy = sessionStorage.getItem(LEGACY_EMAIL_KEY)
    if (legacy) {
      const migrated: Session = { email: legacy, profile: null }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(migrated))
      sessionStorage.removeItem(LEGACY_EMAIL_KEY)
      return migrated
    }
  } catch {
    /* ignore */
  }
  return null
}

function writeSession(session: Session | null) {
  if (!session) {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(LEGACY_EMAIL_KEY)
    return
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readSession()
  const [email, setEmail] = useState<string | null>(initial?.email ?? null)
  const [profile, setProfile] = useState<UserProfile | null>(initial?.profile ?? null)

  const signIn = useCallback(async (nextEmail: string, password: string) => {
    const result = await verifyCredentials(nextEmail, password)
    if (!result.ok) {
      return 'Invalid email or password.'
    }
    const key = nextEmail.trim().toLowerCase()
    const session: Session = { email: key, profile: result.profile }
    writeSession(session)
    setEmail(key)
    setProfile(result.profile)
    return null
  }, [])

  const signUp = useCallback(async (payload: SignUpPayload) => {
    const err = await registerUser(payload)
    if (err) return err
    const key = payload.email.trim().toLowerCase()
    const registry = readRegistry()
    const row = registry[key]
    if (!row) return 'Registration failed. Try again.'
    const session: Session = { email: key, profile: row.profile }
    writeSession(session)
    setEmail(key)
    setProfile(row.profile)
    return null
  }, [])

  const signOut = useCallback(() => {
    writeSession(null)
    setEmail(null)
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({ email, profile, signIn, signUp, signOut }),
    [email, profile, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
