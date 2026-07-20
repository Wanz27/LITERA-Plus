import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  BookPlus,
  BookOpen,
  BookMarked,
  AlertTriangle,
  PackageX,
  Clock,
  User,
  ZoomIn,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import DashboardLayout from '../layout/DashboardLayout'
import LibraryFormModal from '../components/LibraryFormModal'
import BookFormModal from '../components/BookFormModal'
import CoverPreviewModal from '../components/CoverPreviewModal'
import InventoryNumbersPopover from '../components/InventoryNumbersPopover'
import BookDetailModal from '../components/BookDetailModal'
import ConfirmDialog from '../components/ConfirmDialog'
import ExportReportMenu from '../components/ExportReportMenu'
import ImportBooksModal from '../components/ImportBooksModal'
import BookFilterSortMenu from '../components/BookFilterSortMenu'
import PeminjamanTab from '../components/PeminjamanTab'
import * as api from '../lib/api'
import type { ActivityLog, Book, BookKondisi, Library, LibraryStatus, LibraryType } from '../lib/api'
import { typeIcon, StatusBadge } from '../lib/libraryUi'
import {
  klasifikasiOptions,
  klasifikasiMainClass,
  generateCallNumber,
  groupBooksByIdentity,
  distinctValues,
  sortBookGroups,
  DEFAULT_BOOK_SORT,
  type BookSort,
} from '../lib/bookUi'

const FACILITY_IMAGE =
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80'

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'list-buku', label: 'List Buku' },
  { key: 'peminjaman', label: 'Peminjaman' },
  { key: 'riwayat', label: 'Riwayat' },
] as const
type TabKey = (typeof tabs)[number]['key']

function groupKey(group: Book[]): string {
  return group[0]?.batch_id || group[0]?.id
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))
  if (minutes < 60) return `${minutes} Menit yang lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} Jam yang lalu`
  const days = Math.floor(hours / 24)
  return `${days} Hari yang lalu`
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

