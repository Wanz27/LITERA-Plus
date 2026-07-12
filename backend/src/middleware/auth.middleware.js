import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'litera-secret-fallback'

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' })
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kedaluwarsa' })
  }
}
