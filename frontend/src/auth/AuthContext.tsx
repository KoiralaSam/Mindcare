/* eslint-disable react-refresh/only-export-components -- context + hook pattern */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { postLogin } from '../api/login'
import type { BackendUser } from './types'

const SESSION_KEY = 'g7:session:v2'

export type Session = {
  email: string
  user: BackendUser
  wellnessCompleted: boolean
}

type AuthContextValue = {
  email: string | null
  user: BackendUser | null
  wellnessCompleted: boolean
  /** Same route for sign-in (email only) and sign-up (email + age + gender). */
  loginWithAPI: (body: { email: string; age?: number; gender?: string }) => Promise<string | null>
  /** Merge fields into the signed-in user (e.g. daily_ember after wellness quiz). */
  patchUser: (partial: Partial<BackendUser>) => void
  completeWellness: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    if (!s || typeof s.email !== 'string' || !s.user || typeof s.user.email !== 'string') {
      return null
    }
    return {
      email: s.email,
      user: s.user,
      wellnessCompleted: Boolean(s.wellnessCompleted),
    }
  } catch {
    return null
  }
}

function writeSession(session: Session | null) {
  if (!session) {
    sessionStorage.removeItem(SESSION_KEY)
    return
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readSession()
  const [email, setEmail] = useState<string | null>(initial?.email ?? null)
  const [user, setUser] = useState<BackendUser | null>(initial?.user ?? null)
  const [wellnessCompleted, setWellnessCompleted] = useState<boolean>(initial?.wellnessCompleted ?? false)

  const loginWithAPI = useCallback(async (body: { email: string; age?: number; gender?: string }) => {
    const result = await postLogin({
      email: body.email.trim().toLowerCase(),
      ...(body.age !== undefined ? { age: body.age } : {}),
      ...(body.gender !== undefined && body.gender !== '' ? { gender: body.gender } : {}),
    })
    if (!result.ok) {
      return result.error
    }
    const key = result.data.user.email.trim().toLowerCase()
    const session: Session = {
      email: key,
      user: result.data.user,
      wellnessCompleted: false,
    }
    writeSession(session)
    setEmail(key)
    setUser(result.data.user)
    setWellnessCompleted(false)
    return null
  }, [])

  const patchUser = useCallback((partial: Partial<BackendUser>) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...partial }
      try {
        const raw = sessionStorage.getItem(SESSION_KEY)
        if (!raw) return next
        const s = JSON.parse(raw) as Session
        if (s?.email && s?.user?.email) {
          writeSession({ ...s, user: next })
        }
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const completeWellness = useCallback(() => {
    setWellnessCompleted(true)
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (!raw) return
      const s = JSON.parse(raw) as Session
      if (s?.email && s?.user?.email) {
        writeSession({ ...s, wellnessCompleted: true })
      }
    } catch {
      /* ignore */
    }
  }, [])

  const signOut = useCallback(() => {
    writeSession(null)
    setEmail(null)
    setUser(null)
    setWellnessCompleted(false)
  }, [])

  const value = useMemo(
    () => ({
      email,
      user,
      wellnessCompleted,
      loginWithAPI,
      patchUser,
      completeWellness,
      signOut,
    }),
    [email, user, wellnessCompleted, loginWithAPI, patchUser, completeWellness, signOut],
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
