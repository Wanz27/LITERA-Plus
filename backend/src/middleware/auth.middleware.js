import jwt from 'jsonwebtoken'
import * as authRepo from '../auth/auth.repository.js'

const JWT_SECRET = process.env.JWT_SECRET || 'litera-secret-fallback'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await authRepo.findUserById(decoded.user_id)

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token tidak valid atau kedaluwarsa' })
    }

    const { password_hash, ...safeUser } = user
    req.user = safeUser
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kedaluwarsa' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses khusus admin' })
  }
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak untuk role ini' })
    }
    next()
  }
}
