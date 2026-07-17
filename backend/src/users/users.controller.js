import * as usersService from './users.service.js'

export const listUsers = async (req, res) => {
  try {
    const data = await usersService.listUsers()
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const updateUser = async (req, res) => {
  try {
    const { full_name, email, role } = req.body
    const data = await usersService.updateUser(req.user, req.params.id, { full_name, email, role })
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const deleteUser = async (req, res) => {
  try {
    await usersService.deleteUser(req.user, req.params.id)
    return res.status(200).json({ success: true, data: { id: req.params.id } })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body
    await usersService.resetPassword(req.user, req.params.id, new_password)
    return res.status(200).json({ success: true, data: { message: 'Password berhasil diubah' } })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}
