import * as React from 'react'
import { X, BookOpen, Pencil, Trash2 } from 'lucide-react'
import type { Book } from '../lib/api'
import { klasifikasiLabel, generateCallNumber } from '../lib/bookUi'

interface Props {
  book: Book
  onClose: () => void
  onEdit: (book: Book) => void
  onDelete: (book: Book) => void
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || '-'}</p>
    </div>
  )
}

export default function BookDetailModal({ book, onClose, onEdit, onDelete }: Props) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

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

        <div className="flex flex-1 gap-5 overflow-y-auto p-5">
          <div className="shrink-0">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.judul}
                className="h-40 w-28 rounded-lg object-cover shadow-sm"
              />
            ) : (
              <div className="grid h-40 w-28 place-items-center rounded-lg bg-slate-100 text-slate-300">
                <BookOpen size={28} />
              </div>
            )}
            <span
              className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                book.kondisi === 'Rusak' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {book.kondisi}
            </span>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4">
            <Field label="Penerbit" value={book.penerbit} />
            <Field label="Tahun Terbit" value={book.tahun_terbit} />
            <Field label="ISBN" value={book.isbn} />
            <Field label="Klasifikasi" value={book.kode_klasifikasi ? klasifikasiLabel(book.kode_klasifikasi) : ''} />
            <Field label="Subjek" value={book.subjek} />
            <Field label="Bahasa" value={book.bahasa} />
            <Field label="Jumlah" value={book.jumlah} />
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

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
          <button
            onClick={() => onEdit(book)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={16} /> Edit Buku
          </button>
          <button
            onClick={() => onDelete(book)}
            className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={16} /> Hapus Buku
          </button>
        </div>
      </div>
    </div>
  )
}
