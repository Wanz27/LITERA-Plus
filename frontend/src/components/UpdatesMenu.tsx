import * as React from 'react'
import { createPortal } from 'react-dom'
import { Rocket, Sparkles } from 'lucide-react'
import { APP_VERSION, changelog, type ChangeType } from '../lib/changelog'

const LAST_SEEN_KEY = 'litera_last_seen_version'

const typeStyles: Record<ChangeType, string> = {
  Baru: 'bg-sky-100 text-sky-700',
  Peningkatan: 'bg-emerald-100 text-emerald-700',
  Perbaikan: 'bg-amber-100 text-amber-700',
}

export default function UpdatesMenu() {
  const [open, setOpen] = React.useState(false)
  const [unread, setUnread] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({})

  React.useEffect(() => {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY)
    setUnread(lastSeen !== APP_VERSION)
  }, [])

  React.useLayoutEffect(() => {
    if (!open) return
    function updatePosition() {
      const buttonRect = buttonRef.current?.getBoundingClientRect()
      const menuWidth = menuRef.current?.offsetWidth
      if (!buttonRect || !menuWidth) return
      const margin = 8
      const left = Math.min(
        Math.max(buttonRect.right - menuWidth, margin),
        window.innerWidth - menuWidth - margin,
      )
      setMenuStyle({
        position: 'fixed',
        left,
        top: buttonRect.bottom + 10,
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

  function handleToggle() {
    setOpen((v) => !v)
    localStorage.setItem(LAST_SEEN_KEY, APP_VERSION)
    setUnread(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="relative text-slate-400 transition-colors hover:text-slate-600"
        aria-label="Lihat pembaruan aplikasi"
      >
        <Rocket size={20} />
        {unread && <span className="absolute top-0 right-0 h-2 w-2 rounded-full border border-white bg-rose-500" />}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="z-50 flex w-72 max-w-[85vw] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-80 sm:max-w-[90vw]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Sparkles size={14} className="text-sky-700" />
                <h3 className="text-xs font-bold text-slate-900 sm:text-sm">Pembaruan Aplikasi</h3>
              </div>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800 sm:text-xs">
                v{APP_VERSION}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto sm:max-h-96">
              {changelog.map((entry, i) => (
                <div key={entry.version} className="border-b border-slate-100 px-3 py-2.5 last:border-b-0 sm:px-4 sm:py-3">
                  <div className="mb-1.5 flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs font-bold text-slate-800 sm:text-sm">v{entry.version}</span>
                    {i === 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Terbaru
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-slate-400 sm:text-xs">
                      {new Date(entry.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {entry.changes.map((change, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-slate-600 sm:text-sm">
                        <span
                          className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${typeStyles[change.type]}`}
                        >
                          {change.type}
                        </span>
                        <span>{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
