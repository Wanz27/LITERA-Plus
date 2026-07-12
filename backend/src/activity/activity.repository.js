import { supabase } from '../lib/supabase.js'

export const listActivity = async () => {
  const { data, error } = await supabase
    .from('activity_log')
    .select('id, aksi, detail, pelaku, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}

export const createActivity = async ({ aksi, detail, pelaku }) => {
  const { error } = await supabase.from('activity_log').insert([{ aksi, detail, pelaku }])
  if (error) throw error
}
