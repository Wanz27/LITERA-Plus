import { Link } from 'react-router-dom'
import {
  BookMarked,
  Library,
  MapPinned,
  History,
  ShieldCheck,
  ArrowRight,
  Menu,
} from 'lucide-react'
import { useState } from 'react'

function LogoMark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-800 text-white shadow-sm">
        <BookMarked className="h-5 w-5" />
      </div>
      <span className="text-lg font-bold tracking-wide text-slate-900">
        LITERA<span className="text-sky-800">+</span>
      </span>
    </Link>
  )
}

const features = [
  {
    icon: Library,
    title: 'Manajemen Koleksi',
    desc: 'Catat dan kelola seluruh koleksi buku beserta lokasi rak secara terpusat, mudah diakses kapan saja.',
  },
  {
    icon: MapPinned,
    title: 'Multi-Lokasi',
    desc: 'Kelola beberapa titik perpustakaan sekaligus — perpustakaan pusat, ruang baca, hingga perpustakaan digital.',
  },
  {
    icon: History,
    title: 'Riwayat & Aktivitas',
    desc: 'Setiap peminjaman, pengembalian, dan perubahan data tercatat rapi dalam riwayat aktivitas.',
  },
  {
    icon: ShieldCheck,
    title: 'Akses Aman',
    desc: 'Login berbasis peran untuk admin dan petugas, menjaga data inventaris tetap aman dan tertata.',
  },
]

const stats = [
  { label: 'Perpustakaan terhubung', value: '12+' },
  { label: 'Koleksi tercatat', value: '8.500+' },
  { label: 'Desa & sekolah mitra', value: '30+' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <LogoMark />

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#fitur" className="hover:text-sky-800">Fitur</a>
            <a href="#tentang" className="hover:text-sky-800">Tentang</a>
            <a href="#kontak" className="hover:text-sky-800">Kontak</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:text-sky-800"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1.5 rounded-lg bg-sky-800 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-sky-900"
            >
              Mulai Kelola <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-600 md:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-sm font-medium text-slate-600">
              <a href="#fitur" onClick={() => setMenuOpen(false)}>Fitur</a>
              <a href="#tentang" onClick={() => setMenuOpen(false)}>Tentang</a>
              <a href="#kontak" onClick={() => setMenuOpen(false)}>Kontak</a>
              <Link to="/login" className="font-bold text-sky-800">Masuk</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-sky-900 to-blue-900">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div>
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-sky-200">
              Inventaris Perpustakaan Digital
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
              Kelola perpustakaan desa & sekolah dengan lebih rapi.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
              LITERA+ membantu pengelola perpustakaan desa dan sekolah mencatat
              koleksi, memantau ketersediaan, dan melacak riwayat aktivitas —
              semua dalam satu sistem yang sederhana.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-sky-900 shadow-md transition hover:bg-slate-100"
              >
                Masuk ke Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#fitur"
                className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Pelajari Fitur
              </a>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <div className="animate-float w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="rounded-xl bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-800">Manajemen Perpustakaan</div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Tersedia
                  </span>
                </div>
                {['Perpustakaan Pusat', 'Perpustakaan Digital', 'Ruang Baca Referensi'].map((name) => (
                  <div key={name} className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-100 text-sky-800">
                      <Library className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{name}</p>
                      <p className="text-xs text-slate-400">Lantai · Gedung</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3 lg:px-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-sky-900">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Semua yang dibutuhkan untuk mengelola perpustakaan
          </h2>
          <p className="mt-4 text-slate-500">
            Dirancang sederhana agar mudah dipakai oleh pengelola perpustakaan
            desa maupun sekolah tanpa perlu pelatihan khusus.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-sky-100 text-sky-800">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About / CTA */}
      <section id="tentang" className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Dibangun untuk perpustakaan desa & sekolah
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-500">
            LITERA+ hadir agar setiap perpustakaan, sekecil apa pun, punya
            catatan inventaris yang rapi dan mudah dipantau oleh pengelolanya.
          </p>
          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-800 px-6 py-3 font-bold text-white shadow-md transition hover:bg-sky-900"
            >
              Masuk Sekarang <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-slate-500 sm:flex-row lg:px-8">
          <LogoMark />
          <p>© {new Date().getFullYear()} LITERA+. Sistem Inventaris Perpustakaan Digital.</p>
        </div>
      </footer>
    </div>
  )
}
