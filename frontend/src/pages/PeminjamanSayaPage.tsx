import * as React from 'react'
import { BookOpen, Inbox } from 'lucide-react'
import DashboardLayout from '../layout/DashboardLayout'
import * as api from '../lib/api'
import type { MyCirculation } from '../lib/api'

// Selisih dihitung berbasis tanggal (bukan jam) supaya "hari ini" tidak dianggap terlambat
// hanya karena jam saat ini sudah lewat dari jam saat buku dipinjamkan.
function daysUntil(dueDate: string) {
  const due = new Date(dueDate)
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const now = new Date()
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((dueMidnight.getTime() - nowMidnight.getTime()) / 86400000)
}

function loanTimeStatus(dueDate: string | null): { label: string; className: string } {
  if (!dueDate) return { label: 'Tanpa batas waktu', className: 'bg-slate-100 text-slate-500' }
  const diff = daysUntil(dueDate)
  if (diff < 0) return { label: `Terlambat ${Math.abs(diff)} hari`, className: 'bg-rose-100 text-rose-700' }
  if (diff === 0) return { label: 'Jatuh tempo hari ini', className: 'bg-amber-100 text-amber-700' }
  if (diff <= 2) return { label: `${diff} hari lagi`, className: 'bg-amber-100 text-amber-700' }
  return { label: `${diff} hari lagi`, className: 'bg-emerald-100 text-emerald-700' }
}

export default function PeminjamanSayaPage() {
  const [circulations, setCirculations] = React.useState<MyCirculation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        setCirculations(await api.getMyCirculations())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data peminjaman.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pending = circulations.filter((c) => c.status === 'menunggu')
  const active = circulations.filter((c) => c.status === 'dipinjam')

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-[28px]">Peminjaman</h1>
          <p className="text-slate-500">Daftar buku yang sedang Anda pinjam beserta status pengajuannya.</p>
        </div>

        {!loading && !error && pending.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-4">
              <Inbox size={18} className="text-amber-600" />
              <div>
                <h3 className="font-bold text-slate-900">Menunggu Persetujuan ({pending.length})</h3>
                <p className="text-xs text-slate-500">Pengajuan peminjaman mandiri Anda, menunggu persetujuan petugas</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Judul Buku</th>
                    <th className="px-6 py-3">Perpustakaan</th>
                    <th className="px-6 py-3">Tanggal Pengajuan</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-medium text-slate-800">{c.books?.judul ?? '-'}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{c.libraries?.nama ?? '-'}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {new Date(c.borrow_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="font-bold text-slate-900">Sedang Dipinjam ({active.length})</h3>
            <p className="text-xs text-slate-400">Buku yang sedang Anda pinjam dan belum dikembalikan</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Judul Buku</th>
                  <th className="px-6 py-3">Perpustakaan</th>
                  <th className="px-6 py-3">Tanggal Pinjam</th>
                  <th className="px-6 py-3">Batas Waktu</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-rose-600">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && active.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen size={28} className="text-slate-300" />
                        Anda belum meminjam buku apa pun.
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  active.map((c) => {
                    const status = loanTimeStatus(c.due_date)
                    return (
                      <tr key={c.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {c.books?.cover_url ? (
                              <img
                                src={c.books.cover_url}
                                alt={c.books.judul}
                                className="h-12 w-9 shrink-0 rounded object-cover shadow-sm"
                              />
                            ) : (
                              <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
                                <BookOpen size={16} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-800">{c.books?.judul ?? '-'}</p>
                              <p className="truncate text-xs text-slate-500">{c.books?.penulis ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">{c.libraries?.nama ?? '-'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {new Date(c.borrow_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {c.due_date ? new Date(c.due_date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
