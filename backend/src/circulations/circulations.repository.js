import { supabase } from '../lib/supabase.js'

const COLUMNS = 'id, book_id, library_id, borrower_name, borrower_nis, status, borrow_date, return_date, created_at'

export const listCirculations = async (libraryId, status) => {
  let query = supabase
    .from('circulations')
    .select(COLUMNS)
    .eq('library_id', libraryId)
    .order('borrow_date', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const findActiveCirculationByBookId = async (bookId) => {
  const { data, error } = await supabase
    .from('circulations')
    .select(COLUMNS)
    .eq('book_id', bookId)
    .eq('status', 'dipinjam')
    .maybeSingle()

  if (error) throw error
  return data
}

const ALREADY_BORROWED_MESSAGE = 'Buku ini sedang dipinjam dan belum dikembalikan.'

export const createCirculation = async (payload) => {
  const { data, error } = await supabase.from('circulations').insert([payload]).select(COLUMNS).single()
  if (error) throw error.code === '23505' ? new Error(ALREADY_BORROWED_MESSAGE) : error
  return data
}

export const completeCirculation = async (id) => {
  const { data, error } = await supabase
    .from('circulations')
    .update({ status: 'kembali', return_date: new Date().toISOString() })
    .eq('id', id)
    .select(COLUMNS)
    .single()

  if (error) throw error
  return data
}
