import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function ProtectedRoute() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const [isChecking, setIsChecking] = useState(() => !accessToken)
  const hasChecked = useRef(false)

  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true

    if (!accessToken) {
      refreshToken().finally(() => setIsChecking(false))
      return
    }
  }, [accessToken, refreshToken])

  if (isChecking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-serenify-charcoal/70">
        Loading your space...
      </div>
    )
  }

  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
