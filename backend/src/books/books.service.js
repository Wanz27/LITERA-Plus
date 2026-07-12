import * as booksRepo from './books.repository.js'
import * as librariesRepo from '../libraries/libraries.repository.js'
import * as activityRepo from '../activity/activity.repository.js'

const KONDISI_VALUES = ['Bagus', 'Rusak']

function validate({ judul, penulis, jumlah, kondisi }) {
  if (!judul || !judul.trim()) throw new Error('Judul buku wajib diisi')
  if (!penulis || !penulis.trim()) throw new Error('Nama penulis wajib diisi')
  if (jumlah !== undefined && jumlah !== null && jumlah !== '') {
    const n = Number(jumlah)
    if (!Number.isInteger(n) || n < 1) throw new Error('Jumlah buku harus berupa angka bulat minimal 1')
  }
  if (kondisi !== undefined && kondisi !== null && kondisi !== '' && !KONDISI_VALUES.includes(kondisi)) {
    throw new Error('Kondisi buku tidak valid')
  }
}

function toIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

async function adjustLibraryTotal(libraryId, delta) {
  if (!delta) return
  const library = await librariesRepo.findLibraryById(libraryId)
  if (!library) return
  await librariesRepo.updateLibrary(libraryId, {
    total_koleksi: Math.max(0, library.total_koleksi + delta),
  })
}

export const list = async (libraryId) => {
  if (!libraryId) throw new Error('library_id wajib diisi')
  return booksRepo.listBooksByLibrary(libraryId)
}

export const create = async (payload, actor) => {
  validate(payload)
  const library = await librariesRepo.findLibraryById(payload.library_id)
  if (!library) throw new Error('Perpustakaan tidak ditemukan')

  const jumlah = payload.jumlah !== undefined && payload.jumlah !== '' ? Number(payload.jumlah) : 1

  const book = await booksRepo.createBook({
    library_id: payload.library_id,
    judul: payload.judul.trim(),
    penulis: payload.penulis.trim(),
    penerbit: payload.penerbit?.trim() || '',
    tahun_terbit: toIntOrNull(payload.tahun_terbit),
    isbn: payload.isbn?.trim() || '',
    kode_klasifikasi: payload.kode_klasifikasi?.trim() || '',
    kondisi: payload.kondisi || 'Bagus',
    subjek: payload.subjek?.trim() || '',
    bahasa: payload.bahasa?.trim() || '',
    jumlah,
    nomor_inventaris: payload.nomor_inventaris?.trim() || '',
    jumlah_halaman: toIntOrNull(payload.jumlah_halaman),
    ukuran_buku: payload.ukuran_buku?.trim() || '',
    ilustrasi: payload.ilustrasi?.trim() || '',
    cover_url: payload.cover_url?.trim() || '',
  })

  await adjustLibraryTotal(book.library_id, jumlah)

  await activityRepo.createActivity({
    aksi: 'Menambahkan Buku',
    detail: `${book.judul} (${jumlah} eksemplar) ditambahkan ke ${library.nama}.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return book
}

export const update = async (id, payload, actor) => {
  const existing = await booksRepo.findBookById(id)
  if (!existing) throw new Error('Buku tidak ditemukan')
  validate({ ...existing, ...payload })

  const nextJumlah = payload.jumlah !== undefined && payload.jumlah !== '' ? Number(payload.jumlah) : existing.jumlah

  const book = await booksRepo.updateBook(id, {
    ...(payload.judul ? { judul: payload.judul.trim() } : {}),
    ...(payload.penulis ? { penulis: payload.penulis.trim() } : {}),
    ...(payload.penerbit !== undefined ? { penerbit: payload.penerbit.trim() } : {}),
    ...(payload.tahun_terbit !== undefined ? { tahun_terbit: toIntOrNull(payload.tahun_terbit) } : {}),
    ...(payload.isbn !== undefined ? { isbn: payload.isbn.trim() } : {}),
    ...(payload.kode_klasifikasi !== undefined ? { kode_klasifikasi: payload.kode_klasifikasi.trim() } : {}),
    ...(payload.kondisi ? { kondisi: payload.kondisi } : {}),
    ...(payload.subjek !== undefined ? { subjek: payload.subjek.trim() } : {}),
    ...(payload.bahasa !== undefined ? { bahasa: payload.bahasa.trim() } : {}),
    ...(payload.jumlah !== undefined ? { jumlah: nextJumlah } : {}),
    ...(payload.nomor_inventaris !== undefined ? { nomor_inventaris: payload.nomor_inventaris.trim() } : {}),
    ...(payload.jumlah_halaman !== undefined ? { jumlah_halaman: toIntOrNull(payload.jumlah_halaman) } : {}),
    ...(payload.ukuran_buku !== undefined ? { ukuran_buku: payload.ukuran_buku.trim() } : {}),
    ...(payload.ilustrasi !== undefined ? { ilustrasi: payload.ilustrasi.trim() } : {}),
    ...(payload.cover_url !== undefined ? { cover_url: payload.cover_url.trim() } : {}),
  })

  await adjustLibraryTotal(book.library_id, nextJumlah - existing.jumlah)

  await activityRepo.createActivity({
    aksi: 'Mengubah Buku',
    detail: `${book.judul} diperbarui.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return book
}

export const remove = async (id, actor) => {
  const existing = await booksRepo.findBookById(id)
  if (!existing) throw new Error('Buku tidak ditemukan')

  await booksRepo.deleteBook(id)
  await adjustLibraryTotal(existing.library_id, -existing.jumlah)

  await activityRepo.createActivity({
    aksi: 'Menghapus Buku',
    detail: `${existing.judul} dihapus.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return { id }
}
