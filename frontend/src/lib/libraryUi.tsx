import { Landmark, Monitor, BookOpen, Warehouse } from 'lucide-react'
import type { LibraryStatus, LibraryType } from './api'

export const typeIcon: Record<LibraryType, typeof Landmark> = {
  utama: Landmark,
  digital: Monitor,
  referensi: BookOpen,
  arsip: Warehouse,
}

export const statusStyle: Record<LibraryStatus, string> = {
  Tersedia: 'text-emerald-600 before:bg-emerald-500',
  Penuh: 'text-amber-600 before:bg-amber-500',
  Pemeliharaan: 'text-sky-600 before:bg-sky-500',
}

export function StatusBadge({ status }: { status: LibraryStatus }) {
  return (
    <span
      className={`before:content-[''] flex items-center gap-1.5 text-sm font-medium before:inline-block before:h-1.5 before:w-1.5 before:rounded-full ${statusStyle[status]}`}
    >
      {status}
    </span>
  )
}
