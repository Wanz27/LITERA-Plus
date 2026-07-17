import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  BookOpen,
  Eye,
  ZoomIn,
  Search,
} from 'lucide-react'
import DashboardLayout from '../layout/DashboardLayout'
import CoverPreviewModal from '../components/CoverPreviewModal'
import InventoryNumbersPopover from '../components/InventoryNumbersPopover'
import BookDetailModal from '../components/BookDetailModal'
import BookFilterSortMenu from '../components/BookFilterSortMenu'
import * as api from '../lib/api'
import type { Book, BookKondisi, Library } from '../lib/api'
import { typeIcon, StatusBadge } from '../lib/libraryUi'
import {
  generateCallNumber,
  groupBooksByIdentity,
  distinctValues,
  sortBookGroups,
  DEFAULT_BOOK_SORT,
  type BookSort,
} from '../lib/bookUi'

export default function CatalogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [library, setLibrary] = React.useState<Library | null>(null)
  const [books, setBooks] = React.useState<Book[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')
  const [kondisiFilter, setKondisiFilter] = React.useState<'Semua' | BookKondisi>('Semua')
  const [klasifikasiFilter, setKlasifikasiFilter] = React.useState('Semua')
  const [subjekFilter, setSubjekFilter] = React.useState('Semua')
  const [bahasaFilter, setBahasaFilter] = React.useState('Semua')
  const [sort, setSort] = React.useState<BookSort>(DEFAULT_BOOK_SORT)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [previewBook, setPreviewBook] = React.useState<Book | null>(null)
  const [detailGroup, setDetailGroup] = React.useState<Book[] | null>(null)
  const [detailIndex, setDetailIndex] = React.useState(0)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const libraries = await api.getLibraries()
        const found = libraries.find((l) => l.id === id) ?? null
        setLibrary(found)
        if (found) setBooks(await api.getBooks(found.id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat katalog buku.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  React.useEffect(() => {
    setPage(1)
  }, [search, kondisiFilter, klasifikasiFilter, subjekFilter, bahasaFilter, sort, pageSize])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-sm text-slate-400">Memuat katalog buku...</div>
      </DashboardLayout>
    )
  }

  if (error || !library) {
    return (
      <DashboardLayout>
        <div className="mx-auto w-full max-w-7xl p-8">
          <Link to="/katalog" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sky-700">
            <ChevronLeft size={16} /> Kembali ke Daftar
          </Link>
          <p className="mt-6 text-sm text-rose-600">{error || 'Perpustakaan tidak ditemukan.'}</p>
        </div>
      </DashboardLayout>
    )
  }

  const Icon = typeIcon[library.tipe]

  const usedKlasifikasi = Array.from(new Set(books.map((b) => b.kode_klasifikasi).filter(Boolean)))
  const usedSubjek = distinctValues(books.map((b) => b.subjek))
  const usedBahasa = distinctValues(books.map((b) => b.bahasa))

  const searchLower = search.trim().toLowerCase()
  const filteredBooks = books.filter((book) => {
    if (kondisiFilter !== 'Semua' && book.kondisi !== kondisiFilter) return false
    if (klasifikasiFilter !== 'Semua' && book.kode_klasifikasi !== klasifikasiFilter) return false
    if (subjekFilter !== 'Semua' && book.subjek !== subjekFilter) return false
    if (bahasaFilter !== 'Semua' && book.bahasa !== bahasaFilter) return false
    if (searchLower) {
      const haystack = `${book.judul} ${book.penulis} ${book.isbn} ${book.penerbit}`.toLowerCase()
      if (!haystack.includes(searchLower)) return false
    }
    return true
  })
  const filtersActive =
    searchLower !== '' ||
    kondisiFilter !== 'Semua' ||
    klasifikasiFilter !== 'Semua' ||
    subjekFilter !== 'Semua' ||
    bahasaFilter !== 'Semua'
  const filterSortActiveCount =
    (kondisiFilter !== 'Semua' ? 1 : 0) +
    (klasifikasiFilter !== 'Semua' ? 1 : 0) +
    (subjekFilter !== 'Semua' ? 1 : 0) +
    (bahasaFilter !== 'Semua' ? 1 : 0) +
    (sort !== DEFAULT_BOOK_SORT ? 1 : 0)

  const groupedRows = sortBookGroups(groupBooksByIdentity(filteredBooks), sort)
  const totalGroupCount = groupBooksByIdentity(books).length

  const totalPages = Math.max(1, Math.ceil(groupedRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const pagedRows = groupedRows.slice(pageStart, pageStart + pageSize)

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate('/katalog')}
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
        </div>

        {books.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-sky-100 text-sky-800">
              <Icon size={22} />
            </div>
            <p className="font-semibold text-slate-800">Belum ada data buku untuk perpustakaan ini.</p>
          </div>
        )}

        {books.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
              <h3 className="font-bold text-slate-900">
                Koleksi Buku ({groupedRows.length}
                {filtersActive ? ` dari ${totalGroupCount}` : ''})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
              <div className="relative min-w-[200px] flex-1">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul, penulis, ISBN..."
                  className="h-10 w-full rounded-full border border-slate-300 bg-white pl-10 pr-3 text-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
                />
              </div>
              <BookFilterSortMenu
                kondisiFilter={kondisiFilter}
                onKondisiChange={setKondisiFilter}
                klasifikasiFilter={klasifikasiFilter}
                onKlasifikasiChange={setKlasifikasiFilter}
                klasifikasiChoices={usedKlasifikasi}
                subjekFilter={subjekFilter}
                onSubjekChange={setSubjekFilter}
                subjekChoices={usedSubjek}
                bahasaFilter={bahasaFilter}
                onBahasaChange={setBahasaFilter}
                bahasaChoices={usedBahasa}
                sort={sort}
                onSortChange={setSort}
                activeCount={filterSortActiveCount}
                onReset={() => {
                  setKondisiFilter('Semua')
                  setKlasifikasiFilter('Semua')
                  setSubjekFilter('Semua')
                  setBahasaFilter('Semua')
                  setSort(DEFAULT_BOOK_SORT)
                }}
              />
              {(filtersActive || sort !== DEFAULT_BOOK_SORT) && (
                <button
                  onClick={() => {
                    setSearch('')
                    setKondisiFilter('Semua')
                    setKlasifikasiFilter('Semua')
                    setSubjekFilter('Semua')
                    setBahasaFilter('Semua')
                    setSort(DEFAULT_BOOK_SORT)
                  }}
                  className="text-sm font-semibold text-sky-700 hover:text-sky-900"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {groupedRows.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">
                Tidak ada buku yang cocok dengan filter.
              </p>
            )}

            {groupedRows.length > 0 && (
              <div className="h-[600px] overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                    {pagedRows.map((group) => {
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

            {groupedRows.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Tampilkan</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
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
                    Menampilkan {pageStart + 1}-{Math.min(pageStart + pageSize, groupedRows.length)} dari{' '}
                    {groupedRows.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Halaman sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-800 text-sm font-semibold text-white">
                      {currentPage}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
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
      </div>

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
        />
      )}
    </DashboardLayout>
  )
}
