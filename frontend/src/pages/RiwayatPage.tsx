import * as React from 'react'
import DashboardLayout from '../layout/DashboardLayout'
import * as api from '../lib/api'
import type { ActivityLog, Library } from '../lib/api'
import {
  RIWAYAT_PERIOD_FILTERS,
  isWithinPeriod,
  formatDateTime,
  activityMeta,
  initials,
  belongsToLibrary,
  type RiwayatPeriod,
  type RiwayatSort,
} from '../lib/riwayatUi'

export default function RiwayatPage() {
  const [logs, setLogs] = React.useState<ActivityLog[]>([])
  const [libraries, setLibraries] = React.useState<Library[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [riwayatPeriod, setRiwayatPeriod] = React.useState<RiwayatPeriod>('Semua')
  const [riwayatAksiFilter, setRiwayatAksiFilter] = React.useState('Semua')
  const [riwayatSort, setRiwayatSort] = React.useState<RiwayatSort>('terbaru')
  const [riwayatLibraryFilter, setRiwayatLibraryFilter] = React.useState('Semua')

  React.useEffect(() => {
    Promise.all([api.getActivityLog(), api.getLibraries()])
      .then(([activityLogs, libs]) => {
        setLogs(activityLogs)
        setLibraries(libs)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat riwayat.'))
      .finally(() => setLoading(false))
  }, [])

  const scopedLogs =
    riwayatLibraryFilter === 'Semua'
      ? logs
      : logs.filter((log) => {
          const library = libraries.find((lib) => lib.id === riwayatLibraryFilter)
          return library ? belongsToLibrary(log, library.nama) : false
        })

  const riwayatAksiChoices = Array.from(new Set(scopedLogs.map((log) => log.aksi))).sort()
  const riwayatFiltered = scopedLogs
    .filter((log) => riwayatAksiFilter === 'Semua' || log.aksi === riwayatAksiFilter)
    .filter((log) => riwayatPeriod === 'Semua' || isWithinPeriod(log.created_at, riwayatPeriod))
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return riwayatSort === 'terbaru' ? -diff : diff
    })

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-[28px]">Riwayat Aktivitas</h1>
          <p className="text-slate-500">Pantau perubahan data perpustakaan dari waktu ke waktu.</p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {RIWAYAT_PERIOD_FILTERS.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setRiwayatPeriod(period)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    riwayatPeriod === period
                      ? 'bg-sky-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={riwayatLibraryFilter}
                onChange={(e) => {
                  setRiwayatLibraryFilter(e.target.value)
                  setRiwayatAksiFilter('Semua')
                }}
                aria-label="Filter perpustakaan"
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-600 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              >
                <option value="Semua">Semua Perpustakaan</option>
                {libraries.map((lib) => (
                  <option key={lib.id} value={lib.id}>
                    {lib.nama}
                  </option>
                ))}
              </select>
              <select
                value={riwayatAksiFilter}
                onChange={(e) => setRiwayatAksiFilter(e.target.value)}
                aria-label="Filter jenis aktivitas"
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-600 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              >
                <option value="Semua">Semua Aktivitas</option>
                {riwayatAksiChoices.map((aksi) => (
                  <option key={aksi} value={aksi}>
                    {aksi}
                  </option>
                ))}
              </select>
              <select
                value={riwayatSort}
                onChange={(e) => setRiwayatSort(e.target.value as RiwayatSort)}
                aria-label="Urutkan riwayat"
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-600 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              >
                <option value="terbaru">Terbaru Dahulu</option>
                <option value="terlama">Terlama Dahulu</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading && <p className="px-6 py-10 text-center text-sm text-slate-400">Memuat riwayat...</p>}
            {!loading && error && <p className="px-6 py-10 text-center text-sm text-rose-600">{error}</p>}
            {!loading && !error && riwayatFiltered.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">
                {scopedLogs.length === 0 ? 'Belum ada aktivitas tercatat.' : 'Tidak ada aktivitas yang cocok dengan filter ini.'}
              </p>
            )}

            {!loading && !error && riwayatFiltered.length > 0 && (
              <ul>
                {riwayatFiltered.map((log) => {
                  const meta = activityMeta(log.aksi)
                  const Icon = meta.icon
                  return (
                    <li key={log.id} className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0">
                      <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.badge}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{log.aksi}</p>
                        <p className="text-sm text-slate-500">{log.detail}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                            {initials(log.pelaku)}
                          </span>
                          {log.pelaku} · {formatDateTime(log.created_at)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
