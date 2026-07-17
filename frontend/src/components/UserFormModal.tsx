import * as React from 'react'
import { X } from 'lucide-react'
import type { ManagedUser, Role } from '../lib/api'

interface Props {
  initial: ManagedUser
  onClose: () => void
  onSubmit: (payload: { full_name: string; email: string; role: Role }) => Promise<void>
}

export default function UserFormModal({ initial, onClose, onSubmit }: Props) {
  const [fullName, setFullName] = React.useState(initial.full_name)
  const [email, setEmail] = React.useState(initial.email)
  const [role, setRole] = React.useState<Role>(initial.role)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fullName.trim() || !email.trim()) {
      setError('Nama dan email wajib diisi.')
      return
    }
    setSaving(true)
    try {
      await onSubmit({ full_name: fullName.trim(), email: email.trim(), role })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan akun.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Ubah Akun</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Nama Lengkap
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            >
              <option value="admin">Admin</option>
              <option value="petugas">Petugas</option>
            </select>
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
