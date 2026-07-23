import * as React from 'react'
import * as api from '../lib/api'
import type { AuthUser } from '../lib/api'

interface AuthContextValue {
  user: AuthUser | null
  role: AuthUser['role'] | null
  fullName: string | null
  isAuthenticated: boolean
  authError: string | null
  signIn: (identifier: string, password: string) => Promise<{ error?: string }>
  signUp: (payload: { full_name: string; email: string; password: string }) => Promise<{ error?: string }>
  signOut: () => void
  updateProfile: (payload: { full_name: string; email: string }) => Promise<{ error?: string }>
  changePassword: (payload: { current_password: string; new_password: string }) => Promise<{ error?: string }>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'litera_token'
const USER_KEY = 'litera_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  })
  const [authError, setAuthError] = React.useState<string | null>(null)

  const persist = (token: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  React.useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return

    api
      .getMe()
      .then((freshUser) => {
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser))
        setUser(freshUser)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn: AuthContextValue['signIn'] = async (identifier, password) => {
    setAuthError(null)
    try {
      const { token, user: nextUser } = await api.login(identifier, password)
      persist(token, nextUser)
      return {}
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal masuk. Coba lagi.'
      setAuthError(message)
      return { error: message }
    }
  }

  const signUp: AuthContextValue['signUp'] = async (payload) => {
    setAuthError(null)
    try {
      const { token, user: nextUser } = await api.register(payload)
      persist(token, nextUser)
      return {}
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mendaftar. Coba lagi.'
      setAuthError(message)
      return { error: message }
    }
  }

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const updateProfile: AuthContextValue['updateProfile'] = async (payload) => {
    try {
      const { token, user: nextUser } = await api.updateProfile(payload)
      persist(token, nextUser)
      return {}
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui profil.'
      return { error: message }
    }
  }

  const changePassword: AuthContextValue['changePassword'] = async (payload) => {
    try {
      await api.changePassword(payload)
      return {}
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah password.'
      return { error: message }
    }
  }

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    fullName: user?.full_name ?? null,
    isAuthenticated: !!user,
    authError,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
