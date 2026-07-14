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

export const emailExistsExcluding = async (email, user_id) => {
  const { data } = await supabase
    .from('users')
    .select('user_id')
    .eq('email', email)
    .neq('user_id', user_id)
    .maybeSingle()
  return !!data
}

export const findUserById = async (user_id) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, email, password_hash, role, full_name')
    .eq('user_id', user_id)
    .maybeSingle()

  if (error) return null
  return data
}

export const updateUserProfile = async (user_id, { full_name, email }) => {
  const { data, error } = await supabase
    .from('users')
    .update({ full_name, email })
    .eq('user_id', user_id)
    .select('user_id, email, role, full_name')
    .single()

  if (error) throw error
  return data
}

export const updateUserPassword = async (user_id, password_hash) => {
  const { error } = await supabase.from('users').update({ password_hash }).eq('user_id', user_id)
  if (error) throw error
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
