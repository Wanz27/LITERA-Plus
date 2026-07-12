import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookMarked, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import * as api from '../lib/api'

type FieldKey = 'fullName' | 'email' | 'password' | 'confirmPassword'
type FormState = Record<FieldKey, string>
type TouchedState = Record<FieldKey, boolean>
type FormErrors = Partial<Record<FieldKey, string>>

const initialState: FormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function hasSpecialChar(value: string) {
  return /[^A-Za-z0-9]/.test(value)
}

function validate(values: FormState, emailExists: boolean): FormErrors {
  const errors: FormErrors = {}

  if (!values.fullName.trim()) errors.fullName = 'Nama lengkap wajib diisi.'

  if (!values.email.trim()) errors.email = 'Email wajib diisi.'
  else if (!isEmail(values.email)) errors.email = 'Masukkan email yang valid.'
  else if (emailExists) errors.email = 'Email sudah terdaftar.'

  if (!values.password) errors.password = 'Password wajib diisi.'
  else if (values.password.length < 8) errors.password = 'Minimal 8 karakter.'
  else if (!hasSpecialChar(values.password)) errors.password = 'Tambahkan 1 karakter spesial (contoh: !@#).'

  if (!values.confirmPassword) errors.confirmPassword = 'Konfirmasi password wajib diisi.'
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Password tidak sama.'

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

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, isAuthenticated } = useAuth()

  const [values, setValues] = React.useState<FormState>(initialState)
  const [touched, setTouched] = React.useState<TouchedState>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })
  const [submitted, setSubmitted] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [apiError, setApiError] = React.useState<string | null>(null)

  const [emailExists, setEmailExists] = React.useState(false)
  const [checkingEmail, setCheckingEmail] = React.useState(false)

  React.useEffect(() => {
    const email = values.email.trim()
    if (!isEmail(email)) {
      setEmailExists(false)
      setCheckingEmail(false)
      return
    }

    setCheckingEmail(true)
    const timeoutId = setTimeout(async () => {
      try {
        const { exists } = await api.checkEmail(email)
        setEmailExists(exists)
      } catch {
        setEmailExists(false)
      } finally {
        setCheckingEmail(false)
      }
    }, 600)

    return () => clearTimeout(timeoutId)
  }, [values.email])

  const errors = React.useMemo(() => validate(values, emailExists), [values, emailExists])
  const canSubmit = Object.keys(errors).length === 0

  function onBlur(key: FieldKey) {
    setTouched((t) => ({ ...t, [key]: true }))
  }

  function onChange(key: FieldKey, next: string) {
    setValues((v) => ({ ...v, [key]: next }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setApiError(null)
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true })

    if (!canSubmit || checkingEmail) return

    setLoading(true)
    const { error } = await signUp({
      full_name: values.fullName.trim(),
      email: values.email.trim(),
      password: values.password,
    })
    setLoading(false)
    if (error) setApiError(error)
  }

  React.useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen w-full">
        {/* LEFT: FORM */}
        <div className="flex w-full flex-col p-8 sm:p-12 lg:w-1/2 lg:p-16">
          <LogoMark />

          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-[400px]">
              <div className="mb-10">
                <h1 className="mb-2 text-4xl font-bold text-slate-900">Daftar</h1>
                <p className="text-sm text-slate-500">Buat akun untuk mengelola perpustakaan Anda</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Nama lengkap Anda"
                      value={values.fullName}
                      onChange={(e) => onChange('fullName', e.target.value)}
                      onBlur={() => onBlur('fullName')}
                      autoComplete="name"
                      required
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                    />
                  </div>
                  {touched.fullName && errors.fullName && (
                    <p className="mt-1.5 text-xs text-rose-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="nama@litera.id"
                      value={values.email}
                      onChange={(e) => onChange('email', e.target.value)}
                      onBlur={() => onBlur('email')}
                      autoComplete="email"
                      required
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                    />
                  </div>
                  {checkingEmail ? (
                    <p className="mt-1.5 text-xs text-slate-400">Mengecek ketersediaan...</p>
                  ) : (
                    (touched.email || values.email) && errors.email && (
                      <p className="mt-1.5 text-xs text-rose-600">{errors.email}</p>
                    )
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
                      autoComplete="new-password"
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
                  {values.password !== '' && errors.password ? (
                    <p className="mt-1.5 text-xs text-rose-600">{errors.password}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-400">Minimal 8 karakter dan 1 karakter spesial.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={values.confirmPassword}
                      onChange={(e) => onChange('confirmPassword', e.target.value)}
                      onBlur={() => onBlur('confirmPassword')}
                      autoComplete="new-password"
                      required
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-900 focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {values.confirmPassword !== '' && errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-rose-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {apiError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {apiError}
                  </div>
                )}

                {submitted && !canSubmit && !apiError && (
                  <div className="text-sm text-red-500">Periksa kembali input yang masih bermasalah.</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-800 font-bold text-white shadow-md transition-all hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? 'Memproses...' : <>Daftar <span className="text-lg">→</span></>}
                </button>

                <p className="pt-2 text-center text-sm text-slate-500">
                  Sudah punya akun?{' '}
                  <Link to="/login" className="font-bold text-sky-800 hover:underline">
                    Masuk
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
              Satu akun, seluruh perpustakaan Anda.
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-white/75">
              Daftar untuk mulai mencatat koleksi, memantau ketersediaan, dan
              melacak riwayat aktivitas perpustakaan desa & sekolah Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
