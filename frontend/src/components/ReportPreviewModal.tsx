import * as React from 'react'
import { X, FileSpreadsheet, FileText } from 'lucide-react'
import type { Book, Library } from '../lib/api'
import { REPORT_COLUMNS, bookRows, reportSummary, exportBooksToExcel, exportBooksToPdf } from '../lib/exportReport'

interface Props {
  library: Library
  books: Book[]
  onClose: () => void
}

export default function ReportPreviewModal({ library, books, onClose }: Props) {
  const { fields } = reportSummary(library, books)
  const rows = bookRows(books)

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
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <p className="text-sm font-bold text-slate-900">Preview Laporan Unit</p>
            <p className="text-xs text-slate-500">{library.nama}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="mb-4 grid grid-cols-1 gap-x-8 gap-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 sm:justify-start">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>

          <div className="overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="sticky top-0 z-10 bg-slate-100 font-semibold uppercase tracking-wide text-slate-500">
                  {REPORT_COLUMNS.map((col) => (
                    <th key={col} className="whitespace-nowrap px-3 py-2">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={REPORT_COLUMNS.length} className="px-3 py-8 text-center text-slate-400">
                      Belum ada data buku untuk ditampilkan.
                    </td>
                  </tr>
                )}
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {row.map((cell, j) => (
                      <td key={j} className="whitespace-nowrap px-3 py-2 text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-5 py-3.5">
          <button
            type="button"
            onClick={() => exportBooksToExcel(library, books)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" /> Download Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => exportBooksToPdf(library, books)}
            className="flex items-center gap-2 rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-900"
          >
            <FileText size={16} /> Download PDF (.pdf)
          </button>
        </div>
      </div>
    </div>
  )
}
