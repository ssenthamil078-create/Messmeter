import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, getToken, setToken, setUnauthorizedHandler } from '../api/client'
import { AuthContext } from './authContext'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // If a token is stored we must ask the server who it belongs to before deciding what to render.
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!getToken()) return
    apiGet('/api/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [logout])

  const login = useCallback(async (email, password) => {
    const data = await apiPost('/api/auth/login', { email, password })
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
