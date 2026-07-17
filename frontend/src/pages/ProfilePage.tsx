import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, IdCard, ShieldCheck, LogOut, Pencil, KeyRound, User as UserIcon } from 'lucide-react'
import DashboardLayout from '../layout/DashboardLayout'
import EditProfileModal from '../components/EditProfileModal'
import ChangePasswordModal from '../components/ChangePasswordModal'
import { useAuth } from '../contexts/AuthContext'
import * as api from '../lib/api'
import type { AuthUser } from '../lib/api'

const roleLabel: Record<AuthUser['role'], string> = {
  admin: 'Super Administrator',
  petugas: 'Petugas Perpustakaan',
  visitor: 'Visitor',
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut, updateProfile, changePassword } = useAuth()
  const [profile, setProfile] = React.useState<AuthUser | null>(user)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [passwordOpen, setPasswordOpen] = React.useState(false)

  React.useEffect(() => {
    api
      .getMe()
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat profil.'))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    if (user) setProfile(user)
  }, [user])

  const handleLogout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  async function handleUpdateProfile(payload: { full_name: string; email: string }) {
    const { error: err } = await updateProfile(payload)
    if (err) throw new Error(err)
    setEditOpen(false)
  }

  async function handleChangePassword(payload: { current_password: string; new_password: string }) {
    const { error: err } = await changePassword(payload)
    if (err) throw new Error(err)
    setPasswordOpen(false)
  }

  if (loading && !profile) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-sm text-slate-400">Memuat profil...</div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
          <p className="text-sm text-rose-600">{error || 'Data profil tidak ditemukan.'}</p>
        </div>
      </DashboardLayout>
    )
  }

  const fields = [
    { label: 'Nama Lengkap', value: profile.full_name, icon: UserIcon },
    { label: 'Alamat Email', value: profile.email, icon: Mail },
    { label: 'Peran', value: roleLabel[profile.role], icon: ShieldCheck },
    { label: 'ID Pengguna', value: profile.user_id, icon: IdCard },
  ]

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-[28px]">Profil Saya</h1>
          <p className="text-slate-500">Informasi akun yang digunakan untuk masuk ke LITERA+.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-8 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} alt="avatar" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{profile.full_name}</p>
                <p className="text-sm text-slate-500">{profile.email}</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
                  {roleLabel[profile.role]}
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Pencil size={16} /> Edit Profil
            </button>
          </div>

          <div>
            {fields.map((field) => (
              <div key={field.label} className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-800">
                  <field.icon size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{field.label}</p>
                  <p className="text-sm font-medium text-slate-800">{field.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-6 py-4">
            <button
              onClick={() => setPasswordOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <KeyRound size={16} /> Ubah Password
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              <LogOut size={16} /> Keluar dari Akun
            </button>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditProfileModal initial={profile} onClose={() => setEditOpen(false)} onSubmit={handleUpdateProfile} />
      )}

      {passwordOpen && (
        <ChangePasswordModal onClose={() => setPasswordOpen(false)} onSubmit={handleChangePassword} />
      )}
    </DashboardLayout>
  )
}
