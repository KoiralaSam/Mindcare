import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'g7:user-email'

type AuthContextValue = {
  email: string | null
  signIn: (email: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredEmail(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(readStoredEmail)

  const signIn = useCallback((next: string) => {
    sessionStorage.setItem(STORAGE_KEY, next)
    setEmail(next)
  }, [])

  const signOut = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setEmail(null)
  }, [])

  const value = useMemo(
    () => ({ email, signIn, signOut }),
    [email, signIn, signOut],
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
