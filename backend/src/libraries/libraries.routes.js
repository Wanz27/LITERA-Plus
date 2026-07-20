import express from 'express'
import multer from 'multer'
import * as librariesController from './libraries.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const router = express.Router()

const requireStaff = requireRole('admin', 'petugas')

router.get('/', authenticate, librariesController.list)
router.post('/', authenticate, requireStaff, librariesController.create)
router.post('/image', authenticate, requireStaff, upload.single('file'), librariesController.uploadImage)
router.put('/:id', authenticate, requireStaff, librariesController.update)
router.delete('/:id', authenticate, requireStaff, librariesController.remove)

export default router
