import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

type Props = {
  children: ReactElement
  /** When true, user must have completed the post-login wellness step. */
  requireWellness?: boolean
}

export function ProtectedRoute({ children, requireWellness = false }: Props) {
  const { email, wellnessCompleted } = useAuth()
  const location = useLocation()

  if (!email) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireWellness && !wellnessCompleted) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
