import { supabase } from '../lib/supabase.js'

export const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, email, password_hash, role, full_name')
    .eq('email', email)
    .maybeSingle()

  if (error) return null
  return data
}

export const emailExists = async (email) => {
  const { data } = await supabase.from('users').select('user_id').eq('email', email).maybeSingle()
  return !!data
}

export const createUser = async ({ full_name, email, password_hash }) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ full_name, email, password_hash, role: 'petugas' }])
    .select('user_id, email, role, full_name')
    .single()

  if (error) throw error
  return data
}
