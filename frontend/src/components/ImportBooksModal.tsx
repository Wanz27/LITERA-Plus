import * as React from 'react'
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react'
import * as api from '../lib/api'
import { parseBookImportFile, type ParsedBookRow } from '../lib/bookImport'
import { downloadImportTemplate } from '../lib/exportReport'

interface Props {
  libraryId: string
  onClose: () => void
  onImported: () => Promise<void> | void
}

export default function ImportBooksModal({ libraryId, onClose, onImported }: Props) {
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<ParsedBookRow[] | null>(null)
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [parsing, setParsing] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [importError, setImportError] = React.useState<string | null>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleFile(file: File) {
    setParseError(null)
    setImportError(null)
    setRows(null)
    setFileName(file.name)
    setParsing(true)
    try {
      const parsed = await parseBookImportFile(file)
      setRows(parsed)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Gagal membaca file Excel.')
    } finally {
      setParsing(false)
    }
  }

  function reset() {
    setFileName(null)
    setRows(null)
    setParseError(null)
    setImportError(null)
  }

  const validRows = rows?.filter((r) => !r.error) ?? []
  const invalidCount = (rows?.length ?? 0) - validRows.length

  async function handleImport() {
    if (validRows.length === 0) return
    setImporting(true)
    setImportError(null)
    try {
      await api.importBooks(
        libraryId,
        validRows.map((r) => ({
          judul: r.judul,
          penulis: r.penulis,
          penerbit: r.penerbit,
          tahun_terbit: r.tahun_terbit,
          isbn: r.isbn,
          kode_klasifikasi: r.kode_klasifikasi,
          kondisi: r.kondisi,
          subjek: r.subjek,
          bahasa: r.bahasa,
          jumlah: r.jumlah,
          nomor_inventaris: r.nomor_inventaris,
        })),
      )
      await onImported()
      onClose()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Gagal mengimpor data buku.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <p className="text-sm font-bold text-slate-900">Import Buku dari Excel</p>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {!rows && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragActive(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) handleFile(file)
                }}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
                  dragActive ? 'border-sky-500 bg-sky-50' : 'border-sky-200 bg-sky-50/40 hover:bg-sky-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                    e.target.value = ''
                  }}
                />
                {parsing ? (
                  <p className="text-sm font-semibold text-slate-600">Membaca file...</p>
                ) : (
                  <>
                    <Upload className="mx-auto mb-2 text-slate-400" size={26} />
                    <p className="text-sm font-semibold text-slate-700">Klik atau drag &amp; drop file Excel</p>
                    <p className="text-xs text-slate-400">.xlsx atau .xls</p>
                  </>
                )}
              </div>

              {parseError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
                  {fileName && <p className="mb-1 font-semibold">{fileName}</p>}
                  {parseError}
                </div>
              )}

              <button
                type="button"
                onClick={() => downloadImportTemplate()}
                className="flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900"
              >
                <Download size={16} /> Download Template Excel
              </button>
            </div>
          )}

          {rows && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                  <FileSpreadsheet size={16} className="text-emerald-600" /> {fileName}
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <CheckCircle2 size={14} /> {validRows.length} valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1.5 font-semibold text-rose-600">
                      <AlertCircle size={14} /> {invalidCount} bermasalah
                    </span>
                  )}
                  <button type="button" onClick={reset} className="font-semibold text-sky-700 hover:underline">
                    Ganti File
                  </button>
                </div>
              </div>

              <div className="overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="sticky top-0 z-10 bg-slate-100 font-semibold uppercase tracking-wide text-slate-500">
                      <th className="whitespace-nowrap px-3 py-2">Baris</th>
                      <th className="whitespace-nowrap px-3 py-2">Judul</th>
                      <th className="whitespace-nowrap px-3 py-2">Penulis</th>
                      <th className="whitespace-nowrap px-3 py-2">Penerbit</th>
                      <th className="whitespace-nowrap px-3 py-2">Tahun</th>
                      <th className="whitespace-nowrap px-3 py-2">Kondisi</th>
                      <th className="whitespace-nowrap px-3 py-2">Jumlah</th>
                      <th className="whitespace-nowrap px-3 py-2">No. Inventaris</th>
                      <th className="whitespace-nowrap px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowNumber} className={`border-t border-slate-100 ${row.error ? 'bg-rose-50/60' : ''}`}>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{row.rowNumber}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">{row.judul || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.penulis || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.penerbit || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.tahun_terbit || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.kondisi}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.jumlah}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.nomor_inventaris || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {row.error ? (
                            <span className="text-rose-600">{row.error}</span>
                          ) : (
                            <span className="text-emerald-600">Siap diimpor</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
                  {importError}
                </div>
              )}
            </div>
          )}
        </div>

        {rows && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={validRows.length === 0 || importing}
              className="rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-900 disabled:bg-slate-300"
            >
              {importing ? 'Mengimpor...' : `Impor ${validRows.length} Buku`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
