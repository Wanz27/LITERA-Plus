import * as React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BookMarked, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type LoginKey = 'identifier' | 'password'
type LoginState = Record<LoginKey, string>
type TouchedState = Record<LoginKey, boolean>
type LoginErrors = Partial<Record<LoginKey, string>>

const initialState: LoginState = {
  identifier: '',
  password: '',
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function validate(values: LoginState): LoginErrors {
  const errors: LoginErrors = {}

  if (!values.identifier.trim()) {
    errors.identifier = 'Email wajib diisi.'
  } else if (!isEmail(values.identifier.trim())) {
    errors.identifier = 'Masukkan email yang valid.'
  }

  if (!values.password) errors.password = 'Password wajib diisi.'
  else if (values.password.length < 6) errors.password = 'Password terlalu pendek.'

  return errors
}

function LogoMark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-800 text-white shadow-sm">
        <BookMarked className="h-5 w-5" />
      </div>
      <span className="text-sm font-semibold uppercase tracking-wide text-slate-900">
        LITERA<span className="text-sky-800">+</span>
      </span>
    </Link>
  )
}

export default function LoginPage() {
  const [values, setValues] = React.useState<LoginState>(initialState)
  const [touched, setTouched] = React.useState<TouchedState>({
    identifier: false,
    password: false,
  })
  const [submitted, setSubmitted] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [apiError, setApiError] = React.useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isAuthenticated, authError, role } = useAuth()

  const errors = React.useMemo(() => validate(values), [values])
  const canSubmit = Object.keys(errors).length === 0
  const disabled = !values.identifier.trim() || !values.password

  function onBlur(key: LoginKey) {
    setTouched((t) => ({ ...t, [key]: true }))
  }

  function onChange(key: LoginKey, next: string) {
    setValues((v) => ({ ...v, [key]: next }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setApiError(null)
    setTouched({ identifier: true, password: true })

    if (!canSubmit) return

    setLoading(true)
    const { error } = await signIn(values.identifier.trim(), values.password)
    setLoading(false)
    if (error) setApiError(error)
  }

  React.useEffect(() => {
    if (!isAuthenticated) return
    const from = (location.state as { from?: string } | null)?.from
    const fallback = role === 'visitor' ? '/katalog' : '/dashboard'
    navigate(from && from.startsWith('/') ? from : fallback, { replace: true })
  }, [isAuthenticated, navigate, location.state, role])

  React.useEffect(() => {
    if (authError) setApiError(authError)
  }, [authError])

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen w-full">
        {/* LEFT: FORM */}
        <div className="flex w-full flex-col p-8 sm:p-12 lg:w-1/2 lg:p-16">
          <LogoMark />

          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-[400px]">
              <div className="mb-10">
                <h1 className="mb-2 text-4xl font-bold text-slate-900">Masuk</h1>
                <p className="text-sm text-slate-500">Sistem Inventaris Perpustakaan Digital</p>
                <p className="text-sm text-slate-500">Kelola koleksi & lokasi perpustakaan Anda</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label htmlFor="identifier" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="identifier"
                      type="text"
                      placeholder="nama@litera.id"
                      value={values.identifier}
                      onChange={(e) => onChange('identifier', e.target.value)}
                      onBlur={() => onBlur('identifier')}
                      autoComplete="username"
                      required
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                    />
                  </div>
                  {touched.identifier && errors.identifier && (
                    <p className="mt-1.5 text-xs text-rose-600">{errors.identifier}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={values.password}
                      onChange={(e) => onChange('password', e.target.value)}
                      onBlur={() => onBlur('password')}
                      autoComplete="current-password"
                      required
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-900 focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="mt-1.5 text-xs text-rose-600">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-sky-800"
                    />
                    Ingat saya
                  </label>
                  <button type="button" className="text-sm font-semibold text-sky-800 hover:underline">
                    Lupa Password?
                  </button>
                </div>

                {apiError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {apiError}
                  </div>
                )}

                {submitted && !canSubmit && !apiError && (
                  <div className="text-sm text-red-500">Email atau password tidak valid.</div>
                )}

                <button
                  type="submit"
                  disabled={disabled || loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-800 font-bold text-white shadow-md transition-all hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? 'Memproses...' : <>Masuk <span className="text-lg">→</span></>}
                </button>

                <p className="pt-2 text-center text-sm text-slate-500">
                  Belum punya akun?{' '}
                  <Link to="/register" className="font-bold text-sky-800 hover:underline">
                    Daftar
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT: HERO */}
        <div className="relative hidden w-1/2 items-center overflow-hidden bg-gradient-to-br from-sky-950 via-sky-900 to-blue-900 px-20 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)] opacity-20" />
          <div className="relative z-10">
            <h2 className="mb-6 text-5xl font-bold leading-tight text-white">
              Perpustakaan desa & sekolah, tertata rapi.
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-white/75">
              LITERA+ menyediakan sistem inventaris perpustakaan digital dengan
              pemantauan koleksi dan lokasi secara real-time untuk mendukung
              pengelolaan yang lebih efisien dan terstruktur.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
