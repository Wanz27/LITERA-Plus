import express from 'express'
import * as activityController from './activity.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', authenticate, activityController.list)

export default router
