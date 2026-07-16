import * as React from 'react'
import { createPortal } from 'react-dom'
import { Filter } from 'lucide-react'
import type { BookKondisi } from '../lib/api'
import { bookSortOptions, klasifikasiOptions, type BookSort } from '../lib/bookUi'

interface Props {
  kondisiFilter: 'Semua' | BookKondisi
  onKondisiChange: (value: 'Semua' | BookKondisi) => void
  klasifikasiFilter: string
  onKlasifikasiChange: (value: string) => void
  klasifikasiChoices: string[]
  sort: BookSort
  onSortChange: (value: BookSort) => void
  activeCount: number
  onReset: () => void
}

const kondisiChoices: ('Semua' | BookKondisi)[] = ['Semua', 'Bagus', 'Rusak']

export default function BookFilterSortMenu({
  kondisiFilter,
  onKondisiChange,
  klasifikasiFilter,
  onKlasifikasiChange,
  klasifikasiChoices,
  sort,
  onSortChange,
  activeCount,
  onReset,
}: Props) {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = React.useState<React.CSSProperties>({})

  React.useEffect(() => {
    if (!open) return
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
        width: 280,
      })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Filter & urutkan"
        className="flex h-10 items-center gap-2 rounded-full bg-violet-600 pl-3.5 pr-3.5 text-white shadow-sm hover:bg-violet-700"
      >
        <Filter size={16} />
        {activeCount > 0 && (
          <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-orange-300 px-1 text-[11px] font-bold text-violet-950">
            {activeCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className="z-50 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
          >
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Kondisi</p>
              <div className="flex flex-wrap gap-1.5">
                {kondisiChoices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => onKondisiChange(choice)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      kondisiFilter === choice
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Klasifikasi
              </label>
              <select
                value={klasifikasiFilter}
                onChange={(e) => onKlasifikasiChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
              >
                <option value="Semua">Semua Klasifikasi</option>
                {klasifikasiChoices.map((code) => (
                  <option key={code} value={code}>
                    {klasifikasiOptions.find((k) => k.value === code)?.label ?? code}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Urutkan
              </label>
              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value as BookSort)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
              >
                {bookSortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onReset}
              className="w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset Filter & Urutan
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}
