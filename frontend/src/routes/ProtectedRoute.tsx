import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { email } = useAuth()
  const location = useLocation()

  if (!email) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
