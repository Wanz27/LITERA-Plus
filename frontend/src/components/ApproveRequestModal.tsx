import * as React from 'react'
import { CalendarClock, Loader2 } from 'lucide-react'

const DEFAULT_LOAN_DAYS = 7

function defaultDueDateInput() {
  const d = new Date()
  d.setDate(d.getDate() + DEFAULT_LOAN_DAYS)
  return d.toISOString().slice(0, 10)
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

interface Props {
  bookTitle: string
  borrowerName: string
  loading?: boolean
  onCancel: () => void
  onConfirm: (dueDate: string) => void
}

export default function ApproveRequestModal({ bookTitle, borrowerName, loading = false, onCancel, onConfirm }: Props) {
  const [dueDate, setDueDate] = React.useState(defaultDueDateInput())

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(dueDate)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-900">Setujui Peminjaman</h3>
        <p className="mt-1.5 text-sm text-slate-500">
          Tentukan batas waktu pengembalian untuk "{bookTitle}" yang diajukan oleh {borrowerName}.
        </p>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Batas Waktu Pengembalian</label>
          <div className="relative">
            <CalendarClock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={todayInput()}
              required
              autoFocus
              className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-sky-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Setujui & Pinjamkan
          </button>
        </div>
      </form>
    </div>
  )
}
