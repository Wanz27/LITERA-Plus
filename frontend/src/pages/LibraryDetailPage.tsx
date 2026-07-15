import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  MapPin,
  Pencil,
  Plus,
  BookOpen,
  AlertTriangle,
  Clock,
  User,
  SlidersHorizontal,
  Eye,
  ZoomIn,
} from 'lucide-react'
import DashboardLayout from '../layout/DashboardLayout'
import LibraryFormModal from '../components/LibraryFormModal'
import BookFormModal from '../components/BookFormModal'
import CoverPreviewModal from '../components/CoverPreviewModal'
import BookDetailModal from '../components/BookDetailModal'
import ConfirmDialog from '../components/ConfirmDialog'
import ExportReportMenu from '../components/ExportReportMenu'
import * as api from '../lib/api'
import type { ActivityLog, Book, BookKondisi, Library, LibraryStatus, LibraryType } from '../lib/api'
import { typeIcon, StatusBadge } from '../lib/libraryUi'
import {
  klasifikasiOptions,
  klasifikasiMainClass,
  generateCallNumber,
  groupBooksByBatch,
  summarizeInventoryNumbers,
} from '../lib/bookUi'

const FACILITY_IMAGE =
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80'

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'list-buku', label: 'List Buku' },
  { key: 'riwayat', label: 'Riwayat' },
] as const
type TabKey = (typeof tabs)[number]['key']

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))
  if (minutes < 60) return `${minutes} Menit yang lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} Jam yang lalu`
  const days = Math.floor(hours / 24)
  return `${days} Hari yang lalu`
}