function activityMeta(aksi: string) {
  if (aksi.includes('Impor')) return { icon: Upload, badge: 'bg-violet-100 text-violet-700' }
  if (aksi.includes('Menghapus')) return { icon: Trash2, badge: 'bg-rose-100 text-rose-700' }
  if (aksi.includes('Mengubah')) return { icon: Pencil, badge: 'bg-amber-100 text-amber-700' }
  if (aksi.includes('Menambahkan')) return { icon: BookPlus, badge: 'bg-sky-100 text-sky-700' }
  return { icon: BookOpen, badge: 'bg-slate-100 text-slate-600' }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

type RiwayatPeriod = 'Semua' | 'Hari Ini' | 'Minggu Ini' | 'Bulan Ini' | 'Tahun Ini' | 'Lebih Lama'
type RiwayatSort = 'terbaru' | 'terlama'

const RIWAYAT_PERIOD_FILTERS: RiwayatPeriod[] = ['Semua', 'Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini']

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
function isWithinPeriod(dateStr: string, period: Exclude<RiwayatPeriod, 'Semua'>) {
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
  }
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
  const [riwayatPeriod, setRiwayatPeriod] = React.useState<RiwayatPeriod>('Semua')
  const [riwayatAksiFilter, setRiwayatAksiFilter] = React.useState('Semua')
  const [riwayatSort, setRiwayatSort] = React.useState<RiwayatSort>('terbaru')
  const [bookSearch, setBookSearch] = React.useState('')
  const [bookKondisiFilter, setBookKondisiFilter] = React.useState<'Semua' | BookKondisi>('Semua')
  const [bookKlasifikasiFilter, setBookKlasifikasiFilter] = React.useState('Semua')
  const [bookSubjekFilter, setBookSubjekFilter] = React.useState('Semua')
  const [bookBahasaFilter, setBookBahasaFilter] = React.useState('Semua')
  const [bookSort, setBookSort] = React.useState<BookSort>(DEFAULT_BOOK_SORT)
  const [bookPage, setBookPage] = React.useState(1)
  const [bookPageSize, setBookPageSize] = React.useState(10)
  const [previewBook, setPreviewBook] = React.useState<Book | null>(null)
  const [detailGroup, setDetailGroup] = React.useState<Book[] | null>(null)
  const [detailIndex, setDetailIndex] = React.useState(0)
  const [bookToDelete, setBookToDelete] = React.useState<Book | null>(null)
  const [deletingBook, setDeletingBook] = React.useState(false)
  const [bookToMarkLost, setBookToMarkLost] = React.useState<Book | null>(null)
  const [markingLost, setMarkingLost] = React.useState(false)
  const [selectedGroupKeys, setSelectedGroupKeys] = React.useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false)
  const [bulkDeleting, setBulkDeleting] = React.useState(false)
  const [importModalOpen, setImportModalOpen] = React.useState(false)

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

  /**
   * Refresh buku & aktivitas setelah aksi pinjam/kembali, tanpa lewat `load()` — `load()` men-set
   * `loading=true` yang membuat seluruh halaman (termasuk PeminjamanTab) unmount sesaat, sehingga
   * banner sukses & state form di tab Peminjaman hilang sebelum sempat terlihat.
   */
  async function refreshAfterCirculation() {
    if (!library) return
    try {
      setActivity(await api.getActivityLog())
    } catch {
      // Diamkan; Riwayat/Aktivitas Terkini tetap menampilkan data lama dan bisa dicoba lagi nanti.
    }
    await loadBooks(library.id)
  }

  React.useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  React.useEffect(() => {
    setBookPage(1)
    setSelectedGroupKeys(new Set())
  }, [bookSearch, bookKondisiFilter, bookKlasifikasiFilter, bookSubjekFilter, bookBahasaFilter, bookSort, bookPageSize])

  async function handleUpdate(payload: {
    nama: string
    lokasi: string
    status: LibraryStatus
    tipe: LibraryType
    jam_operasional: string
    kepala_unit: string
    foto_url: string
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

  async function handleMarkBookLost() {
    if (!bookToMarkLost) return
    setMarkingLost(true)
    try {
      await api.updateBookStatus(bookToMarkLost.id, 'hilang')
      setBookToMarkLost(null)
      await load()
    } finally {
      setMarkingLost(false)
    }
  }

  async function handleMarkBookFound(book: Book) {
    await api.updateBookStatus(book.id, 'tersedia')
    await load()
  }

  function toggleGroupSelected(key: string) {
    setSelectedGroupKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleSelectAllOnPage(groups: Book[][]) {
    setSelectedGroupKeys((prev) => {
      const next = new Set(prev)
      const allSelected = groups.length > 0 && groups.every((g) => next.has(groupKey(g)))
      groups.forEach((g) => {
        if (allSelected) next.delete(groupKey(g))
        else next.add(groupKey(g))
      })
      return next
    })
  }

  async function handleBulkDeleteBooks(selectedGroups: Book[][]) {
    setBulkDeleting(true)
    try {
      const ids = selectedGroups.flatMap((group) => group.map((b) => b.id))
      await Promise.all(ids.map((id) => api.deleteBook(id)))
      setSelectedGroupKeys(new Set())
      setBulkDeleteOpen(false)
      await load()
    } finally {
      setBulkDeleting(false)
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
  const dipinjamCount = books.filter((b) => b.status === 'dipinjam').reduce((sum, b) => sum + b.jumlah, 0)
  const dipinjamPct = totalBuku > 0 ? Math.round((dipinjamCount / totalBuku) * 100) : 0
  const lostCount = books.filter((b) => b.status === 'hilang').reduce((sum, b) => sum + b.jumlah, 0)
  const lostPct = totalBuku > 0 ? Math.round((lostCount / totalBuku) * 100) : 0

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

  const usedKlasifikasi = Array.from(new Set(books.map((b) => b.kode_klasifikasi).filter(Boolean)))
  const usedSubjek = distinctValues(books.map((b) => b.subjek))
  const usedBahasa = distinctValues(books.map((b) => b.bahasa))

  const bookSearchLower = bookSearch.trim().toLowerCase()
  const filteredBooks = books.filter((book) => {
    if (bookKondisiFilter !== 'Semua' && book.kondisi !== bookKondisiFilter) return false
    if (bookKlasifikasiFilter !== 'Semua' && book.kode_klasifikasi !== bookKlasifikasiFilter) return false
    if (bookSubjekFilter !== 'Semua' && book.subjek !== bookSubjekFilter) return false
    if (bookBahasaFilter !== 'Semua' && book.bahasa !== bookBahasaFilter) return false
    if (bookSearchLower) {
      const haystack = `${book.judul} ${book.penulis} ${book.isbn} ${book.penerbit} ${book.nomor_inventaris}`.toLowerCase()
      if (!haystack.includes(bookSearchLower)) return false
    }
    return true
  })
  const bookFiltersActive =
    bookSearchLower !== '' ||
    bookKondisiFilter !== 'Semua' ||
    bookKlasifikasiFilter !== 'Semua' ||
    bookSubjekFilter !== 'Semua' ||
    bookBahasaFilter !== 'Semua'
  const bookFilterSortActiveCount =
    (bookKondisiFilter !== 'Semua' ? 1 : 0) +
    (bookKlasifikasiFilter !== 'Semua' ? 1 : 0) +
    (bookSubjekFilter !== 'Semua' ? 1 : 0) +
    (bookBahasaFilter !== 'Semua' ? 1 : 0) +
    (bookSort !== DEFAULT_BOOK_SORT ? 1 : 0)

  const groupedBookRows = sortBookGroups(groupBooksByIdentity(filteredBooks), bookSort)
  const totalGroupCount = groupBooksByIdentity(books).length

  const totalBookPages = Math.max(1, Math.ceil(groupedBookRows.length / bookPageSize))
  const currentBookPage = Math.min(bookPage, totalBookPages)
  const bookPageStart = (currentBookPage - 1) * bookPageSize
  const pagedBookRows = groupedBookRows.slice(bookPageStart, bookPageStart + bookPageSize)
  const selectedGroups = groupedBookRows.filter((g) => selectedGroupKeys.has(groupKey(g)))
  const selectedBookCount = selectedGroups.reduce((sum, g) => sum + g.length, 0)
  const allOnPageSelected =
    pagedBookRows.length > 0 && pagedBookRows.every((g) => selectedGroupKeys.has(groupKey(g)))

  const libraryActivity = activity.filter((log) =>
    `${log.aksi} ${log.detail}`.toLowerCase().includes(library.nama.toLowerCase()),
  )
  const relatedActivity = libraryActivity.slice(0, 5)
  const activityRows = relatedActivity.length > 0 ? relatedActivity : activity.slice(0, 5)

  const riwayatAksiChoices = Array.from(new Set(libraryActivity.map((log) => log.aksi))).sort()
  const riwayatFiltered = libraryActivity
    .filter((log) => riwayatAksiFilter === 'Semua' || log.aksi === riwayatAksiFilter)
    .filter((log) => riwayatPeriod === 'Semua' || isWithinPeriod(log.created_at, riwayatPeriod))
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return riwayatSort === 'terbaru' ? -diff : diff
    })
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
              <Pencil size={16} /> Ubah Detail
            </button>
            <button
              onClick={() => {
                setTab('list-buku')
                setImportModalOpen(true)
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Upload size={16} /> Import Excel
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
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-600">
                    <BookMarked size={18} />
                  </div>
                  <span className="text-xs font-semibold text-amber-600">{dipinjamPct}%</span>
                </div>
                <p className="text-sm text-slate-500">Buku Dipinjam</p>
                <p className="text-2xl font-bold text-slate-900">{dipinjamCount.toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-100 text-rose-600">
                    <AlertTriangle size={18} />
                  </div>
                  <span className="text-xs font-semibold text-rose-600">{damagedPct}%</span>
                </div>
                <p className="text-sm text-slate-500">Buku Rusak</p>
                <p className="text-2xl font-bold text-slate-900">{damagedCount.toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-200 text-slate-600">
                    <PackageX size={18} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{lostPct}%</span>
                </div>
                <p className="text-sm text-slate-500">Buku Hilang</p>
                <p className="text-2xl font-bold text-slate-900">{lostCount.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
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
                  <img
                    src={library.foto_url || FACILITY_IMAGE}
                    alt={buildingLabel}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wide">Lokasi Perpustakaan</p>
                    <p className="text-lg font-bold leading-tight">{buildingLabel}</p>
                  </div>
                </div>
                <div className="space-y-4 p-5">
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
                  <div className="flex items-start gap-3">
                    <User size={18} className="mt-0.5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Kepala Unit</p>
                      <p className="text-sm text-slate-500">{library.kepala_unit}</p>
                    </div>
                  </div>
                  <ExportReportMenu library={library} books={books} />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="font-bold text-slate-900">Aktivitas Terkini</h3>
                  <p className="text-xs text-slate-400">Perubahan koleksi buku terbaru di unit ini</p>
                </div>
                <button
                  onClick={() => setTab('riwayat')}
                  className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900"
                >
                  Lihat Semua <ChevronRight size={14} />
                </button>
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
                  {activityRows.map((log) => {
                    const meta = activityMeta(log.aksi)
                    const Icon = meta.icon
                    return (
                      <tr key={log.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                        <td
                          className="whitespace-nowrap px-6 py-3 text-sm text-slate-500"
                          title={formatDateTime(log.created_at)}
                        >
                          {timeAgo(log.created_at)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${meta.badge}`}>
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800">{log.aksi}</p>
                              <p className="max-w-xs truncate text-xs text-slate-400" title={log.detail}>
                                {log.detail}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                              {initials(log.pelaku)}
                            </span>
                            <span className="whitespace-nowrap text-sm text-slate-600">{log.pelaku}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Berhasil
                          </span>
                        </td>
                      </tr>
                    )
                  })}
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
              {selectedGroups.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600">
                    {selectedGroups.length} judul ({selectedBookCount} eksemplar) dipilih
                  </span>
                  <button
                    onClick={() => setBulkDeleteOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 size={16} /> Hapus Terpilih
                  </button>
                  <button
                    onClick={() => setSelectedGroupKeys(new Set())}
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
                  >
                    <X size={16} /> Batal
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
              <div className="relative min-w-[200px] flex-1">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Cari judul, penulis, ISBN, penerbit, no. inventaris..."
                  className="h-10 w-full rounded-full border border-slate-300 bg-white pl-10 pr-3 text-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
                />
              </div>
              <BookFilterSortMenu
                kondisiFilter={bookKondisiFilter}
                onKondisiChange={setBookKondisiFilter}
                klasifikasiFilter={bookKlasifikasiFilter}
                onKlasifikasiChange={setBookKlasifikasiFilter}
                klasifikasiChoices={usedKlasifikasi}
                subjekFilter={bookSubjekFilter}
                onSubjekChange={setBookSubjekFilter}
                subjekChoices={usedSubjek}
                bahasaFilter={bookBahasaFilter}
                onBahasaChange={setBookBahasaFilter}
                bahasaChoices={usedBahasa}
                sort={bookSort}
                onSortChange={setBookSort}
                activeCount={bookFilterSortActiveCount}
                onReset={() => {
                  setBookKondisiFilter('Semua')
                  setBookKlasifikasiFilter('Semua')
                  setBookSubjekFilter('Semua')
                  setBookBahasaFilter('Semua')
                  setBookSort(DEFAULT_BOOK_SORT)
                }}
              />
              {(bookFiltersActive || bookSort !== DEFAULT_BOOK_SORT) && (
                <button
                  onClick={() => {
                    setBookSearch('')
                    setBookKondisiFilter('Semua')
                    setBookKlasifikasiFilter('Semua')
                    setBookSubjekFilter('Semua')
                    setBookBahasaFilter('Semua')
                    setBookSort(DEFAULT_BOOK_SORT)
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
            <div className="h-[600px] overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={() => toggleSelectAllOnPage(pagedBookRows)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-700/40"
                        aria-label="Pilih semua buku di halaman ini"
                      />
                    </th>
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
                    <th className="px-6 py-3">Stok</th>
                    <th className="px-6 py-3">No. Inventaris</th>
                    <th className="px-6 py-3">No. Panggil</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBookRows.map((group) => {
                    const book = group[0]
                    const kondisiCounts = group.reduce<Record<string, number>>((acc, b) => {
                      acc[b.kondisi] = (acc[b.kondisi] || 0) + 1
                      return acc
                    }, {})
                    const kondisiKeys = Object.keys(kondisiCounts)
                    const stokTersedia = group.filter((b) => b.status === 'tersedia').length
                    return (
                      <tr
                        key={book.batch_id || book.id}
                        onClick={() => {
                          setDetailGroup(group)
                          setDetailIndex(0)
                        }}
                        className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedGroupKeys.has(groupKey(group))}
                            onChange={() => toggleGroupSelected(groupKey(group))}
                            className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-700/40"
                            aria-label={`Pilih ${book.judul}`}
                          />
                        </td>
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
                        <td className="px-6 py-3 text-sm">
                          <span className={stokTersedia === 0 ? 'font-semibold text-rose-600' : 'font-semibold text-slate-700'}>
                            {stokTersedia}
                          </span>
                          <span className="text-slate-400"> / {group.length}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {group.length <= 2 ? (
                            <div className="space-y-0.5">
                              {group.map((b) => (
                                <div key={b.id}>{b.nomor_inventaris || '-'}</div>
                              ))}
                            </div>
                          ) : (
                            <InventoryNumbersPopover
                              judul={book.judul}
                              penulis={book.penulis}
                              books={group}
                              onSelect={(selected) => {
                                setDetailGroup(group)
                                setDetailIndex(group.findIndex((b) => b.id === selected.id))
                              }}
                            />
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm font-mono text-slate-600">
                          {generateCallNumber(book.kode_klasifikasi, book.penulis, book.judul)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            )}

            {groupedBookRows.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Tampilkan</span>
                  <select
                    value={bookPageSize}
                    onChange={(e) => setBookPageSize(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-600 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>data</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>
                    Menampilkan {bookPageStart + 1}-{Math.min(bookPageStart + bookPageSize, groupedBookRows.length)}{' '}
                    dari {groupedBookRows.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBookPage((p) => Math.max(1, p - 1))}
                      disabled={currentBookPage <= 1}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Halaman sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-800 text-sm font-semibold text-white">
                      {currentBookPage}
                    </span>
                    <button
                      type="button"
                      onClick={() => setBookPage((p) => Math.min(totalBookPages, p + 1))}
                      disabled={currentBookPage >= totalBookPages}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Halaman berikutnya"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'peminjaman' && (
          <PeminjamanTab libraryId={library.id} books={books} onChanged={refreshAfterCirculation} />
        )}

        {tab === 'riwayat' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-1.5">
                {RIWAYAT_PERIOD_FILTERS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setRiwayatPeriod(period)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      riwayatPeriod === period
                        ? 'bg-sky-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={riwayatAksiFilter}
                  onChange={(e) => setRiwayatAksiFilter(e.target.value)}
                  aria-label="Filter jenis aktivitas"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-600 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                >
                  <option value="Semua">Semua Aktivitas</option>
                  {riwayatAksiChoices.map((aksi) => (
                    <option key={aksi} value={aksi}>
                      {aksi}
                    </option>
                  ))}
                </select>
                <select
                  value={riwayatSort}
                  onChange={(e) => setRiwayatSort(e.target.value as RiwayatSort)}
                  aria-label="Urutkan riwayat"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-600 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                >
                  <option value="terbaru">Terbaru Dahulu</option>
                  <option value="terlama">Terlama Dahulu</option>
                </select>
              </div>
            </div>

            {riwayatFiltered.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
                {libraryActivity.length === 0
                  ? 'Belum ada aktivitas tercatat.'
                  : 'Tidak ada aktivitas yang cocok dengan filter ini.'}
              </div>
            )}

            {riwayatFiltered.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <ul>
                  {riwayatFiltered.map((log) => {
                    const meta = activityMeta(log.aksi)
                    const Icon = meta.icon
                    return (
                      <li key={log.id} className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0">
                        <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.badge}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800">{log.aksi}</p>
                          <p className="text-sm text-slate-500">{log.detail}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                              {initials(log.pelaku)}
                            </span>
                            {log.pelaku} · {formatDateTime(log.created_at)}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
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
          existingNumbers={books.map((b) => b.nomor_inventaris)}
          existingPenulis={distinctValues(books.map((b) => b.penulis))}
          existingPenerbit={distinctValues(books.map((b) => b.penerbit))}
          existingSubjek={distinctValues(books.map((b) => b.subjek))}
          existingBahasa={distinctValues(books.map((b) => b.bahasa))}
          existingBooks={books}
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
          onMarkLost={(book) => {
            setDetailGroup(null)
            setBookToMarkLost(book)
          }}
          onMarkFound={(book) => {
            setDetailGroup(null)
            handleMarkBookFound(book)
          }}
        />
      )}

      {bookToMarkLost && (
        <ConfirmDialog
          title="Tandai buku ini hilang?"
          message={`Buku "${bookToMarkLost.judul}" (No. Inv ${bookToMarkLost.nomor_inventaris}) akan ditandai hilang dan tidak bisa dipinjamkan sampai ditemukan kembali.`}
          confirmLabel="Ya, Tandai Hilang"
          loading={markingLost}
          onConfirm={handleMarkBookLost}
          onCancel={() => setBookToMarkLost(null)}
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

      {bulkDeleteOpen && (
        <ConfirmDialog
          title="Hapus buku terpilih?"
          message={`${selectedGroups.length} judul (${selectedBookCount} eksemplar) akan dihapus permanen dari koleksi buku.`}
          confirmLabel="Ya, Hapus"
          loading={bulkDeleting}
          onConfirm={() => handleBulkDeleteBooks(selectedGroups)}
          onCancel={() => setBulkDeleteOpen(false)}
        />
      )}

      {importModalOpen && (
        <ImportBooksModal
          libraryId={library.id}
          onClose={() => setImportModalOpen(false)}
          onImported={load}
        />
      )}
    </DashboardLayout>
  )
}
