import express from 'express'
import multer from 'multer'
import * as booksController from './books.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const router = express.Router()

const requireStaff = requireRole('admin', 'petugas')

router.get('/', authenticate, booksController.list)
router.post('/', authenticate, requireStaff, booksController.create)
router.post('/import', authenticate, requireStaff, booksController.bulkImport)
router.post('/cover', authenticate, requireStaff, upload.single('file'), booksController.uploadCover)
router.put('/:id', authenticate, requireStaff, booksController.update)
router.patch('/:id/status', authenticate, requireStaff, booksController.updateStatus)
router.delete('/:id', authenticate, requireStaff, booksController.remove)

export default router
