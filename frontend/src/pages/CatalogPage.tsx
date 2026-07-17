import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../layout/DashboardLayout'
import * as api from '../lib/api'
import type { Library } from '../lib/api'
import { typeIcon, StatusBadge } from '../lib/libraryUi'

const PAGE_SIZE = 4

export default function CatalogPage() {
  const navigate = useNavigate()
  const [libraries, setLibraries] = React.useState<Library[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        setLibraries(await api.getLibraries())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data perpustakaan.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalPages = Math.max(1, Math.ceil(libraries.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const currentRows = libraries.slice(start, start + PAGE_SIZE)

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-[28px]">Katalog Buku</h1>
          <p className="text-slate-500">Pilih perpustakaan untuk melihat koleksi bukunya.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-4 sm:px-6">Nama Perpustakaan</th>
                  <th className="hidden px-4 py-4 sm:table-cell sm:px-6">Lokasi</th>
                  <th className="px-4 py-4 sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-rose-600">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && currentRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-400">
                      Belum ada perpustakaan yang terdaftar.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  currentRows.map((item) => {
                    const Icon = typeIcon[item.tipe]
                    return (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/katalog/${item.id}`)}
                        className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-800">
                              <Icon size={18} />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800">{item.nama}</span>
                              <p className="text-xs text-slate-500 sm:hidden">{item.lokasi}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-4 text-slate-500 sm:table-cell sm:px-6">{item.lokasi}</td>
                        <td className="px-4 py-4 sm:px-6">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:px-6">
            <p className="text-sm text-slate-500">
              {libraries.length === 0
                ? 'Tidak ada data'
                : `Menampilkan ${start + 1}-${Math.min(start + PAGE_SIZE, libraries.length)} dari ${libraries.length} Perpustakaan`}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-semibold ${
                    n === page ? 'bg-sky-800 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
