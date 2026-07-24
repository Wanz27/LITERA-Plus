import express from 'express'
import * as circulationsController from './circulations.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

const requireStaff = requireRole('admin', 'petugas')

router.get('/', authenticate, requireStaff, circulationsController.list)
router.get('/borrowers', authenticate, requireStaff, circulationsController.searchBorrowers)
router.post('/borrow', authenticate, requireStaff, circulationsController.borrow)
router.post('/return', authenticate, requireStaff, circulationsController.returnBook)
router.post('/request', authenticate, circulationsController.requestBorrow)
router.put('/:id/approve', authenticate, requireStaff, circulationsController.approveRequest)
router.put('/:id/reject', authenticate, requireStaff, circulationsController.rejectRequest)

export default router
