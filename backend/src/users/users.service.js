import bcrypt from 'bcryptjs'
import * as usersRepo from './users.repository.js'
import * as activityRepo from '../activity/activity.repository.js'

export const listUsers = () => usersRepo.listUsers()

export const updateUser = async (actorUser, targetId, { full_name, email, role }) => {
  if (!full_name || !full_name.trim()) throw new Error('Nama lengkap wajib diisi')
  if (!email || !email.trim()) throw new Error('Email wajib diisi')
  if (!['admin', 'petugas', 'visitor'].includes(role)) throw new Error('Role tidak valid')

  const target = await usersRepo.findUserById(targetId)
  if (!target) throw new Error('Akun tidak ditemukan')

  const emailTaken = await usersRepo.emailExistsExcluding(email.trim(), targetId)
  if (emailTaken) throw new Error('Email sudah digunakan akun lain')

  if (target.role === 'admin' && role !== 'admin') {
    const adminCount = await usersRepo.countAdmins()
    if (adminCount <= 1) throw new Error('Tidak dapat mengubah role admin terakhir')
  }

  const updated = await usersRepo.updateUser(targetId, {
    full_name: full_name.trim(),
    email: email.trim(),
    role,
  })

  await activityRepo.createActivity({
    aksi: 'Memperbarui Akun',
    detail: `${actorUser.full_name} memperbarui akun ${updated.full_name}.`,
    pelaku: actorUser.full_name,
  })

  return updated
}

export const deleteUser = async (actorUser, targetId) => {
  if (actorUser.user_id === targetId) throw new Error('Tidak dapat menghapus akun sendiri')

  const target = await usersRepo.findUserById(targetId)
  if (!target) throw new Error('Akun tidak ditemukan')

  if (target.role === 'admin') {
    const adminCount = await usersRepo.countAdmins()
    if (adminCount <= 1) throw new Error('Tidak dapat menghapus admin terakhir')
  }

  await usersRepo.deleteUser(targetId)

  await activityRepo.createActivity({
    aksi: 'Menghapus Akun',
    detail: `${actorUser.full_name} menghapus akun ${target.full_name}.`,
    pelaku: actorUser.full_name,
  })
}

export const resetPassword = async (actorUser, targetId, newPassword) => {
  if (!newPassword || newPassword.length < 8) throw new Error('Password baru minimal 8 karakter')
  if (!/[^A-Za-z0-9]/.test(newPassword)) throw new Error('Password baru harus mengandung 1 karakter spesial')

  const target = await usersRepo.findUserById(targetId)
  if (!target) throw new Error('Akun tidak ditemukan')

  const password_hash = await bcrypt.hash(newPassword, 10)
  await usersRepo.updateUserPassword(targetId, password_hash)

  await activityRepo.createActivity({
    aksi: 'Mengubah Password Akun',
    detail: `${actorUser.full_name} mengubah password akun ${target.full_name}.`,
    pelaku: actorUser.full_name,
  })
}
