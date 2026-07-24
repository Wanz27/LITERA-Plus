import * as notificationsService from './notifications.service.js'

export const list = async (req, res) => {
  try {
    const data = await notificationsService.listMine(req.user)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const markAsRead = async (req, res) => {
  try {
    const data = await notificationsService.markAsRead(req.params.id, req.user)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const markAllAsRead = async (req, res) => {
  try {
    await notificationsService.markAllAsRead(req.user)
    return res.status(200).json({ success: true, data: null })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}
