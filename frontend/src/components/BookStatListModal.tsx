import * as React from 'react'
import { X, BookOpen, PackageCheck } from 'lucide-react'
import type { Book } from '../lib/api'

interface Props {
  title: string
  books: Book[]
  onClose: () => void
  onSelectBook: (book: Book) => void
  onMarkFound?: (book: Book) => void
}

export default function BookStatListModal({ title, books, onClose, onSelectBook, onMarkFound }: Props) {
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
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-base font-bold text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">{books.length.toLocaleString('id-ID')} eksemplar</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {books.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">Tidak ada buku untuk ditampilkan.</p>
          ) : (
            <ul>
              {books.map((book) => (
                <li key={book.id} className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onSelectBook(book)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.judul}
                        className="h-12 w-9 shrink-0 rounded object-cover shadow-sm"
                      />
                    ) : (
                      <div className="grid h-12 w-9 shrink-0 place-items-center rounded bg-slate-100 text-slate-300">
                        <BookOpen size={16} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{book.judul}</p>
                      <p className="truncate text-xs text-slate-500">
                        {book.penulis} · No. Inv {book.nomor_inventaris || '-'}
                      </p>
                    </div>
                  </button>
                  {onMarkFound && (
                    <button
                      type="button"
                      onClick={() => onMarkFound(book)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      <PackageCheck size={14} /> Tandai Ditemukan
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
