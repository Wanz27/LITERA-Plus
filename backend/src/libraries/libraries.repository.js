import { supabase } from '../lib/supabase.js'

export const listLibraries = async () => {
  const { data, error } = await supabase
    .from('libraries')
    .select('id, nama, lokasi, status, tipe, total_koleksi, jam_operasional, kepala_unit, foto_url, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const findLibraryById = async (id) => {
  const { data, error } = await supabase.from('libraries').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createLibrary = async (payload) => {
  const { data, error } = await supabase.from('libraries').insert([payload]).select().single()
  if (error) throw error
  return data
}

export const updateLibrary = async (id, payload) => {
  const { data, error } = await supabase
    .from('libraries')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteLibrary = async (id) => {
  const { error } = await supabase.from('libraries').delete().eq('id', id)
  if (error) throw error
}
