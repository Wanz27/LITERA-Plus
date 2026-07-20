import * as circulationsRepo from './circulations.repository.js'
import * as booksRepo from '../books/books.repository.js'
import * as librariesRepo from '../libraries/libraries.repository.js'
import * as activityRepo from '../activity/activity.repository.js'

function borrowerLabel(name, nis) {
  return nis ? `${name} (NIS ${nis})` : name
}

export const list = async (libraryId, status) => {
  if (!libraryId) throw new Error('library_id wajib diisi')
  return circulationsRepo.listCirculations(libraryId, status)
}

export const borrow = async (payload, actor) => {
  const { library_id, nomor_inventaris, borrower_name, borrower_nis } = payload

  if (!library_id) throw new Error('library_id wajib diisi')
  if (!nomor_inventaris || !nomor_inventaris.trim()) throw new Error('Nomor inventaris wajib discan atau diisi')
  if (!borrower_name || !borrower_name.trim()) throw new Error('Nama peminjam wajib diisi')

  const library = await librariesRepo.findLibraryById(library_id)
  if (!library) throw new Error('Perpustakaan tidak ditemukan')

  const book = await booksRepo.findBookByNomorInventaris(library_id, nomor_inventaris.trim())
  if (!book) throw new Error(`Buku dengan nomor inventaris "${nomor_inventaris.trim()}" tidak ditemukan di perpustakaan ini.`)
  if (book.status === 'dipinjam') throw new Error(`Buku "${book.judul}" sedang dipinjam dan belum dikembalikan.`)

  const circulation = await circulationsRepo.createCirculation({
    book_id: book.id,
    library_id,
    borrower_name: borrower_name.trim(),
    borrower_nis: borrower_nis?.trim() || null,
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
