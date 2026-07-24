import { supabase } from '../lib/supabase.js'

const COLUMNS = 'id, book_id, library_id, borrower_name, borrower_nis, status, borrow_date, due_date, return_date, created_at'

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

// Blok baik peminjaman aktif ('dipinjam') maupun pengajuan yang masih menunggu ('menunggu') —
// keduanya sama-sama membuat satu eksemplar tidak bisa dipinjamkan/diajukan ulang.
export const findBlockingCirculationByBookId = async (bookId) => {
  const { data, error } = await supabase
    .from('circulations')
    .select(COLUMNS)
    .eq('book_id', bookId)
    .in('status', ['dipinjam', 'menunggu'])
    .maybeSingle()

  if (error) throw error
  return data
}

export const findCirculationById = async (id) => {
  const { data, error } = await supabase.from('circulations').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

const ALREADY_BORROWED_MESSAGE = 'Buku ini sedang dipinjam atau sedang diajukan dan belum diproses.'

export const createCirculation = async (payload) => {
  const { data, error } = await supabase.from('circulations').insert([payload]).select(COLUMNS).single()
  if (error) throw error.code === '23505' ? new Error(ALREADY_BORROWED_MESSAGE) : error
  return data
}

export const approveCirculation = async (id, dueDate) => {
  const { data, error } = await supabase
    .from('circulations')
    .update({ status: 'dipinjam', due_date: dueDate, borrow_date: new Date().toISOString() })
    .eq('id', id)
    .select(COLUMNS)
    .single()

  if (error) throw error
  return data
}

export const rejectCirculation = async (id) => {
  const { data, error } = await supabase
    .from('circulations')
    .update({ status: 'ditolak' })
    .eq('id', id)
    .select(COLUMNS)
    .single()

  if (error) throw error
  return data
}

// Usulan nama peminjam digabung dari dua sumber: riwayat peminjaman di perpustakaan ini
// (borrower_name/borrower_nis siswa yang pernah dicatat) dan akun terdaftar di tabel users
// (admin/petugas/visitor) — supaya siapa pun, apa pun rolenya, tetap muncul sebagai usulan dan
// bisa langsung meminjam buku.
export const searchBorrowers = async (libraryId, query) => {
  let historyRequest = supabase
    .from('circulations')
    .select('borrower_name, borrower_nis')
    .eq('library_id', libraryId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (query) historyRequest = historyRequest.ilike('borrower_name', `%${query}%`)

  let usersRequest = supabase.from('users').select('full_name, role').order('full_name', { ascending: true }).limit(50)
  if (query) usersRequest = usersRequest.ilike('full_name', `%${query}%`)

  const [historyResult, usersResult] = await Promise.all([historyRequest, usersRequest])
  if (historyResult.error) throw historyResult.error
  if (usersResult.error) throw usersResult.error

  const seen = new Set()
  const suggestions = []

  for (const row of historyResult.data) {
    const key = `${row.borrower_nis || ''}|${row.borrower_name.trim().toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    suggestions.push({ borrower_name: row.borrower_name, borrower_nis: row.borrower_nis, source: 'riwayat' })
    if (suggestions.length >= 5) break
  }

  for (const row of usersResult.data) {
    const key = `|${row.full_name.trim().toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    suggestions.push({ borrower_name: row.full_name, borrower_nis: null, source: 'akun', role: row.role })
    if (suggestions.length >= 8) break
  }

  return suggestions
}

export const countActiveLoansForBorrower = async (libraryId, { borrowerName, borrowerNis }) => {
  let request = supabase
    .from('circulations')
    .select('id', { count: 'exact', head: true })
    .eq('library_id', libraryId)
    .eq('status', 'dipinjam')

  request = borrowerNis
    ? request.eq('borrower_nis', borrowerNis)
    : request.is('borrower_nis', null).ilike('borrower_name', borrowerName)

  const { count, error } = await request
  if (error) throw error
  return count ?? 0
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
