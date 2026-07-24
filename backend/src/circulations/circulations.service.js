import * as circulationsRepo from './circulations.repository.js'
import * as booksRepo from '../books/books.repository.js'
import * as librariesRepo from '../libraries/libraries.repository.js'
import * as activityRepo from '../activity/activity.repository.js'

function borrowerLabel(name, nis) {
  return nis ? `${name} (NIS ${nis})` : name
}

const DEFAULT_LOAN_DAYS = 7
const MAX_ACTIVE_LOANS_PER_BORROWER = 2

function defaultDueDate() {
  const due = new Date()
  due.setDate(due.getDate() + DEFAULT_LOAN_DAYS)
  return due.toISOString()
}

export const list = async (libraryId, status) => {
  if (!libraryId) throw new Error('library_id wajib diisi')
  return circulationsRepo.listCirculations(libraryId, status)
}

export const searchBorrowers = async (libraryId, query) => {
  if (!libraryId) throw new Error('library_id wajib diisi')
  return circulationsRepo.searchBorrowers(libraryId, (query || '').trim())
}

export const borrow = async (payload, actor) => {
  const { library_id, nomor_inventaris, borrower_name, borrower_nis, due_date } = payload

  if (!library_id) throw new Error('library_id wajib diisi')
  if (!nomor_inventaris || !nomor_inventaris.trim()) throw new Error('Nomor inventaris wajib discan atau diisi')
  if (!borrower_name || !borrower_name.trim()) throw new Error('Nama peminjam wajib diisi')

  let dueDateValue = defaultDueDate()
  if (due_date) {
    const parsed = new Date(due_date)
    if (Number.isNaN(parsed.getTime())) throw new Error('Batas waktu pengembalian tidak valid')
    dueDateValue = parsed.toISOString()
  }

  const library = await librariesRepo.findLibraryById(library_id)
  if (!library) throw new Error('Perpustakaan tidak ditemukan')

  const book = await booksRepo.findBookByNomorInventaris(library_id, nomor_inventaris.trim())
  if (!book) throw new Error(`Buku dengan nomor inventaris "${nomor_inventaris.trim()}" tidak ditemukan di perpustakaan ini.`)
  if (book.status === 'dipinjam') throw new Error(`Buku "${book.judul}" sedang dipinjam dan belum dikembalikan.`)
  if (book.status === 'hilang') throw new Error(`Buku "${book.judul}" berstatus hilang dan tidak bisa dipinjamkan.`)
  if (book.kondisi === 'Rusak') throw new Error(`Buku "${book.judul}" dalam kondisi rusak dan tidak bisa dipinjamkan.`)

  const blocking = await circulationsRepo.findBlockingCirculationByBookId(book.id)
  if (blocking?.status === 'menunggu') {
    throw new Error(
      `Buku "${book.judul}" sedang ada pengajuan peminjaman mandiri yang menunggu persetujuan. Setujui atau tolak pengajuan tersebut terlebih dahulu.`,
    )
  }

  const trimmedName = borrower_name.trim()
  const trimmedNis = borrower_nis?.trim() || null
  const activeLoanCount = await circulationsRepo.countActiveLoansForBorrower(library_id, {
    borrowerName: trimmedName,
    borrowerNis: trimmedNis,
  })
  if (activeLoanCount >= MAX_ACTIVE_LOANS_PER_BORROWER) {
    throw new Error(
      `${borrowerLabel(trimmedName, trimmedNis)} sudah meminjam ${activeLoanCount} buku dan belum mengembalikannya. Maksimal peminjaman adalah ${MAX_ACTIVE_LOANS_PER_BORROWER} buku per orang.`,
    )
  }

  const circulation = await circulationsRepo.createCirculation({
    book_id: book.id,
    library_id,
    borrower_name: trimmedName,
    borrower_nis: trimmedNis,
    due_date: dueDateValue,
  })

  const updatedBook = await booksRepo.updateBookStatus(book.id, 'dipinjam')

  await activityRepo.createActivity({
    aksi: 'Meminjamkan Buku',
    detail: `"${book.judul}" (No. Inv ${book.nomor_inventaris}) dipinjam oleh ${borrowerLabel(circulation.borrower_name, circulation.borrower_nis)} di ${library.nama}.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return { book: updatedBook, circulation }
}

export const returnBook = async (payload, actor) => {
  const { library_id, nomor_inventaris } = payload

  if (!library_id) throw new Error('library_id wajib diisi')
  if (!nomor_inventaris || !nomor_inventaris.trim()) throw new Error('Nomor inventaris wajib discan atau diisi')

  const library = await librariesRepo.findLibraryById(library_id)
  if (!library) throw new Error('Perpustakaan tidak ditemukan')

  const book = await booksRepo.findBookByNomorInventaris(library_id, nomor_inventaris.trim())
  if (!book) throw new Error(`Buku dengan nomor inventaris "${nomor_inventaris.trim()}" tidak ditemukan di perpustakaan ini.`)

  const circulation = await circulationsRepo.findActiveCirculationByBookId(book.id)
  if (!circulation) throw new Error(`Buku "${book.judul}" tidak sedang dalam status dipinjam.`)

  const updatedCirculation = await circulationsRepo.completeCirculation(circulation.id)
  const updatedBook = await booksRepo.updateBookStatus(book.id, 'tersedia')

  await activityRepo.createActivity({
    aksi: 'Mengembalikan Buku',
    detail: `"${book.judul}" (No. Inv ${book.nomor_inventaris}) dikembalikan oleh ${borrowerLabel(circulation.borrower_name, circulation.borrower_nis)} di ${library.nama}.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return { book: updatedBook, circulation: updatedCirculation }
}

export const requestBorrow = async (payload, actor) => {
  const { library_id, book_id } = payload

  if (!library_id) throw new Error('library_id wajib diisi')
  if (!book_id) throw new Error('book_id wajib diisi')
  if (!actor?.full_name) throw new Error('Sesi tidak valid, silakan masuk kembali.')

  const library = await librariesRepo.findLibraryById(library_id)
  if (!library) throw new Error('Perpustakaan tidak ditemukan')
  if (!library.peminjaman_aktif || !library.peminjaman_mandiri_aktif) {
    throw new Error('Peminjaman mandiri oleh pengunjung belum diaktifkan untuk perpustakaan ini.')
  }

  const book = await booksRepo.findBookById(book_id)
  if (!book || book.library_id !== library_id) throw new Error('Buku tidak ditemukan di perpustakaan ini.')
  if (book.status === 'dipinjam') throw new Error(`Buku "${book.judul}" sedang dipinjam dan belum dikembalikan.`)
  if (book.status === 'hilang') throw new Error(`Buku "${book.judul}" berstatus hilang dan tidak bisa dipinjamkan.`)
  if (book.kondisi === 'Rusak') throw new Error(`Buku "${book.judul}" dalam kondisi rusak dan tidak bisa dipinjamkan.`)

  const blocking = await circulationsRepo.findBlockingCirculationByBookId(book.id)
  if (blocking) {
    throw new Error(
      blocking.status === 'menunggu'
        ? `Sudah ada pengajuan peminjaman lain untuk "${book.judul}" yang menunggu persetujuan.`
        : `Buku "${book.judul}" sedang dipinjam dan belum dikembalikan.`,
    )
  }

  const activeLoanCount = await circulationsRepo.countActiveLoansForBorrower(library_id, {
    borrowerName: actor.full_name,
    borrowerNis: null,
  })
  if (activeLoanCount >= MAX_ACTIVE_LOANS_PER_BORROWER) {
    throw new Error(
      `Anda sudah meminjam ${activeLoanCount} buku dan belum mengembalikannya. Maksimal peminjaman adalah ${MAX_ACTIVE_LOANS_PER_BORROWER} buku per orang.`,
    )
  }

  const circulation = await circulationsRepo.createCirculation({
    book_id: book.id,
    library_id,
    borrower_name: actor.full_name,
    borrower_nis: null,
    status: 'menunggu',
    due_date: null,
  })

  await activityRepo.createActivity({
    aksi: 'Mengajukan Peminjaman',
    detail: `"${book.judul}" (No. Inv ${book.nomor_inventaris}) diajukan untuk dipinjam oleh ${actor.full_name} di ${library.nama}.`,
    pelaku: actor.full_name,
  })

  return { circulation }
}

export const approveRequest = async (id, payload, actor) => {
  const circulation = await circulationsRepo.findCirculationById(id)
  if (!circulation) throw new Error('Pengajuan peminjaman tidak ditemukan.')
  if (circulation.status !== 'menunggu') throw new Error('Pengajuan ini sudah diproses sebelumnya.')

  const book = await booksRepo.findBookById(circulation.book_id)
  if (!book) throw new Error('Buku pada pengajuan ini tidak ditemukan.')
  if (book.status !== 'tersedia') {
    throw new Error(`Buku "${book.judul}" sudah tidak tersedia dan tidak bisa disetujui. Tolak pengajuan ini.`)
  }

  const library = await librariesRepo.findLibraryById(circulation.library_id)
  if (!library) throw new Error('Perpustakaan tidak ditemukan')

  let dueDateValue = defaultDueDate()
  if (payload?.due_date) {
    const parsed = new Date(payload.due_date)
    if (Number.isNaN(parsed.getTime())) throw new Error('Batas waktu pengembalian tidak valid')
    dueDateValue = parsed.toISOString()
  }

  const updatedCirculation = await circulationsRepo.approveCirculation(id, dueDateValue)
  const updatedBook = await booksRepo.updateBookStatus(book.id, 'dipinjam')

  await activityRepo.createActivity({
    aksi: 'Menyetujui Peminjaman',
    detail: `Pengajuan peminjaman "${book.judul}" (No. Inv ${book.nomor_inventaris}) oleh ${borrowerLabel(circulation.borrower_name, circulation.borrower_nis)} di ${library.nama} disetujui.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return { book: updatedBook, circulation: updatedCirculation }
}

export const rejectRequest = async (id, actor) => {
  const circulation = await circulationsRepo.findCirculationById(id)
  if (!circulation) throw new Error('Pengajuan peminjaman tidak ditemukan.')
  if (circulation.status !== 'menunggu') throw new Error('Pengajuan ini sudah diproses sebelumnya.')

  const book = await booksRepo.findBookById(circulation.book_id)
  const library = await librariesRepo.findLibraryById(circulation.library_id)

  const updatedCirculation = await circulationsRepo.rejectCirculation(id)

  await activityRepo.createActivity({
    aksi: 'Menolak Peminjaman',
    detail: `Pengajuan peminjaman "${book?.judul ?? 'buku'}"${book ? ` (No. Inv ${book.nomor_inventaris})` : ''} oleh ${borrowerLabel(circulation.borrower_name, circulation.borrower_nis)}${library ? ` di ${library.nama}` : ''} ditolak.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return { circulation: updatedCirculation }
}
