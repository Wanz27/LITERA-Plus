import * as notificationsRepo from './notifications.repository.js'

export const listMine = async (actor) => {
  if (!actor?.user_id) throw new Error('Sesi tidak valid, silakan masuk kembali.')
  const [notifications, unreadCount] = await Promise.all([
    notificationsRepo.listForUser(actor.user_id),
    notificationsRepo.countUnread(actor.user_id),
  ])
  return { notifications, unread_count: unreadCount }
}

export const markAsRead = async (id, actor) => {
  if (!actor?.user_id) throw new Error('Sesi tidak valid, silakan masuk kembali.')
  const notification = await notificationsRepo.markAsRead(id, actor.user_id)
  if (!notification) throw new Error('Notifikasi tidak ditemukan.')
  return notification
}

export const markAllAsRead = async (actor) => {
  if (!actor?.user_id) throw new Error('Sesi tidak valid, silakan masuk kembali.')
  await notificationsRepo.markAllAsRead(actor.user_id)
}
