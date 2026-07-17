import express from 'express'
import * as librariesController from './libraries.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

const requireStaff = requireRole('admin', 'petugas')

router.get('/', authenticate, librariesController.list)
router.post('/', authenticate, requireStaff, librariesController.create)
router.put('/:id', authenticate, requireStaff, librariesController.update)
router.delete('/:id', authenticate, requireStaff, librariesController.remove)

export default router
