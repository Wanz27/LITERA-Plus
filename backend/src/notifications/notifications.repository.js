import { supabase } from '../lib/supabase.js'

const COLUMNS = 'id, recipient_user_id, type, message, circulation_id, library_id, is_read, created_at'

export const listForUser = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select(COLUMNS)
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

export const countUnread = async (userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_user_id', userId)
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

export const createNotification = async ({ recipient_user_id, type, message, circulation_id, library_id }) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{ recipient_user_id, type, message, circulation_id: circulation_id ?? null, library_id: library_id ?? null }])

  if (error) throw error
}

export const createNotificationsForUsers = async (userIds, { type, message, circulation_id, library_id }) => {
  if (!userIds.length) return
  const rows = userIds.map((recipient_user_id) => ({
    recipient_user_id,
    type,
    message,
    circulation_id: circulation_id ?? null,
    library_id: library_id ?? null,
  }))
  const { error } = await supabase.from('notifications').insert(rows)
  if (error) throw error
}

export const markAsRead = async (id, userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('recipient_user_id', userId)
    .select(COLUMNS)
    .maybeSingle()

  if (error) throw error
  return data
}

export const markAllAsRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}
