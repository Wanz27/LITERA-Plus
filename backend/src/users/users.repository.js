import { supabase } from '../lib/supabase.js'

export const listUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, full_name, email, role, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const listUsersByRoles = async (roles) => {
  const { data, error } = await supabase.from('users').select('user_id, full_name, email, role').in('role', roles)

  if (error) throw error
  return data
}

export const findUserById = async (user_id) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, full_name, email, role, created_at')
    .eq('user_id', user_id)
    .maybeSingle()

  if (error) throw error
  return data
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

export const countAdmins = async () => {
  const { count, error } = await supabase
    .from('users')
    .select('user_id', { count: 'exact', head: true })
    .eq('role', 'admin')

  if (error) throw error
  return count ?? 0
}

export const updateUser = async (user_id, { full_name, email, role }) => {
  const { data, error } = await supabase
    .from('users')
    .update({ full_name, email, role })
    .eq('user_id', user_id)
    .select('user_id, full_name, email, role, created_at')
    .single()

  if (error) throw error
  return data
}

export const deleteUser = async (user_id) => {
  const { error } = await supabase.from('users').delete().eq('user_id', user_id)
  if (error) throw error
}

export const updateUserPassword = async (user_id, password_hash) => {
  const { error } = await supabase.from('users').update({ password_hash }).eq('user_id', user_id)
  if (error) throw error
}
