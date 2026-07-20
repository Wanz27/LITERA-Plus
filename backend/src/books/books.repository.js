import { supabase } from '../lib/supabase.js'

const COLUMNS =
  'id, library_id, judul, penulis, penerbit, tahun_terbit, isbn, kode_klasifikasi, kondisi, subjek, bahasa, jumlah, nomor_inventaris, jumlah_halaman, ukuran_buku, ilustrasi, cover_url, batch_id, status, created_at'

export const listBooksByLibrary = async (libraryId) => {
  const { data, error } = await supabase
    .from('books')
    .select(COLUMNS)
    .eq('library_id', libraryId)
    .order('created_at', { ascending: true })
    .order('nomor_inventaris', { ascending: true })

  if (error) throw error
  return data
}

export const findBookById = async (id) => {
  const { data, error } = await supabase.from('books').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

/** Finds books in a library whose nomor_inventaris matches any of the given (non-empty) numbers. */
export const findBooksByNomorInventaris = async (libraryId, numbers) => {
  if (numbers.length === 0) return []
  const { data, error } = await supabase
    .from('books')
    .select('id, nomor_inventaris')
    .eq('library_id', libraryId)
    .in('nomor_inventaris', numbers)

  if (error) throw error
  return data
}

/** Finds a single book copy in a library by its (unique) nomor_inventaris. Used by the borrow/return flow. */
export const findBookByNomorInventaris = async (libraryId, nomorInventaris) => {
  const { data, error } = await supabase
    .from('books')
    .select(COLUMNS)
    .eq('library_id', libraryId)
    .eq('nomor_inventaris', nomorInventaris)
    .maybeSingle()

  if (error) throw error
  return data
}

export const updateBookStatus = async (id, status) => {
  const { data, error } = await supabase.from('books').update({ status }).eq('id', id).select(COLUMNS).single()
  if (error) throw error
  return data
}

const DUPLICATE_NOMOR_MESSAGE = 'Nomor inventaris sudah dipakai buku lain di perpustakaan ini.'

export const createBooks = async (payloads) => {
  const { data, error } = await supabase.from('books').insert(payloads).select(COLUMNS)
  if (error) throw error.code === '23505' ? new Error(DUPLICATE_NOMOR_MESSAGE) : error
  return data
}

export const updateBook = async (id, payload) => {
  const { data, error } = await supabase
    .from('books')
    .update(payload)
    .eq('id', id)
    .select(COLUMNS)
    .single()

  if (error) throw error.code === '23505' ? new Error(DUPLICATE_NOMOR_MESSAGE) : error
  return data
}

export const deleteBook = async (id) => {
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}
