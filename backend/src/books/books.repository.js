import { supabase } from '../lib/supabase.js'

const COLUMNS =
  'id, library_id, judul, penulis, penerbit, tahun_terbit, isbn, kode_klasifikasi, kondisi, subjek, bahasa, jumlah, nomor_inventaris, jumlah_halaman, ukuran_buku, ilustrasi, cover_url, created_at'

export const listBooksByLibrary = async (libraryId) => {
  const { data, error } = await supabase
    .from('books')
    .select(COLUMNS)
    .eq('library_id', libraryId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const findBookById = async (id) => {
  const { data, error } = await supabase.from('books').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createBook = async (payload) => {
  const { data, error } = await supabase.from('books').insert([payload]).select(COLUMNS).single()
  if (error) throw error
  return data
}

export const updateBook = async (id, payload) => {
  const { data, error } = await supabase
    .from('books')
    .update(payload)
    .eq('id', id)
    .select(COLUMNS)
    .single()

  if (error) throw error
  return data
}

export const deleteBook = async (id) => {
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}
