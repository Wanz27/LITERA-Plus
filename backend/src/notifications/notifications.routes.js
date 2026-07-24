import express from 'express'
import * as notificationsController from './notifications.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', authenticate, notificationsController.list)
router.put('/read-all', authenticate, notificationsController.markAllAsRead)
router.put('/:id/read', authenticate, notificationsController.markAsRead)

export default router
