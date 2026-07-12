import express from 'express'
import * as librariesController from './libraries.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', authenticate, librariesController.list)
router.post('/', authenticate, librariesController.create)
router.put('/:id', authenticate, librariesController.update)
router.delete('/:id', authenticate, librariesController.remove)

export default router
