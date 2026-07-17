import * as React from 'react'
import { Navigate } from 'react-router-dom'
import { KeyRound, Pencil, Trash2, Users } from 'lucide-react'
import DashboardLayout from '../layout/DashboardLayout'
import UserFormModal from '../components/UserFormModal'
import ResetPasswordModal from '../components/ResetPasswordModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuth } from '../contexts/AuthContext'
import * as api from '../lib/api'
import type { ManagedUser, Role } from '../lib/api'

export default function UserManagementPage() {
  const { user, role } = useAuth()
  const [users, setUsers] = React.useState<ManagedUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editingUser, setEditingUser] = React.useState<ManagedUser | null>(null)
  const [passwordUser, setPasswordUser] = React.useState<ManagedUser | null>(null)
  const [userToDelete, setUserToDelete] = React.useState<ManagedUser | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setUsers(await api.getUsers())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data akun.')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (role === 'admin') load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  if (role !== 'admin') {
    return <Navigate to={role === 'visitor' ? '/katalog' : '/dashboard'} replace />
  }

  async function handleUpdateUser(payload: { full_name: string; email: string; role: Role }) {
    if (!editingUser) return
    await api.updateUser(editingUser.user_id, payload)
    setEditingUser(null)
    await load()
  }

  async function handleResetPassword(newPassword: string) {
    if (!passwordUser) return
    await api.resetUserPassword(passwordUser.user_id, newPassword)
    setPasswordUser(null)
  }

  async function handleDeleteUser() {
    if (!userToDelete) return
    setDeleting(true)
    setActionError(null)
    try {
      await api.deleteUser(userToDelete.user_id)
      setUserToDelete(null)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus akun.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-[28px]">Manajemen Akun</h1>
          <p className="text-slate-500">Kelola akun admin dan petugas yang terdaftar di LITERA+.</p>
        </div>

        {actionError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
            {actionError}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading && <p className="px-6 py-10 text-center text-sm text-slate-400">Memuat data akun...</p>}
          {!loading && error && <p className="px-6 py-10 text-center text-sm text-rose-600">{error}</p>}

          {!loading && !error && users.length === 0 && (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-sky-100 text-sky-800">
                <Users size={22} />
              </div>
              <p className="font-semibold text-slate-800">Belum ada akun terdaftar.</p>
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Nama</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Tanggal Daftar</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.user_id === user?.user_id
                    return (
                      <tr key={u.user_id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-6 py-3 text-sm font-medium text-slate-800">
                          {u.full_name}
                          {isSelf && <span className="ml-2 text-xs font-semibold text-sky-700">(Anda)</span>}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">{u.email}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              u.role === 'admin'
                                ? 'bg-violet-100 text-violet-700'
                                : u.role === 'petugas'
                                  ? 'bg-sky-100 text-sky-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {u.role === 'admin' ? 'Admin' : u.role === 'petugas' ? 'Petugas' : 'Visitor'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {new Date(u.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="text-slate-400 hover:text-sky-700"
                              aria-label={`Ubah akun ${u.full_name}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setPasswordUser(u)}
                              className="text-slate-400 hover:text-sky-700"
                              aria-label={`Ubah password ${u.full_name}`}
                            >
                              <KeyRound size={16} />
                            </button>
                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={isSelf}
                              className="text-slate-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={`Hapus akun ${u.full_name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <UserFormModal
          initial={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdateUser}
        />
      )}

      {passwordUser && (
        <ResetPasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onSubmit={handleResetPassword}
        />
      )}

      {userToDelete && (
        <ConfirmDialog
          title="Hapus akun ini?"
          message={`Akun "${userToDelete.full_name}" (${userToDelete.email}) akan dihapus permanen.`}
          confirmLabel="Ya, Hapus"
          loading={deleting}
          onConfirm={handleDeleteUser}
          onCancel={() => setUserToDelete(null)}
        />
      )}
    </DashboardLayout>
  )
}
