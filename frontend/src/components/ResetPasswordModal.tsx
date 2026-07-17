import * as React from 'react'
import { X } from 'lucide-react'
import type { ManagedUser } from '../lib/api'

interface Props {
  user: ManagedUser
  onClose: () => void
  onSubmit: (newPassword: string) => Promise<void>
}

export default function ResetPasswordModal({ user, onClose, onSubmit }: Props) {
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!newPassword || !confirmPassword) {
      setError('Semua kolom wajib diisi.')
      return
    }
    if (newPassword.length < 8 || !/[^A-Za-z0-9]/.test(newPassword)) {
      setError('Password baru minimal 8 karakter dan mengandung 1 karakter spesial.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.')
      return
    }
    setSaving(true)
    try {
      await onSubmit(newPassword)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Ubah Password Akun</h3>
            <p className="mt-0.5 text-sm text-slate-500">{user.full_name} ({user.email})</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Password Baru
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
            <p className="mt-1 text-xs text-slate-400">Minimal 8 karakter dan mengandung 1 karakter spesial.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-900 disabled:bg-slate-300"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
