import * as circulationsService from './circulations.service.js'

export const list = async (req, res) => {
  try {
    const data = await circulationsService.list(req.query.library_id, req.query.status)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const searchBorrowers = async (req, res) => {
  try {
    const data = await circulationsService.searchBorrowers(req.query.library_id, req.query.query)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const borrow = async (req, res) => {
  try {
    const data = await circulationsService.borrow(req.body, req.user)
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const returnBook = async (req, res) => {
  try {
    const data = await circulationsService.returnBook(req.body, req.user)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}
