import * as React from 'react'
import { X, BookOpen, Pencil, Trash2, ChevronLeft, ChevronRight, ZoomIn, PackageX, PackageCheck } from 'lucide-react'
import type { Book } from '../lib/api'
import { klasifikasiLabel, generateCallNumber } from '../lib/bookUi'
import CoverPreviewModal from './CoverPreviewModal'

interface Props {
  books: Book[]
  initialIndex?: number
  onClose: () => void
  onEdit?: (book: Book) => void
  onDelete?: (book: Book) => void
  onMarkLost?: (book: Book) => void
  onMarkFound?: (book: Book) => void
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || '-'}</p>
    </div>
  )
}

export default function BookDetailModal({ books, initialIndex = 0, onClose, onEdit, onDelete, onMarkLost, onMarkFound }: Props) {
  const [index, setIndex] = React.useState(() => Math.min(Math.max(initialIndex, 0), books.length - 1))
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const hasMultiple = books.length > 1
  const book = books[index]

  const goPrev = React.useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goNext = React.useCallback(() => setIndex((i) => Math.min(books.length - 1, i + 1)), [books.length])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (previewOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, goPrev, goNext, previewOpen])

  if (!book) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-900">{book.judul}</p>
            <p className="truncate text-sm text-slate-500">{book.penulis || '-'}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {hasMultiple && (
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-2.5">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Eksemplar sebelumnya"
            >
              <ChevronLeft size={16} /> Sebelumnya
            </button>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Eksemplar {index + 1} dari {books.length}
            </p>
            <button
              onClick={goNext}
              disabled={index === books.length - 1}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Eksemplar berikutnya"
            >
              Berikutnya <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="flex flex-1 gap-5 overflow-y-auto p-5">
          <div className="shrink-0">
            {book.cover_url ? (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="group relative block h-40 w-28 overflow-hidden rounded-lg shadow-sm"
                aria-label={`Lihat cover ${book.judul}`}
              >
                <img
                  src={book.cover_url}
                  alt={book.judul}
                  className="h-full w-full object-cover transition group-hover:brightness-75"
                />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                  <ZoomIn size={20} className="text-white drop-shadow" />
                </span>
              </button>
            ) : (
              <div className="grid h-40 w-28 place-items-center rounded-lg bg-slate-100 text-slate-300">
                <BookOpen size={28} />
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                  book.kondisi === 'Rusak' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {book.kondisi}
              </span>
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                  book.status === 'dipinjam'
                    ? 'bg-amber-100 text-amber-700'
                    : book.status === 'hilang'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {book.status === 'dipinjam' ? 'Dipinjam' : book.status === 'hilang' ? 'Hilang' : 'Tersedia'}
              </span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4">
            <Field label="Penerbit" value={book.penerbit} />
            <Field label="Tahun Terbit" value={book.tahun_terbit} />
            <Field label="ISBN" value={book.isbn} />
            <Field label="Klasifikasi" value={book.kode_klasifikasi ? klasifikasiLabel(book.kode_klasifikasi) : ''} />
            <Field label="Subjek" value={book.subjek} />
            <Field label="Bahasa" value={book.bahasa} />
            <Field label="No. Inventaris" value={book.nomor_inventaris} />
            <Field
              label="No. Panggil"
              value={
                <span className="font-mono">
                  {generateCallNumber(book.kode_klasifikasi, book.penulis, book.judul)}
                </span>
              }
            />
            <Field label="Jumlah Halaman" value={book.jumlah_halaman} />
            <Field label="Ukuran Buku" value={book.ukuran_buku} />
            <Field label="Ilustrasi" value={book.ilustrasi} />
            {book.created_at && (
              <Field label="Ditambahkan" value={new Date(book.created_at).toLocaleDateString('id-ID')} />
            )}
          </div>
        </div>

        {(onEdit || onDelete || onMarkLost || onMarkFound) && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
            {onMarkLost && book.status === 'tersedia' && (
              <button
                onClick={() => onMarkLost(book)}
                className="flex items-center gap-2 rounded-lg border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
              >
                <PackageX size={16} /> Tandai Hilang
              </button>
            )}
            {onMarkFound && book.status === 'hilang' && (
              <button
                onClick={() => onMarkFound(book)}
                className="flex items-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                <PackageCheck size={16} /> Tandai Ditemukan
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(book)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={16} /> Edit Buku
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(book)}
                className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={16} /> Hapus Buku
              </button>
            )}
          </div>
        )}
      </div>

      {previewOpen && book.cover_url && (
        <CoverPreviewModal
          coverUrl={book.cover_url}
          title={book.judul}
          subtitle={book.penulis}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
}
