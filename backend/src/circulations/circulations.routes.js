import express from 'express'
import * as circulationsController from './circulations.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

const requireStaff = requireRole('admin', 'petugas')

router.get('/', authenticate, requireStaff, circulationsController.list)
router.post('/borrow', authenticate, requireStaff, circulationsController.borrow)
router.post('/return', authenticate, requireStaff, circulationsController.returnBook)

export default router
