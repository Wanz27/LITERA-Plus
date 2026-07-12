import * as activityRepo from './activity.repository.js'

export const list = async (req, res) => {
  try {
    const data = await activityRepo.listActivity()
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
