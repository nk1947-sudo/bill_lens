import { createContext, useContext, useState, useCallback } from 'react'
import { acceptDisclaimer as apiAcceptDisclaimer } from '../api/auth'

const AuthContext = createContext(null)

const loadUser = () => {
  try {
    return JSON.parse(localStorage.getItem('mb_user'))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)
  const [token, setToken] = useState(() => localStorage.getItem('mb_token'))

  const saveSession = useCallback((tokenVal, userData) => {
    localStorage.setItem('mb_token', tokenVal)
    localStorage.setItem('mb_user', JSON.stringify(userData))
    setToken(tokenVal)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('mb_token')
    localStorage.removeItem('mb_user')
    setToken(null)
    setUser(null)
  }, [])

  const acceptDisclaimer = useCallback(async () => {
    await apiAcceptDisclaimer()
    const updated = { ...user, disclaimer_accepted: true }
    localStorage.setItem('mb_user', JSON.stringify(updated))
    setUser(updated)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, token, saveSession, logout, acceptDisclaimer, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
