import * as React from 'react'
import { createPortal } from 'react-dom'
import type { Book } from '../lib/api'

interface Props {
  judul: string
  penulis: string
  books: Book[]
  onSelect: (book: Book) => void
}

export default function InventoryNumbersPopover({ judul, penulis, books, onSelect }: Props) {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const [style, setStyle] = React.useState<React.CSSProperties>({})

  React.useEffect(() => {
    if (!open) return
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setStyle({
        position: 'fixed',
        left: Math.min(rect.left, window.innerWidth - 208),
        top: rect.bottom + 6,
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
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return
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
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="rounded-md border border-sky-200 bg-white px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
      >
        Lihat
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            style={style}
            className="z-50 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-xs font-bold text-slate-900">{judul}</p>
              <p className="truncate text-[11px] text-slate-500">
                {penulis} · {books.length} eksemplar
              </p>
            </div>
            <ul className="max-h-52 divide-y divide-slate-100 overflow-y-auto">
              {books.map((book, i) => (
                <li key={`${book.id}-${i}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onSelect(book)
                    }}
                    className="block w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {book.nomor_inventaris || '-'}
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  )
}
