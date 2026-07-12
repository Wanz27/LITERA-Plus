import * as librariesRepo from './libraries.repository.js'
import * as activityRepo from '../activity/activity.repository.js'

const STATUS_VALUES = ['Tersedia', 'Penuh', 'Pemeliharaan']
const TIPE_VALUES = ['utama', 'digital', 'referensi', 'arsip']
const DEFAULT_JAM_OPERASIONAL = 'Senin - Jumat: 08.00 - 18.00\nSabtu: 09.00 - 15.00'
const DEFAULT_KEPALA_UNIT = 'Belum ditentukan'

function validate({ nama, lokasi, status, tipe }) {
  if (!nama || !nama.trim()) throw new Error('Nama perpustakaan wajib diisi')
  if (!lokasi || !lokasi.trim()) throw new Error('Lokasi wajib diisi')
  if (status && !STATUS_VALUES.includes(status)) throw new Error('Status tidak valid')
  if (tipe && !TIPE_VALUES.includes(tipe)) throw new Error('Tipe tidak valid')
}

export const list = () => librariesRepo.listLibraries()

export const create = async (payload, actor) => {
  validate(payload)
  const library = await librariesRepo.createLibrary({
    nama: payload.nama.trim(),
    lokasi: payload.lokasi.trim(),
    status: payload.status || 'Tersedia',
    tipe: payload.tipe || 'utama',
    jam_operasional: payload.jam_operasional?.trim() || DEFAULT_JAM_OPERASIONAL,
    kepala_unit: payload.kepala_unit?.trim() || DEFAULT_KEPALA_UNIT,
  })

  await activityRepo.createActivity({
    aksi: 'Menambahkan Perpustakaan',
    detail: `${library.nama} (${library.lokasi}) ditambahkan.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return library
}

export const update = async (id, payload, actor) => {
  const existing = await librariesRepo.findLibraryById(id)
  if (!existing) throw new Error('Perpustakaan tidak ditemukan')
  validate({ ...existing, ...payload })

  const library = await librariesRepo.updateLibrary(id, {
    ...(payload.nama ? { nama: payload.nama.trim() } : {}),
    ...(payload.lokasi ? { lokasi: payload.lokasi.trim() } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.tipe ? { tipe: payload.tipe } : {}),
    ...(payload.jam_operasional !== undefined ? { jam_operasional: payload.jam_operasional.trim() || DEFAULT_JAM_OPERASIONAL } : {}),
    ...(payload.kepala_unit !== undefined ? { kepala_unit: payload.kepala_unit.trim() || DEFAULT_KEPALA_UNIT } : {}),
  })

  await activityRepo.createActivity({
    aksi: 'Mengubah Perpustakaan',
    detail: `${library.nama} (${library.lokasi}) diperbarui.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return library
}

export const remove = async (id, actor) => {
  const existing = await librariesRepo.findLibraryById(id)
  if (!existing) throw new Error('Perpustakaan tidak ditemukan')

  await librariesRepo.deleteLibrary(id)

  await activityRepo.createActivity({
    aksi: 'Menghapus Perpustakaan',
    detail: `${existing.nama} (${existing.lokasi}) dihapus.`,
    pelaku: actor?.full_name || 'Admin',
  })

  return { id }
}
