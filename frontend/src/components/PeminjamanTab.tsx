import * as React from 'react'
import { BookOpen, Undo2, CheckCircle2, XCircle, ScanLine, Loader2, CalendarClock, User, Inbox } from 'lucide-react'
import * as api from '../lib/api'
import type { Book, BorrowerSuggestion, Circulation } from '../lib/api'
import ApproveRequestModal from './ApproveRequestModal'
import ConfirmDialog from './ConfirmDialog'

type Mode = 'pinjam' | 'kembali'
type Feedback = { type: 'success' | 'error'; message: string } | null

const DEFAULT_LOAN_DAYS = 7
const MAX_ACTIVE_LOANS_PER_BORROWER = 2

function defaultDueDateInput() {
  const d = new Date()
  d.setDate(d.getDate() + DEFAULT_LOAN_DAYS)
  return d.toISOString().slice(0, 10)
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

// Selisih dihitung berbasis tanggal (bukan jam) supaya "hari ini" tidak dianggap terlambat
// hanya karena jam saat ini sudah lewat dari jam saat buku dipinjamkan.
function daysUntil(dueDate: string) {
  const due = new Date(dueDate)
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const now = new Date()
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((dueMidnight.getTime() - nowMidnight.getTime()) / 86400000)
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  petugas: 'Petugas',
  visitor: 'Pengunjung',
}

function loanTimeStatus(dueDate: string | null): { label: string; className: string } {
  if (!dueDate) return { label: 'Tanpa batas waktu', className: 'bg-slate-100 text-slate-500' }
  const diff = daysUntil(dueDate)
  if (diff < 0) return { label: `Terlambat ${Math.abs(diff)} hari`, className: 'bg-rose-100 text-rose-700' }
  if (diff === 0) return { label: 'Jatuh tempo hari ini', className: 'bg-amber-100 text-amber-700' }
  if (diff <= 2) return { label: `${diff} hari lagi`, className: 'bg-amber-100 text-amber-700' }
  return { label: `${diff} hari lagi`, className: 'bg-emerald-100 text-emerald-700' }
}

interface PeminjamanTabProps {
  libraryId: string
  books: Book[]
  onChanged: () => void
}

export default function PeminjamanTab({ libraryId, books, onChanged }: PeminjamanTabProps) {
  const [mode, setMode] = React.useState<Mode>('pinjam')
  const [borrowerName, setBorrowerName] = React.useState('')
  const [borrowerNis, setBorrowerNis] = React.useState('')
  const [borrowerSuggestions, setBorrowerSuggestions] = React.useState<BorrowerSuggestion[]>([])
  const [showBorrowerSuggestions, setShowBorrowerSuggestions] = React.useState(false)
  const [borrowIsbn, setBorrowIsbn] = React.useState('')
  const [dueDate, setDueDate] = React.useState(defaultDueDateInput())
  const [selectedInventaris, setSelectedInventaris] = React.useState('')
  const [nomorInventaris, setNomorInventaris] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [feedback, setFeedback] = React.useState<Feedback>(null)
  const [loans, setLoans] = React.useState<Circulation[]>([])
  const [loansLoading, setLoansLoading] = React.useState(true)
  const [requests, setRequests] = React.useState<Circulation[]>([])
  const [requestsLoading, setRequestsLoading] = React.useState(true)
  const [requestToApprove, setRequestToApprove] = React.useState<Circulation | null>(null)
  const [requestToReject, setRequestToReject] = React.useState<Circulation | null>(null)
  const [processingRequest, setProcessingRequest] = React.useState(false)
  const isbnInputRef = React.useRef<HTMLInputElement>(null)
  const selectRef = React.useRef<HTMLSelectElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const nameInputRef = React.useRef<HTMLInputElement>(null)

  const isbnTrimmed = borrowIsbn.trim()
  const matchedByIsbn = isbnTrimmed ? books.filter((b) => b.isbn === isbnTrimmed) : []
  const availableCopies = matchedByIsbn.filter((b) => b.status === 'tersedia' && b.kondisi !== 'Rusak')

  // Batasi peminjaman aktif per orang berdasarkan data yang sudah dimuat di tabel "Sedang
  // Dipinjam", supaya form langsung memberi peringatan tanpa perlu request tambahan. Prioritas
  // pencocokan pakai NIS bila ada (lebih akurat), kalau tidak baru cocokkan nama (case-insensitive).
  const trimmedBorrowerName = borrowerName.trim()
  const trimmedBorrowerNis = borrowerNis.trim()
  const currentBorrowerLoanCount = trimmedBorrowerName
    ? loans.filter((loan) =>
        trimmedBorrowerNis
          ? loan.borrower_nis === trimmedBorrowerNis
          : !loan.borrower_nis && loan.borrower_name.trim().toLowerCase() === trimmedBorrowerName.toLowerCase(),
      ).length
    : 0
  const borrowerAtLimit = currentBorrowerLoanCount >= MAX_ACTIVE_LOANS_PER_BORROWER

  async function loadLoans() {
    setLoansLoading(true)
    try {
      setLoans(await api.getCirculations(libraryId, 'dipinjam'))
    } catch {
      // Diamkan, tabel tetap menampilkan data lama dan bisa dicoba lagi lewat aksi berikutnya.
    } finally {
      setLoansLoading(false)
    }
  }

  async function loadRequests() {
    setRequestsLoading(true)
    try {
      setRequests(await api.getCirculations(libraryId, 'menunggu'))
    } catch {
      // Diamkan, tabel tetap menampilkan data lama dan bisa dicoba lagi lewat aksi berikutnya.
    } finally {
      setRequestsLoading(false)
    }
  }

  React.useEffect(() => {
    loadLoans()
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryId])

  React.useEffect(() => {
    if (mode === 'pinjam') isbnInputRef.current?.focus()
    else inputRef.current?.focus()
  }, [mode])

  // Cari usulan nama peminjam dari riwayat peminjaman di perpustakaan ini, didebounce supaya
  // tidak mengirim request di setiap ketikan.
  React.useEffect(() => {
    const name = borrowerName.trim()
    if (mode !== 'pinjam' || name.length < 2) {
      setBorrowerSuggestions([])
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchBorrowers(libraryId, name)
        if (!cancelled) setBorrowerSuggestions(results)
      } catch {
        if (!cancelled) setBorrowerSuggestions([])
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [borrowerName, libraryId, mode])

  // Begitu ISBN cocok dengan eksemplar yang tersedia, pilih otomatis eksemplar pertama supaya
  // kasus umum (hanya 1 eksemplar) tinggal sekali klik "Pinjamkan Buku".
  React.useEffect(() => {
    const trimmed = borrowIsbn.trim()
    const available = trimmed
      ? books.filter((b) => b.isbn === trimmed && b.status === 'tersedia' && b.kondisi !== 'Rusak')
      : []
    setSelectedInventaris(available[0]?.nomor_inventaris ?? '')
  }, [borrowIsbn, books])

  function bookFor(bookId: string) {
    return books.find((b) => b.id === bookId)
  }

  function resetForNextPerson() {
    setBorrowerName('')
    setBorrowerNis('')
    setBorrowerSuggestions([])
    setShowBorrowerSuggestions(false)
    setBorrowIsbn('')
    setSelectedInventaris('')
    setDueDate(defaultDueDateInput())
    setFeedback(null)
    isbnInputRef.current?.focus()
  }

  function selectBorrowerSuggestion(suggestion: BorrowerSuggestion) {
    setBorrowerName(suggestion.borrower_name)
    setBorrowerNis(suggestion.borrower_nis || '')
    setShowBorrowerSuggestions(false)
  }

  function handleIsbnKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      selectRef.current?.focus()
    }
  }

  async function handleBorrowSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || !selectedInventaris || borrowerAtLimit) return
    setSubmitting(true)
    setFeedback(null)
    try {
      const { book } = await api.borrowBook({
        library_id: libraryId,
        nomor_inventaris: selectedInventaris,
        borrower_name: borrowerName,
        borrower_nis: borrowerNis || undefined,
        due_date: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : undefined,
      })
      setFeedback({
        type: 'success',
        message: `"${book.judul}" (No. Inv ${book.nomor_inventaris}) berhasil dipinjam oleh ${borrowerName}.`,
      })
      setBorrowIsbn('')
      setSelectedInventaris('')
      onChanged()
      await loadLoans()
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Gagal memproses peminjaman.' })
    } finally {
      setSubmitting(false)
      isbnInputRef.current?.focus()
    }
  }

  async function submitReturn(nomor: string) {
    if (submitting) return
    setSubmitting(true)
    setFeedback(null)
    try {
      const { book } = await api.returnBook({ library_id: libraryId, nomor_inventaris: nomor })
      setFeedback({ type: 'success', message: `"${book.judul}" berhasil dikembalikan.` })
      setNomorInventaris('')
      onChanged()
      await loadLoans()
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Gagal memproses pengembalian.' })
    } finally {
      setSubmitting(false)
      inputRef.current?.focus()
    }
  }

  async function handleReturnSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submitReturn(nomorInventaris)
  }

  async function handleApprove(dueDate: string) {
    if (!requestToApprove) return
    setProcessingRequest(true)
    try {
      const { book } = await api.approveCirculationRequest(requestToApprove.id, new Date(`${dueDate}T23:59:59`).toISOString())
      setFeedback({
        type: 'success',
        message: `Pengajuan peminjaman "${book.judul}" oleh ${requestToApprove.borrower_name} disetujui.`,
      })
      setRequestToApprove(null)
      onChanged()
      await Promise.all([loadLoans(), loadRequests()])
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menyetujui pengajuan.' })
    } finally {
      setProcessingRequest(false)
    }
  }

  async function handleReject() {
    if (!requestToReject) return
    setProcessingRequest(true)
    try {
      await api.rejectCirculationRequest(requestToReject.id)
      setFeedback({ type: 'success', message: `Pengajuan peminjaman oleh ${requestToReject.borrower_name} ditolak.` })
      setRequestToReject(null)
      await loadRequests()
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menolak pengajuan.' })
    } finally {
      setProcessingRequest(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('pinjam')
            setFeedback(null)
          }}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
            mode === 'pinjam' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen size={16} /> Pinjam Buku
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('kembali')
            setFeedback(null)
          }}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
            mode === 'kembali' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Undo2 size={16} /> Kembalikan Buku
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {mode === 'pinjam' ? (
          <form onSubmit={handleBorrowSubmit} className="mx-auto max-w-lg space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Form Peminjaman Buku</h3>
              <p className="text-sm text-slate-500">Isi nama siswa, lalu scan atau ketik ISBN buku.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nama Peminjam</label>
              <div className="relative">
                <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={nameInputRef}
                  value={borrowerName}
                  onChange={(e) => {
                    setBorrowerName(e.target.value)
                    setShowBorrowerSuggestions(true)
                  }}
                  onFocus={() => setShowBorrowerSuggestions(true)}
                  onBlur={() => setShowBorrowerSuggestions(false)}
                  required
                  autoComplete="off"
                  placeholder="Nama lengkap siswa"
                  className="h-12 w-full rounded-lg border border-slate-300 pl-11 pr-4 text-base focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                />
                {showBorrowerSuggestions && borrowerSuggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {borrowerSuggestions.map((s) => (
                      <li key={`${s.borrower_nis || ''}-${s.borrower_name}`}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            selectBorrowerSuggestion(s)
                          }}
                          className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-medium text-slate-800">{s.borrower_name}</span>
                            {s.source === 'akun' && s.role && (
                              <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-700">
                                {ROLE_LABELS[s.role] ?? s.role}
                              </span>
                            )}
                          </span>
                          {s.borrower_nis && <span className="shrink-0 text-xs text-slate-400">NIS {s.borrower_nis}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">Ketik minimal 2 huruf untuk melihat usulan dari riwayat peminjam maupun akun terdaftar.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">NIS (opsional)</label>
              <input
                value={borrowerNis}
                onChange={(e) => setBorrowerNis(e.target.value)}
                placeholder="Nomor Induk Siswa"
                className="h-12 w-full rounded-lg border border-slate-300 px-4 text-base focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              />
              {trimmedBorrowerName && currentBorrowerLoanCount > 0 && (
                <p className={`mt-1.5 text-xs font-semibold ${borrowerAtLimit ? 'text-rose-600' : 'text-amber-600'}`}>
                  {borrowerAtLimit
                    ? `${trimmedBorrowerName} sudah meminjam ${currentBorrowerLoanCount} buku dan belum mengembalikannya. Batas maksimal ${MAX_ACTIVE_LOANS_PER_BORROWER} buku tercapai.`
                    : `Sedang meminjam ${currentBorrowerLoanCount}/${MAX_ACTIVE_LOANS_PER_BORROWER} buku.`}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nomor ISBN Buku</label>
              <div className="relative">
                <ScanLine size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={isbnInputRef}
                  value={borrowIsbn}
                  onChange={(e) => setBorrowIsbn(e.target.value)}
                  onKeyDown={handleIsbnKeyDown}
                  required
                  autoFocus
                  placeholder="Scan barcode ISBN atau ketik nomor ISBN"
                  className="h-14 w-full rounded-lg border border-slate-300 pl-12 pr-4 text-lg font-semibold tracking-wide focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                />
              </div>
            </div>

            {isbnTrimmed && matchedByIsbn.length === 0 && (
              <p className="text-sm font-medium text-rose-600">ISBN tidak ditemukan di koleksi perpustakaan ini.</p>
            )}

            {isbnTrimmed && matchedByIsbn.length > 0 && availableCopies.length === 0 && (
              <p className="text-sm font-medium text-rose-600">
                Semua eksemplar "{matchedByIsbn[0].judul}" tidak ada yang bisa
                dipinjamkan untuk saat ini.
              </p>
            )}

            {matchedByIsbn.length > 0 && availableCopies.length > 0 && (
              <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                {matchedByIsbn[0].cover_url ? (
                  <img
                    src={matchedByIsbn[0].cover_url}
                    alt={matchedByIsbn[0].judul}
                    className="h-24 w-16 shrink-0 rounded object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-400">
                    <BookOpen size={22} />
                  </div>
                )}
                <dl className="min-w-0 flex-1 space-y-0.5 text-sm">
                  <dt className="sr-only">Judul</dt>
                  <dd className="truncate font-bold text-slate-900">{matchedByIsbn[0].judul}</dd>
                  <dd className="truncate text-slate-600">{matchedByIsbn[0].penulis}</dd>
                  <dd className="truncate text-xs text-slate-500">
                    {[matchedByIsbn[0].penerbit, matchedByIsbn[0].tahun_terbit].filter(Boolean).join(', ')}
                  </dd>
                  <dd className="truncate text-xs text-slate-400">ISBN {matchedByIsbn[0].isbn}</dd>
                </dl>
              </div>
            )}

            {availableCopies.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Pilih Eksemplar (No. Inventaris)</label>
                <select
                  ref={selectRef}
                  value={selectedInventaris}
                  onChange={(e) => setSelectedInventaris(e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 px-4 text-base focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                >
                  {availableCopies.map((b) => (
                    <option key={b.id} value={b.nomor_inventaris}>
                      No. Inv {b.nomor_inventaris}
                      {b.kondisi ? ` — Kondisi ${b.kondisi}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Batas Waktu Pengembalian</label>
              <div className="relative">
                <CalendarClock size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={todayInput()}
                  required
                  className="h-12 w-full rounded-lg border border-slate-300 pl-12 pr-4 text-base focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Default {DEFAULT_LOAN_DAYS} hari dari sekarang, bisa diubah sesuai kebutuhan.</p>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedInventaris || borrowerAtLimit}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-800 text-base font-bold text-white shadow-sm hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <BookOpen size={18} />}
              {borrowerAtLimit ? 'Batas Peminjaman Tercapai' : 'Pinjamkan Buku'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReturnSubmit} className="mx-auto max-w-lg space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Form Pengembalian Buku</h3>
              <p className="text-sm text-slate-500">Cukup scan atau ketik nomor inventaris buku yang dikembalikan.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nomor Inventaris Buku</label>
              <div className="relative">
                <ScanLine size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  value={nomorInventaris}
                  onChange={(e) => setNomorInventaris(e.target.value.toUpperCase())}
                  required
                  autoFocus
                  placeholder="Scan barcode atau ketik nomor inventaris"
                  className="h-14 w-full rounded-lg border border-slate-300 pl-12 pr-4 text-lg font-semibold uppercase tracking-wide placeholder:normal-case focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-800 text-base font-bold text-white shadow-sm hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Undo2 size={18} />}
              Kembalikan Buku
            </button>
          </form>
        )}

        {feedback && (
          <div
            className={`mx-auto mt-5 flex max-w-lg items-start gap-3 rounded-lg px-4 py-3 text-sm ${
              feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <XCircle size={18} className="mt-0.5 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {mode === 'pinjam' && feedback?.type === 'success' && (
          <div className="mx-auto mt-4 max-w-lg text-center">
            <button
              type="button"
              onClick={resetForNextPerson}
              className="text-sm font-semibold text-sky-700 hover:text-sky-900"
            >
              Selesai — Siswa Berikutnya
            </button>
          </div>
        )}
      </div>

      {(requestsLoading || requests.length > 0) && (
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-4">
            <Inbox size={18} className="text-amber-600" />
            <div>
              <h3 className="font-bold text-slate-900">Permintaan Peminjaman ({requests.length})</h3>
              <p className="text-xs text-slate-500">Pengajuan peminjaman mandiri dari pengunjung, menunggu persetujuan</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Judul Buku</th>
                  <th className="px-6 py-3">No. Inventaris</th>
                  <th className="px-6 py-3">Pemohon</th>
                  <th className="px-6 py-3">Tanggal Pengajuan</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {requestsLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                )}
                {!requestsLoading &&
                  requests.map((req) => {
                    const book = bookFor(req.book_id)
                    return (
                      <tr key={req.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm font-medium text-slate-800">{book?.judul ?? '-'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{book?.nomor_inventaris ?? '-'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{req.borrower_name}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {new Date(req.borrow_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={processingRequest}
                              onClick={() => setRequestToReject(req)}
                              className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Tolak
                            </button>
                            <button
                              type="button"
                              disabled={processingRequest}
                              onClick={() => setRequestToApprove(req)}
                              className="rounded-lg bg-sky-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Setujui
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="font-bold text-slate-900">Sedang Dipinjam ({loans.length})</h3>
          <p className="text-xs text-slate-400">Buku yang belum dikembalikan di perpustakaan ini</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Judul Buku</th>
                <th className="px-6 py-3">No. Inventaris</th>
                <th className="px-6 py-3">Peminjam</th>
                <th className="px-6 py-3">NIS</th>
                <th className="px-6 py-3">Tanggal Pinjam</th>
                <th className="px-6 py-3">Batas Waktu</th>
                <th className="px-6 py-3">Waktu Pinjam</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loansLoading && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loansLoading && loans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-400">
                    Belum ada buku yang sedang dipinjam.
                  </td>
                </tr>
              )}
              {!loansLoading &&
                loans.map((loan) => {
                  const book = bookFor(loan.book_id)
                  const status = loanTimeStatus(loan.due_date)
                  return (
                    <tr key={loan.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-medium text-slate-800">{book?.judul ?? '-'}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{book?.nomor_inventaris ?? '-'}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{loan.borrower_name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{loan.borrower_nis || '-'}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {new Date(loan.borrow_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {loan.due_date
                          ? new Date(loan.due_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                          : '-'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          disabled={submitting || !book}
                          onClick={() => book && submitReturn(book.nomor_inventaris)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Kembalikan
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {requestToApprove && (
        <ApproveRequestModal
          bookTitle={bookFor(requestToApprove.book_id)?.judul ?? 'buku ini'}
          borrowerName={requestToApprove.borrower_name}
          loading={processingRequest}
          onCancel={() => setRequestToApprove(null)}
          onConfirm={handleApprove}
        />
      )}

      {requestToReject && (
        <ConfirmDialog
          title="Tolak pengajuan peminjaman?"
          message={`Pengajuan peminjaman "${bookFor(requestToReject.book_id)?.judul ?? 'buku ini'}" oleh ${requestToReject.borrower_name} akan ditolak.`}
          confirmLabel="Ya, Tolak"
          loading={processingRequest}
          onConfirm={handleReject}
          onCancel={() => setRequestToReject(null)}
        />
      )}
    </div>
  )
}
