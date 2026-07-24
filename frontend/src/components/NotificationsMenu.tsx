import * as React from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, Inbox, CheckCircle2, XCircle } from 'lucide-react'
import * as api from '../lib/api'
import type { AppNotification, NotificationType } from '../lib/api'

const POLL_INTERVAL_MS = 30000

const typeIcon: Record<NotificationType, React.ComponentType<{ size?: number; className?: string }>> = {
  peminjaman_diajukan: Inbox,
  peminjaman_disetujui: CheckCircle2,
  peminjaman_ditolak: XCircle,
}

const typeIconClass: Record<NotificationType, string> = {
  peminjaman_diajukan: 'text-amber-600',
  peminjaman_disetujui: 'text-emerald-600',
  peminjaman_ditolak: 'text-rose-600',
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  return new Date(dateStr).toLocaleDateString('id-ID', { dateStyle: 'medium' })
}

function targetPathFor(notification: AppNotification): string | null {
  switch (notification.type) {
    case 'peminjaman_diajukan':
      return notification.library_id ? `/dashboard/${notification.library_id}?tab=peminjaman` : null
    case 'peminjaman_disetujui':
    case 'peminjaman_ditolak':
      return '/peminjaman-saya'
    default:
      return null
  }
}

export default function NotificationsMenu() {
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({})

  async function load() {
    try {
      const data = await api.getNotifications()
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch {
      // Diamkan, badge tetap menampilkan data terakhir yang berhasil dimuat.
    }
  }

  React.useEffect(() => {
    load()
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
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
    if (!open) load()
  }

  async function handleItemClick(notification: AppNotification) {
    if (!notification.is_read) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
      try {
        await api.markNotificationAsRead(notification.id)
      } catch {
        // Biarkan, status "read" tetap dianggap berhasil di UI; polling berikutnya akan menyinkronkan ulang.
      }
    }

    setOpen(false)
    const target = targetPathFor(notification)
    if (target) navigate(target)
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    try {
      await api.markAllNotificationsAsRead()
    } catch {
      // Biarkan, polling berikutnya akan menyinkronkan ulang jika gagal di server.
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="relative text-slate-400 transition-colors hover:text-slate-600"
        aria-label="Lihat notifikasi"
      >
        {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full border border-white bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="z-50 flex w-80 max-w-[90vw] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-sky-700 hover:text-sky-900"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-slate-400">Belum ada notifikasi.</p>
              )}
              {notifications.map((n) => {
                const Icon = typeIcon[n.type]
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 ${
                      n.is_read ? '' : 'bg-sky-50/60'
                    }`}
                  >
                    <Icon size={18} className={`mt-0.5 shrink-0 ${typeIconClass[n.type]}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${n.is_read ? 'text-slate-600' : 'font-semibold text-slate-800'}`}>
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-600" />}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
