import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User, AuthState } from '../types'
import { getMe } from './useApi'

interface AuthContextType extends AuthState {
  login:  (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, isAuthenticated: false,
  login: () => {}, logout: () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:            null,
    token:           localStorage.getItem('ml_token'),
    isAuthenticated: false
  })

  useEffect(() => {
    const token = localStorage.getItem('ml_token')
    if (token) {
      getMe()
        .then(user => setState({ user, token, isAuthenticated: true }))
        .catch(() => {
          localStorage.removeItem('ml_token')
          setState({ user: null, token: null, isAuthenticated: false })
        })
    }
  }, [])

  const login = (token: string, user: User) => {
    localStorage.setItem('ml_token', token)
    setState({ user, token, isAuthenticated: true })
  }

  const logout = () => {
    localStorage.removeItem('ml_token')
    setState({ user: null, token: null, isAuthenticated: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
