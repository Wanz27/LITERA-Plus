import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as authRepo from './auth.repository.js'
import * as activityRepo from '../activity/activity.repository.js'

const JWT_SECRET = process.env.JWT_SECRET || 'litera-secret-fallback'
const JWT_EXPIRES_IN = '7d'

function signToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export const login = async (identifier, password) => {
  const user = await authRepo.findUserByEmail(identifier)
  if (!user) throw new Error('Email atau password salah')

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) throw new Error('Email atau password salah')

  const token = signToken(user)
  const { password_hash, ...safeUser } = user
  return { token, user: safeUser }
}

export const register = async ({ full_name, email, password }) => {
  if (!full_name) throw new Error('Nama lengkap wajib diisi')
  if (!email) throw new Error('Email wajib diisi')
  if (!password || password.length < 8) throw new Error('Password minimal 8 karakter')
  if (!/[^A-Za-z0-9]/.test(password)) throw new Error('Password harus mengandung 1 karakter spesial')

  const exists = await authRepo.emailExists(email)
  if (exists) throw new Error('Email sudah terdaftar')

  const password_hash = await bcrypt.hash(password, 10)
  const user = await authRepo.createUser({ full_name, email, password_hash })

  const token = signToken(user)
  return { token, user }
}

export const checkEmail = async (email) => {
  const exists = await authRepo.emailExists(email)
  return { exists }
}

export const updateProfile = async (user_id, { full_name, email }) => {
  if (!full_name || !full_name.trim()) throw new Error('Nama lengkap wajib diisi')
  if (!email || !email.trim()) throw new Error('Email wajib diisi')

  const exists = await authRepo.emailExistsExcluding(email.trim(), user_id)
  if (exists) throw new Error('Email sudah digunakan akun lain')

  const user = await authRepo.updateUserProfile(user_id, {
    full_name: full_name.trim(),
    email: email.trim(),
  })

  await activityRepo.createActivity({
    aksi: 'Memperbarui Profil',
    detail: `${user.full_name} memperbarui data akun.`,
    pelaku: user.full_name,
  })

  const token = signToken(user)
  return { token, user }
}

export const changePassword = async (user_id, { current_password, new_password }) => {
  if (!current_password || !new_password) throw new Error('Password saat ini dan password baru wajib diisi')
  if (new_password.length < 8) throw new Error('Password baru minimal 8 karakter')
  if (!/[^A-Za-z0-9]/.test(new_password)) throw new Error('Password baru harus mengandung 1 karakter spesial')

  const user = await authRepo.findUserById(user_id)
  if (!user) throw new Error('Pengguna tidak ditemukan')

  const match = await bcrypt.compare(current_password, user.password_hash)
  if (!match) throw new Error('Password saat ini salah')

  const password_hash = await bcrypt.hash(new_password, 10)
  await authRepo.updateUserPassword(user_id, password_hash)

  await activityRepo.createActivity({
    aksi: 'Mengubah Password',
    detail: `${user.full_name} mengubah password akun.`,
    pelaku: user.full_name,
  })
}
