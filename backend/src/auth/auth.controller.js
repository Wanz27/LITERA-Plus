import * as authService from './auth.service.js'

export const login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body
    const loginIdentifier = identifier || email
    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' })
    }
    const result = await authService.login(loginIdentifier, password)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message })
  }
}

export const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body
    const result = await authService.register({ full_name, email, password })
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const getMe = async (req, res) => {
  return res.status(200).json({ success: true, data: req.user })
}

export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi' })
    }
    const result = await authService.checkEmail(email)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const updateMe = async (req, res) => {
  try {
    const { full_name, email } = req.body
    const result = await authService.updateProfile(req.user.user_id, { full_name, email })
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body
    await authService.changePassword(req.user.user_id, { current_password, new_password })
    return res.status(200).json({ success: true, data: { message: 'Password berhasil diubah' } })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}
