import express from 'express'
import multer from 'multer'
import * as booksController from './books.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const router = express.Router()

router.get('/', authenticate, booksController.list)
router.post('/', authenticate, booksController.create)
router.post('/cover', authenticate, upload.single('file'), booksController.uploadCover)
router.put('/:id', authenticate, booksController.update)
router.delete('/:id', authenticate, booksController.remove)

export default router
