import { BookOpen, BookPlus, Pencil, Trash2, Upload } from 'lucide-react'

export type RiwayatPeriod = 'Semua' | 'Hari Ini' | 'Minggu Ini' | 'Bulan Ini' | 'Tahun Ini' | 'Lebih Lama'
export type RiwayatSort = 'terbaru' | 'terlama'

export const RIWAYAT_PERIOD_FILTERS: RiwayatPeriod[] = ['Semua', 'Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini']

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeek(d: Date) {
  const x = startOfDay(d)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1)
}

/** Inclusive range check for the period chips: "Bulan Ini" also matches items from today/this week. */
export function isWithinPeriod(dateStr: string, period: Exclude<RiwayatPeriod, 'Semua'>) {
  const date = new Date(dateStr)
  const now = new Date()
  switch (period) {
    case 'Hari Ini':
      return date >= startOfDay(now)
    case 'Minggu Ini':
      return date >= startOfWeek(now)
    case 'Bulan Ini':
      return date >= startOfMonth(now)
    case 'Tahun Ini':
      return date >= startOfYear(now)
    case 'Lebih Lama':
      return date < startOfYear(now)
    default:
      return true
  }
}

export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))
  if (minutes < 60) return `${minutes} Menit yang lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} Jam yang lalu`
  const days = Math.floor(hours / 24)
  return `${days} Hari yang lalu`
}

export function activityMeta(aksi: string) {
  if (aksi.includes('Impor')) return { icon: Upload, badge: 'bg-violet-100 text-violet-700' }
  if (aksi.includes('Menghapus')) return { icon: Trash2, badge: 'bg-rose-100 text-rose-700' }
  if (aksi.includes('Mengubah')) return { icon: Pencil, badge: 'bg-amber-100 text-amber-700' }
  if (aksi.includes('Menambahkan')) return { icon: BookPlus, badge: 'bg-sky-100 text-sky-700' }
  return { icon: BookOpen, badge: 'bg-slate-100 text-slate-600' }
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

/** Same heuristic LibraryDetailPage uses to scope the global activity feed to one library. */
export function belongsToLibrary(log: { aksi: string; detail: string }, libraryName: string) {
  return `${log.aksi} ${log.detail}`.toLowerCase().includes(libraryName.toLowerCase())
}
