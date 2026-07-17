import * as booksService from './books.service.js'
import { uploadBookCover } from '../lib/storage.js'

export const list = async (req, res) => {
  try {
    const data = await booksService.list(req.query.library_id)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const create = async (req, res) => {
  try {
    const data = await booksService.create(req.body, req.user)
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const bulkImport = async (req, res) => {
  try {
    const data = await booksService.bulkImport(req.body, req.user)
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const update = async (req, res) => {
  try {
    const data = await booksService.update(req.params.id, req.body, req.user)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const remove = async (req, res) => {
  try {
    const data = await booksService.remove(req.params.id, req.user)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const uploadCover = async (req, res) => {
  try {
    if (!req.file) throw new Error('File gambar wajib diunggah')
    const url = await uploadBookCover(req.file.buffer, req.file.originalname, req.file.mimetype)
    return res.status(201).json({ success: true, data: { url } })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}
