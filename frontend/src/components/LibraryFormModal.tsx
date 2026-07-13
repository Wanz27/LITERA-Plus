import * as React from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { Library, LibraryStatus, LibraryType } from '../lib/api'

interface Props {
  initial?: Library | null
  onClose: () => void
  onSubmit: (payload: {
    nama: string
    lokasi: string
    status: LibraryStatus
    tipe: LibraryType
    jam_operasional: string
    kepala_unit: string
  }) => Promise<void>
}

interface Schedule {
  day: string
  open: string
  close: string
}

const statusOptions: LibraryStatus[] = ['Tersedia', 'Penuh', 'Pemeliharaan']
const tipeOptions: { value: LibraryType; label: string }[] = [
  { value: 'utama', label: 'Perpustakaan Utama' },
  { value: 'digital', label: 'Perpustakaan Digital' },
  { value: 'referensi', label: 'Ruang Baca Referensi' },
  { value: 'arsip', label: 'Laboratorium Arsip' },
]

const DAY_OPTIONS = [
  'Setiap Hari',
  'Senin - Jumat',
  'Senin - Sabtu',
  'Sabtu - Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
]

const DEFAULT_SCHEDULES: Schedule[] = [
  { day: 'Senin - Jumat', open: '08:00', close: '18:00' },
  { day: 'Sabtu', open: '09:00', close: '15:00' },
]

function parseJamOperasional(text?: string): Schedule[] {
  if (!text) return DEFAULT_SCHEDULES
  const parsed = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.*?):\s*(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})$/)
      if (!m) return null
      const [, day, oh, om, ch, cm] = m
      return {
        day: day.trim(),
        open: `${oh.padStart(2, '0')}:${om}`,
        close: `${ch.padStart(2, '0')}:${cm}`,
      }
    })
    .filter((s): s is Schedule => s !== null)
  return parsed.length > 0 ? parsed : DEFAULT_SCHEDULES
}

function formatJam(time: string) {
  return time.replace(':', '.')
}

export default function LibraryFormModal({ initial, onClose, onSubmit }: Props) {
  const [nama, setNama] = React.useState(initial?.nama ?? '')
  const [lokasi, setLokasi] = React.useState(initial?.lokasi ?? '')
  const [status, setStatus] = React.useState<LibraryStatus>(initial?.status ?? 'Tersedia')
  const [tipe, setTipe] = React.useState<LibraryType>(initial?.tipe ?? 'utama')
  const [schedules, setSchedules] = React.useState<Schedule[]>(() => parseJamOperasional(initial?.jam_operasional))
  const [kepalaUnit, setKepalaUnit] = React.useState(initial?.kepala_unit ?? '')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function updateSchedule(index: number, patch: Partial<Schedule>) {
    setSchedules((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function addSchedule() {
    setSchedules((prev) => [...prev, { day: 'Senin - Jumat', open: '08:00', close: '17:00' }])
  }

  function removeSchedule(index: number) {
    setSchedules((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!nama.trim() || !lokasi.trim()) {
      setError('Nama dan lokasi wajib diisi.')
      return
    }
    setSaving(true)
    try {
      const jamOperasional = schedules
        .map((s) => `${s.day}: ${formatJam(s.open)} - ${formatJam(s.close)}`)
        .join('\n')
      await onSubmit({
        nama: nama.trim(),
        lokasi: lokasi.trim(),
        status,
        tipe,
        jam_operasional: jamOperasional,
        kepala_unit: kepalaUnit.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {initial ? 'Ubah Perpustakaan' : 'Tambah Perpustakaan Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Nama Perpustakaan
            </label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Perpustakaan Pusat"
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Lokasi
            </label>
            <input
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Lantai 1, Gedung Utama"
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LibraryStatus)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Tipe
              </label>
              <select
                value={tipe}
                onChange={(e) => setTipe(e.target.value as LibraryType)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              >
                {tipeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                Jam Operasional
              </label>
              <button
                type="button"
                onClick={addSchedule}
                className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900"
              >
                <Plus size={14} /> Tambah Jadwal
              </button>
            </div>
            <div className="space-y-2">
              {schedules.map((s, i) => {
                const dayOptions = DAY_OPTIONS.includes(s.day) ? DAY_OPTIONS : [s.day, ...DAY_OPTIONS]
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    <select
                      value={s.day}
                      onChange={(e) => updateSchedule(i, { day: e.target.value })}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20 sm:w-[38%]"
                    >
                      {dayOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="time"
                        value={s.open}
                        onChange={(e) => updateSchedule(i, { open: e.target.value })}
                        className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                      />
                      <span className="shrink-0 text-slate-400">–</span>
                      <input
                        type="time"
                        value={s.close}
                        onChange={(e) => updateSchedule(i, { close: e.target.value })}
                        className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeSchedule(i)}
                        disabled={schedules.length <= 1}
                        className="shrink-0 text-slate-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Hapus jadwal"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Kepala Unit
            </label>
            <input
              value={kepalaUnit}
              onChange={(e) => setKepalaUnit(e.target.value)}
              placeholder="Drs. Ahmad Sudrajat, M.Lib."
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
