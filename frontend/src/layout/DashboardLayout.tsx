import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookMarked,
  BookOpen,
  Bell,
  HelpCircle,
  LayoutGrid,
  History,
  LogOut,
  Menu,
  Users,
  X,
  ChevronDown,
  Library as LibraryIcon,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import UpdatesMenu from '../components/UpdatesMenu'
import * as api from '../lib/api'
import type { Library } from '../lib/api'

interface LayoutProps {
  children: ReactNode
}

const baseMenu = [
  { name: 'Manajemen Perpustakaan', icon: LayoutGrid, path: '/dashboard' },
  { name: 'Riwayat', icon: History, path: '/riwayat' },
]

const adminMenu = [{ name: 'Manajemen Akun', icon: Users, path: '/akun' }]

const visitorMenu = [{ name: 'Katalog Buku', icon: BookOpen, path: '/katalog' }]

export default function DashboardLayout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { fullName, role, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const menu = role === 'admin' ? [...baseMenu, ...adminMenu] : role === 'visitor' ? visitorMenu : baseMenu
  const isLibraryRoute = location.pathname.startsWith('/dashboard')
  const [librariesExpanded, setLibrariesExpanded] = useState(isLibraryRoute)
  const [libraries, setLibraries] = useState<Library[]>([])
  const showLibraryMenu = role === 'admin' || role === 'petugas'

  useEffect(() => {
    if (!showLibraryMenu) return
    api.getLibraries().then(setLibraries).catch(() => setLibraries([]))
  }, [showLibraryMenu])

  const handleLogout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-800 bg-[#141C2F] text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-600 p-2 text-white">
              <BookMarked size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wider text-white">
                LITERA<span className="text-sky-500">+</span>
              </h1>
              <p className="text-xs text-slate-400">Smart Library</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto">
          {menu.map((item) => {
            const isDashboardItem = item.path === '/dashboard'
            const isActive = isDashboardItem ? isLibraryRoute : location.pathname === item.path

            if (!isDashboardItem) {
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive
                      ? 'border-l-4 border-sky-500 bg-slate-800 text-white'
                      : 'hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-sky-500' : 'text-slate-400'} />
                  {item.name}
                </Link>
              )
            }

            return (
              <div key={item.name}>
                <div
                  className={`flex items-center transition-colors ${
                    isActive ? 'border-l-4 border-sky-500 bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex flex-1 items-center gap-3 py-3 pl-6"
                  >
                    <item.icon size={20} className={isActive ? 'text-sky-500' : 'text-slate-400'} />
                    {item.name}
                  </Link>
                  {showLibraryMenu && (
                    <button
                      onClick={() => setLibrariesExpanded((prev) => !prev)}
                      className="px-4 py-3 text-slate-400 hover:text-white"
                      aria-label={librariesExpanded ? 'Sembunyikan daftar perpustakaan' : 'Tampilkan daftar perpustakaan'}
                      aria-expanded={librariesExpanded}
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${librariesExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {showLibraryMenu && librariesExpanded && (
                  <div className="border-l-4 border-transparent">
                    {libraries.length === 0 ? (
                      <p className="px-6 py-2 pl-14 text-xs text-slate-500">Belum ada perpustakaan</p>
                    ) : (
                      libraries.map((lib) => {
                        const libActive = location.pathname === `/dashboard/${lib.id}`
                        return (
                          <Link
                            key={lib.id}
                            to={`/dashboard/${lib.id}`}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2 py-2 pl-14 pr-4 text-sm transition-colors ${
                              libActive ? 'text-sky-400' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <LibraryIcon size={14} className="shrink-0" />
                            <span className="truncate">{lib.nama}</span>
                          </Link>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-slate-800/50 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-2 py-3 text-slate-400 transition hover:text-white"
          >
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:h-20 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-500 hover:text-slate-700 lg:hidden"
              aria-label="Buka menu"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800 sm:text-xl">
              LITERA<span className="text-sky-700">+</span>
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button className="relative text-slate-400 transition-colors hover:text-slate-600">
              <Bell size={20} />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full border border-white bg-rose-500"></span>
            </button>
            <UpdatesMenu />
            <button className="text-slate-400 transition-colors hover:text-slate-600">
              <HelpCircle size={20} />
            </button>

            <Link
              to="/profile"
              className="flex items-center gap-3 sm:border-l sm:border-slate-200 sm:pl-6"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">{fullName || 'Admin LITERA+'}</p>
                <p className="text-xs text-slate-400">
                  {role === 'admin' ? 'Super Administrator' : role === 'petugas' ? 'Petugas Perpustakaan' : 'Visitor'}
                </p>
              </div>
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-200 sm:h-10 sm:w-10">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName || 'admin'}`}
                  alt="avatar"
                />
              </div>
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  )
}
