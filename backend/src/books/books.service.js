import { randomUUID } from 'node:crypto'
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

/**
 * Expands a starting inventory number into `count` individual numbers by incrementing its
 * trailing numeric run (e.g. "INV-01" x3 -> ["INV-01", "INV-02", "INV-03"]). Falls back to
 * repeating the same value when no numeric run is found.
 */
function expandInventoryNumbers(start, count) {
  const trimmed = (start || '').trim()
  if (!trimmed) return Array.from({ length: count }, () => '')
  const match = trimmed.match(/^(.*?)(\d+)(\D*)$/)
  if (!match) return Array.from({ length: count }, () => trimmed)
  const [, prefix, digits, suffix] = match
  const width = digits.length
  const startNum = parseInt(digits, 10)
  return Array.from({ length: count }, (_, i) => `${prefix}${String(startNum + i).padStart(width, '0')}${suffix}`)
}

/**
 * Ensures none of the given (non-empty) inventory numbers collide with each other or with an
 * existing book in the same library. `excludeBookId` lets an update skip comparing against
 * itself. Throws a friendly Indonesian error on the first collision found.
 */
async function assertNomorInventarisAvailable(libraryId, numbers, excludeBookId) {
  const filled = numbers.map((n) => n.trim()).filter(Boolean)
  if (filled.length === 0) return

  const seen = new Set()
  for (const nomor of filled) {
    if (seen.has(nomor)) {
      throw new Error(
        `Tidak bisa membuat nomor inventaris unik: "${nomor}" akan terpakai lebih dari sekali. Pastikan nomor awal diakhiri angka.`,
      )
    }
    seen.add(nomor)
  }

  const existing = await booksRepo.findBooksByNomorInventaris(libraryId, filled)
  const conflict = existing.find((book) => book.id !== excludeBookId)
  if (conflict) {
    throw new Error(`Nomor inventaris "${conflict.nomor_inventaris}" sudah dipakai buku lain di perpustakaan ini.`)
  }
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

  const basePayload = {
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
    jumlah_halaman: toIntOrNull(payload.jumlah_halaman),
    ukuran_buku: payload.ukuran_buku?.trim() || '',
    ilustrasi: payload.ilustrasi?.trim() || '',
    cover_url: payload.cover_url?.trim() || '',
  }

  const inventoryNumbers = expandInventoryNumbers(payload.nomor_inventaris, jumlah)
  await assertNomorInventarisAvailable(payload.library_id, inventoryNumbers)

  const batchId = randomUUID()
  const rows = inventoryNumbers.map((nomor_inventaris) => ({
    ...basePayload,
    jumlah: 1,
    nomor_inventaris,
    batch_id: batchId,
  }))

  const books = await booksRepo.createBooks(rows)

  await adjustLibraryTotal(payload.library_id, jumlah)

  await activityRepo.createActivity({
    aksi: 'Menambahkan Buku',
    detail: `${basePayload.judul} (${jumlah} eksemplar) ditambahkan ke ${library.nama}.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return books
}

export const bulkImport = async (payload, actor) => {
  const { library_id, books } = payload
  if (!library_id) throw new Error('library_id wajib diisi')
  if (!Array.isArray(books) || books.length === 0) throw new Error('Tidak ada data buku untuk diimpor')

  const library = await librariesRepo.findLibraryById(library_id)
  if (!library) throw new Error('Perpustakaan tidak ditemukan')

  const batchRows = []
  const allInventoryNumbers = []
  let totalJumlah = 0

  books.forEach((book, index) => {
    try {
      validate(book)
    } catch (err) {
      throw new Error(`Baris ${index + 2}: ${err.message}`)
    }

    const jumlah = book.jumlah !== undefined && book.jumlah !== null && book.jumlah !== '' ? Number(book.jumlah) : 1
    const basePayload = {
      library_id,
      judul: book.judul.trim(),
      penulis: book.penulis.trim(),
      penerbit: book.penerbit?.trim() || '',
      tahun_terbit: toIntOrNull(book.tahun_terbit),
      isbn: book.isbn?.trim() || '',
      kode_klasifikasi: book.kode_klasifikasi?.trim() || '',
      kondisi: book.kondisi || 'Bagus',
      subjek: book.subjek?.trim() || '',
      bahasa: book.bahasa?.trim() || '',
      jumlah_halaman: toIntOrNull(book.jumlah_halaman),
      ukuran_buku: book.ukuran_buku?.trim() || '',
      ilustrasi: book.ilustrasi?.trim() || '',
      cover_url: '',
    }

    const inventoryNumbers = expandInventoryNumbers(book.nomor_inventaris, jumlah)
    allInventoryNumbers.push(...inventoryNumbers)

    const batchId = randomUUID()
    inventoryNumbers.forEach((nomor_inventaris) => {
      batchRows.push({ ...basePayload, jumlah: 1, nomor_inventaris, batch_id: batchId })
    })

    totalJumlah += jumlah
  })

  await assertNomorInventarisAvailable(library_id, allInventoryNumbers)

  const createdBooks = await booksRepo.createBooks(batchRows)

  await adjustLibraryTotal(library_id, totalJumlah)

  await activityRepo.createActivity({
    aksi: 'Impor Buku dari Excel',
    detail: `${books.length} judul (${totalJumlah} eksemplar) diimpor ke ${library.nama}.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return createdBooks
}

/**
 * `jumlah` is fixed at 1 per row once a book is created (each row is one physical copy; see the
 * schema comment on `batch_id`). Editing it here instead of splitting into new rows would leave a
 * single row representing multiple copies with only one nomor_inventaris, breaking the invariant
 * that Total Buku (sum of jumlah) always matches the count of assigned inventory numbers. Adding
 * copies must go through "Tambah Buku" (create), which fans them out into separate rows.
 */
function assertJumlahUnchanged(payload, existing) {
  if (payload.jumlah === undefined || payload.jumlah === '') return
  if (Number(payload.jumlah) !== existing.jumlah) {
    throw new Error('Jumlah buku tidak bisa diubah lewat Edit Buku. Gunakan "Tambah Buku" untuk menambah eksemplar baru.')
  }
}

export const update = async (id, payload, actor) => {
  const existing = await booksRepo.findBookById(id)
  if (!existing) throw new Error('Buku tidak ditemukan')
  validate({ ...existing, ...payload })
  assertJumlahUnchanged(payload, existing)

  if (payload.nomor_inventaris !== undefined) {
    await assertNomorInventarisAvailable(existing.library_id, [payload.nomor_inventaris], id)
  }

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
    ...(payload.nomor_inventaris !== undefined ? { nomor_inventaris: payload.nomor_inventaris.trim() } : {}),
    ...(payload.jumlah_halaman !== undefined ? { jumlah_halaman: toIntOrNull(payload.jumlah_halaman) } : {}),
    ...(payload.ukuran_buku !== undefined ? { ukuran_buku: payload.ukuran_buku.trim() } : {}),
    ...(payload.ilustrasi !== undefined ? { ilustrasi: payload.ilustrasi.trim() } : {}),
    ...(payload.cover_url !== undefined ? { cover_url: payload.cover_url.trim() } : {}),
  })

  const library = await librariesRepo.findLibraryById(existing.library_id)

  await activityRepo.createActivity({
    aksi: 'Mengubah Buku',
    detail: `${book.judul} diperbarui${library ? ` di ${library.nama}` : ''}.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return book
}

export const remove = async (id, actor) => {
  const existing = await booksRepo.findBookById(id)
  if (!existing) throw new Error('Buku tidak ditemukan')

  const library = await librariesRepo.findLibraryById(existing.library_id)

  await booksRepo.deleteBook(id)
  await adjustLibraryTotal(existing.library_id, -existing.jumlah)

  await activityRepo.createActivity({
    aksi: 'Menghapus Buku',
    detail: `${existing.judul} dihapus${library ? ` dari ${library.nama}` : ''}.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return { id }
}
