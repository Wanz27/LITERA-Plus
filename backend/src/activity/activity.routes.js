import express from 'express'
import * as activityController from './activity.controller.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', authenticate, requireRole('admin', 'petugas'), activityController.list)

export default router