export default function LibraryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [library, setLibrary] = React.useState<Library | null>(null)
  const [activity, setActivity] = React.useState<ActivityLog[]>([])
  const [books, setBooks] = React.useState<Book[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [bookModalOpen, setBookModalOpen] = React.useState(false)
  const [editingBook, setEditingBook] = React.useState<Book | null>(null)
  const [booksError, setBooksError] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState<TabKey>('dashboard')
  const [bookSearch, setBookSearch] = React.useState('')
  const [bookKondisiFilter, setBookKondisiFilter] = React.useState<'Semua' | BookKondisi>('Semua')
  const [bookKlasifikasiFilter, setBookKlasifikasiFilter] = React.useState('Semua')
  const [previewBook, setPreviewBook] = React.useState<Book | null>(null)
  const [detailGroup, setDetailGroup] = React.useState<Book[] | null>(null)
  const [detailIndex, setDetailIndex] = React.useState(0)
  const [bookToDelete, setBookToDelete] = React.useState<Book | null>(null)
  const [deletingBook, setDeletingBook] = React.useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [libraries, logs] = await Promise.all([api.getLibraries(), api.getActivityLog()])
      const found = libraries.find((l) => l.id === id) ?? null
      setLibrary(found)
      setActivity(logs)
      if (found) {
        await loadBooks(found.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail perpustakaan.')
    } finally {
      setLoading(false)
    }
  }

  async function loadBooks(libraryId: string) {
    setBooksError(null)
    try {
      setBooks(await api.getBooks(libraryId))
    } catch (err) {
      setBooksError(err instanceof Error ? err.message : 'Gagal memuat data buku.')
    }
  }

  React.useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleUpdate(payload: {
    nama: string
    lokasi: string
    status: LibraryStatus
    tipe: LibraryType
    jam_operasional: string
    kepala_unit: string
  }) {
    if (!library) return
    await api.updateLibrary(library.id, payload)
    setModalOpen(false)
    await load()
  }

  async function handleSaveBook(payload: {
    judul: string
    penulis: string
    penerbit: string
    tahun_terbit: string
    isbn: string
    kode_klasifikasi: string
    kondisi: BookKondisi
    subjek: string
    bahasa: string
    jumlah: string
    nomor_inventaris: string
    jumlah_halaman: string
    ukuran_buku: string
    ilustrasi: string
    cover_url: string
  }) {
    if (!library) return
    const body = {
      ...payload,
      tahun_terbit: payload.tahun_terbit === '' ? undefined : payload.tahun_terbit,
      jumlah_halaman: payload.jumlah_halaman === '' ? undefined : payload.jumlah_halaman,
    }
    if (editingBook) {
      await api.updateBook(editingBook.id, body)
    } else {
      await api.createBook({ ...body, library_id: library.id })
    }
    setBookModalOpen(false)
    setEditingBook(null)
    await load()
  }

  async function handleDeleteBook() {
    if (!bookToDelete) return
    setDeletingBook(true)
    try {
      await api.deleteBook(bookToDelete.id)
      setBookToDelete(null)
      await load()
    } finally {
      setDeletingBook(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-sm text-slate-400">Memuat detail perpustakaan...</div>
      </DashboardLayout>
    )
  }

  if (error || !library) {
    return (
      <DashboardLayout>
        <div className="mx-auto w-full max-w-7xl p-8">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sky-700">
            <ChevronLeft size={16} /> Kembali ke Daftar
          </Link>
          <p className="mt-6 text-sm text-rose-600">{error || 'Perpustakaan tidak ditemukan.'}</p>
        </div>
      </DashboardLayout>
    )
  }

  const Icon = typeIcon[library.tipe]
  const buildingLabel = library.lokasi.split(',').slice(-1)[0]?.trim() || library.nama

  const totalBuku = books.reduce((sum, b) => sum + b.jumlah, 0)
  const damagedCount = books.filter((b) => b.kondisi === 'Rusak').reduce((sum, b) => sum + b.jumlah, 0)
  const damagedPct = totalBuku > 0 ? Math.round((damagedCount / totalBuku) * 100) : 0

  const klasifikasiStats = klasifikasiOptions
    .map((opt) => {
      const jumlah = books
        .filter((b) => klasifikasiMainClass(b.kode_klasifikasi) === opt.value)
        .reduce((sum, b) => sum + b.jumlah, 0)
      return { label: opt.label, jumlah, pct: totalBuku > 0 ? Math.round((jumlah / totalBuku) * 100) : 0 }
    })
    .filter((k) => k.jumlah > 0)

  const belumDiklasifikasi = books
    .filter((b) => klasifikasiMainClass(b.kode_klasifikasi) === null)
    .reduce((sum, b) => sum + b.jumlah, 0)
  if (belumDiklasifikasi > 0) {
    klasifikasiStats.push({
      label: 'Belum diklasifikasi',
      jumlah: belumDiklasifikasi,
      pct: totalBuku > 0 ? Math.round((belumDiklasifikasi / totalBuku) * 100) : 0,
    })
  }
  klasifikasiStats.sort((a, b) => b.pct - a.pct)

  const usedKlasifikasi = Array.from(new Set(books.map((b) => b.kode_klasifikasi).filter(Boolean)))

  const bookSearchLower = bookSearch.trim().toLowerCase()
  const filteredBooks = books.filter((book) => {
    if (bookKondisiFilter !== 'Semua' && book.kondisi !== bookKondisiFilter) return false
    if (bookKlasifikasiFilter !== 'Semua' && book.kode_klasifikasi !== bookKlasifikasiFilter) return false
    if (bookSearchLower) {
      const haystack = `${book.judul} ${book.penulis} ${book.isbn} ${book.penerbit}`.toLowerCase()
      if (!haystack.includes(bookSearchLower)) return false
    }
    return true
  })
  const bookFiltersActive =
    bookSearchLower !== '' || bookKondisiFilter !== 'Semua' || bookKlasifikasiFilter !== 'Semua'

  const groupedBookRows = groupBooksByBatch(filteredBooks)
  const totalGroupCount = groupBooksByBatch(books).length

  const relatedActivity = activity
    .filter((log) => `${log.aksi} ${log.detail}`.toLowerCase().includes(library.nama.toLowerCase()))
    .slice(0, 5)
  const activityRows = relatedActivity.length > 0 ? relatedActivity : activity.slice(0, 5)

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sky-700 hover:text-sky-900"
        >
          <ChevronLeft size={16} /> Kembali ke Daftar
        </button>

        <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-[28px]">{library.nama}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <p className="flex items-center gap-1.5 text-sm text-sky-700">
                <MapPin size={14} /> {library.lokasi}
              </p>
              <StatusBadge status={library.status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Pencil size={16} /> Edit Detail
            </button>
            <button
              onClick={() => {
                setTab('list-buku')
                setEditingBook(null)
                setBookModalOpen(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-900"
            >
              <Plus size={18} /> Tambah Buku
            </button>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-6 overflow-x-auto border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold ${
                tab === t.key ? 'border-sky-700 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-sky-100 text-sky-800">
                    <BookOpen size={18} />
                  </div>
                </div>
                <p className="text-sm text-slate-500">Total Buku</p>
                <p className="text-2xl font-bold text-slate-900">{totalBuku.toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-100 text-rose-600">
                    <AlertTriangle size={18} />
                  </div>
                  <span className="text-xs font-semibold text-rose-600">{damagedPct}%</span>
                </div>
                <p className="text-sm text-slate-500">Buku Rusak/Hilang</p>
                <p className="text-2xl font-bold text-slate-900">{damagedCount.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">Distribusi Kode Klasifikasi</h3>
                    <p className="text-sm text-slate-500">Persentase koleksi buku berdasarkan kode klasifikasi</p>
                  </div>
                  <button
                    onClick={() => setTab('list-buku')}
                    className="text-sm font-semibold text-sky-700 hover:text-sky-900"
                  >
                    Lihat List Buku
                  </button>
                </div>

                {klasifikasiStats.length === 0 && (
                  <p className="text-sm text-slate-400">Belum ada data buku untuk ditampilkan.</p>
                )}

                <div className="space-y-5">
                  {klasifikasiStats.map((k) => (
                    <div key={k.label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{k.label}</span>
                        <span className="font-semibold text-slate-900">
                          {k.pct}% ({k.jumlah.toLocaleString('id-ID')})
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-sky-900" style={{ width: `${k.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-36 w-full">
                  <img src={FACILITY_IMAGE} alt={buildingLabel} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wide">Lokasi Perpustakaan</p>
                    <p className="text-lg font-bold leading-tight">{buildingLabel}</p>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Clock size={18} className="mt-0.5 shrink-0 text-slate-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Jam Operasional</p>
                        {library.jam_operasional.split('\n').map((line, i) => (
                          <p key={i} className="text-sm text-slate-500">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="shrink-0 text-slate-400 hover:text-sky-700"
                      aria-label="Ubah jam operasional"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <User size={18} className="mt-0.5 shrink-0 text-slate-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Kepala Unit</p>
                        <p className="text-sm text-slate-500">{library.kepala_unit}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="shrink-0 text-slate-400 hover:text-sky-700"
                      aria-label="Ubah kepala unit"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  <ExportReportMenu library={library} books={books} />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="font-bold text-slate-900">Aktivitas Terkini</h3>
                <SlidersHorizontal size={16} className="text-slate-400" />
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Waktu</th>
                    <th className="px-6 py-3">Aktivitas</th>
                    <th className="px-6 py-3">Pengguna</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activityRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                        Belum ada aktivitas tercatat.
                      </td>
                    </tr>
                  )}
                  {activityRows.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-6 py-3 text-sm text-slate-500">{timeAgo(log.created_at)}</td>
                      <td className="px-6 py-3 text-sm font-medium text-sky-800">{log.aksi}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{log.pelaku}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-emerald-600">BERHASIL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </>
        )}

        {tab === 'list-buku' && booksError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
            {booksError}
          </div>
        )}

        {tab === 'list-buku' && books.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-sky-100 text-sky-800">
              <Icon size={22} />
            </div>
            <p className="font-semibold text-slate-800">Belum ada data buku untuk perpustakaan ini.</p>
            <p className="mt-1 text-sm text-slate-500">Klik "Tambah Buku" untuk mulai mendata koleksi buku.</p>
            <button
              onClick={() => {
                setEditingBook(null)
                setBookModalOpen(true)
              }}
              className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-900"
            >
              <Plus size={18} /> Tambah Buku
            </button>
          </div>
        )}

        {tab === 'list-buku' && books.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
              <h3 className="font-bold text-slate-900">
                Koleksi Buku ({groupedBookRows.length}
                {bookFiltersActive ? ` dari ${totalGroupCount}` : ''})
              </h3>
              <button
                onClick={() => {
                  setEditingBook(null)
                  setBookModalOpen(true)
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900"
              >
                <Plus size={16} /> Tambah Buku
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
              <input
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Cari judul, penulis, ISBN..."
                className="h-9 min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              />
              <select
                value={bookKondisiFilter}
                onChange={(e) => setBookKondisiFilter(e.target.value as 'Semua' | BookKondisi)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              >
                <option value="Semua">Semua Kondisi</option>
                <option value="Bagus">Bagus</option>
                <option value="Rusak">Rusak</option>
              </select>
              <select
                value={bookKlasifikasiFilter}
                onChange={(e) => setBookKlasifikasiFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              >
                <option value="Semua">Semua Klasifikasi</option>
                {usedKlasifikasi.map((code) => (
                  <option key={code} value={code}>
                    {klasifikasiOptions.find((k) => k.value === code)?.label ?? code}
                  </option>
                ))}
              </select>
              {bookFiltersActive && (
                <button
                  onClick={() => {
                    setBookSearch('')
                    setBookKondisiFilter('Semua')
                    setBookKlasifikasiFilter('Semua')
                  }}
                  className="text-sm font-semibold text-sky-700 hover:text-sky-900"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {groupedBookRows.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">
                Tidak ada buku yang cocok dengan filter.
              </p>
            )}

            {groupedBookRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Cover</th>
                    <th className="px-6 py-3">Judul</th>
                    <th className="px-6 py-3">Penulis</th>
                    <th className="px-6 py-3">Penerbit</th>
                    <th className="px-6 py-3">Tahun</th>
                    <th className="px-6 py-3">ISBN</th>
                    <th className="px-6 py-3">Klasifikasi</th>
                    <th className="px-6 py-3">Kondisi</th>
                    <th className="px-6 py-3">Subjek</th>
                    <th className="px-6 py-3">Bahasa</th>
                    <th className="px-6 py-3">Jumlah</th>
                    <th className="px-6 py-3">No. Inventaris</th>
                    <th className="px-6 py-3">No. Panggil</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedBookRows.map((group) => {
                    const book = group[0]
                    const kondisiCounts = group.reduce<Record<string, number>>((acc, b) => {
                      acc[b.kondisi] = (acc[b.kondisi] || 0) + 1
                      return acc
                    }, {})
                    const kondisiKeys = Object.keys(kondisiCounts)
                    return (
                      <tr
                        key={book.batch_id || book.id}
                        onClick={() => {
                          setDetailGroup(group)
                          setDetailIndex(0)
                        }}
                        className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-3">
                          {book.cover_url ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPreviewBook(book)
                              }}
                              className="group relative block h-14 w-10 shrink-0 overflow-hidden rounded shadow-sm"
                              aria-label={`Lihat cover ${book.judul}`}
                            >
                              <img
                                src={book.cover_url}
                                alt={book.judul}
                                className="h-full w-full object-cover transition group-hover:brightness-75"
                              />
                              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                                <ZoomIn size={16} className="text-white drop-shadow" />
                              </span>
                            </button>
                          ) : (
                            <div className="grid h-14 w-10 place-items-center rounded bg-slate-100 text-slate-300">
                              <BookOpen size={16} />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-slate-800">{book.judul}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{book.penulis}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{book.penerbit || '-'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{book.tahun_terbit ?? '-'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{book.isbn || '-'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{book.kode_klasifikasi || '-'}</td>
                        <td className="px-6 py-3">
                          {kondisiKeys.length === 1 ? (
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                kondisiKeys[0] === 'Rusak'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {kondisiKeys[0]}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {kondisiKeys.map((k) => (
                                <span
                                  key={k}
                                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    k === 'Rusak' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {k} {kondisiCounts[k]}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">{book.subjek || '-'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{book.bahasa || '-'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{group.length}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {summarizeInventoryNumbers(group.map((b) => b.nomor_inventaris))}
                        </td>
                        <td className="px-6 py-3 text-sm font-mono text-slate-600">
                          {generateCallNumber(book.kode_klasifikasi, book.penulis, book.judul)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetailGroup(group)
                                setDetailIndex(0)
                              }}
                              className="text-slate-400 hover:text-sky-700"
                              aria-label="Lihat detail buku"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {tab === 'riwayat' && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {activityRows.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">Belum ada aktivitas tercatat.</p>
            )}
            {activityRows.length > 0 && (
              <ul>
                {activityRows.map((log) => (
                  <li key={log.id} className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0">
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-800">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{log.aksi}</p>
                      <p className="text-sm text-slate-500">{log.detail}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {log.pelaku} · {new Date(log.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <LibraryFormModal initial={library} onClose={() => setModalOpen(false)} onSubmit={handleUpdate} />
      )}

      {bookModalOpen && (
        <BookFormModal
          initial={editingBook}
          onClose={() => {
            setBookModalOpen(false)
            setEditingBook(null)
          }}
          onSubmit={handleSaveBook}
        />
      )}

      {previewBook && (
        <CoverPreviewModal
          coverUrl={previewBook.cover_url}
          title={previewBook.judul}
          subtitle={previewBook.penulis}
          onClose={() => setPreviewBook(null)}
        />
      )}

      {detailGroup && (
        <BookDetailModal
          key={detailGroup[0]?.batch_id || detailGroup[0]?.id}
          books={detailGroup}
          initialIndex={detailIndex}
          onClose={() => setDetailGroup(null)}
          onEdit={(book) => {
            setDetailGroup(null)
            setEditingBook(book)
            setBookModalOpen(true)
          }}
          onDelete={(book) => {
            setDetailGroup(null)
            setBookToDelete(book)
          }}
        />
      )}

      {bookToDelete && (
        <ConfirmDialog
          title="Hapus buku ini?"
          message={`Buku "${bookToDelete.judul}" akan dihapus permanen dari koleksi buku.`}
          confirmLabel="Ya, Hapus"
          loading={deletingBook}
          onConfirm={handleDeleteBook}
          onCancel={() => setBookToDelete(null)}
        />
      )}
    </DashboardLayout>
  )
}
