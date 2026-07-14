import * as React from 'react'
import { createPortal } from 'react-dom'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import type { Book, Library } from '../lib/api'
import { exportBooksToExcel, exportBooksToPdf } from '../lib/exportReport'

interface Props {
  library: Library
  books: Book[]
}

export default function ExportReportMenu({ library, books }: Props) {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({})

  React.useEffect(() => {
    if (!open) return
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        bottom: window.innerHeight - rect.top + 8,
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
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
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
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Download size={16} /> Download Laporan Unit
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            <button
              type="button"
              onClick={() => {
                exportBooksToExcel(library, books)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileSpreadsheet size={16} className="text-emerald-600" /> Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => {
                exportBooksToPdf(library, books)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileText size={16} className="text-rose-600" /> PDF (.pdf)
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}
