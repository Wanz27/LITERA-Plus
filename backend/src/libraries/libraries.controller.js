import * as librariesService from './libraries.service.js'
import { uploadLibraryImage } from '../lib/storage.js'

export const list = async (req, res) => {
  try {
    const data = await librariesService.list()
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const create = async (req, res) => {
  try {
    const data = await librariesService.create(req.body, req.user)
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const update = async (req, res) => {
  try {
    const data = await librariesService.update(req.params.id, req.body, req.user)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const remove = async (req, res) => {
  try {
    const data = await librariesService.remove(req.params.id, req.user)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) throw new Error('File gambar wajib diunggah')
    const url = await uploadLibraryImage(req.file.buffer, req.file.originalname, req.file.mimetype)
    return res.status(201).json({ success: true, data: { url } })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}
