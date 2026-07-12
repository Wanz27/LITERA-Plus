import * as React from 'react'
import { Clock } from 'lucide-react'
import DashboardLayout from '../layout/DashboardLayout'
import * as api from '../lib/api'
import type { ActivityLog } from '../lib/api'

export default function RiwayatPage() {
  const [logs, setLogs] = React.useState<ActivityLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    api
      .getActivityLog()
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat riwayat.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-[28px]">Riwayat Aktivitas</h1>
          <p className="text-slate-500">Pantau perubahan data perpustakaan dari waktu ke waktu.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading && <p className="px-6 py-10 text-center text-sm text-slate-400">Memuat riwayat...</p>}
          {!loading && error && <p className="px-6 py-10 text-center text-sm text-rose-600">{error}</p>}
          {!loading && !error && logs.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-slate-400">Belum ada aktivitas tercatat.</p>
          )}

          {!loading && !error && logs.length > 0 && (
            <ul>
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0">
                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-800">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{log.aksi}</p>
                    <p className="text-sm text-slate-500">{log.detail}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {log.pelaku} · {new Date(log.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
