import * as React from 'react'
import * as api from '../lib/api'
import type { AuthUser } from '../lib/api'

interface AuthContextValue {
  user: AuthUser | null
  role: AuthUser['role'] | null
  fullName: string | null
  isAuthenticated: boolean
  authReady: boolean
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
  /**
   * True once the cached `user` (read synchronously from localStorage, which may hold a stale
   * role if it changed server-side since last login) has been confirmed or replaced by `getMe()`.
   * Route guards must wait for this before deciding on role, otherwise a stale cached role can
   * trigger a redirect (e.g. to /katalog) that never gets reversed once the fresh role arrives.
   */
  const [authReady, setAuthReady] = React.useState(() => !localStorage.getItem(TOKEN_KEY))

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
      .finally(() => setAuthReady(true))
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
    authReady,
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
