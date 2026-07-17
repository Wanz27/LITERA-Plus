import express from 'express'
import * as usersController from './users.controller.js'
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(authenticate, requireAdmin)
router.get('/', usersController.listUsers)
router.put('/:id', usersController.updateUser)
router.put('/:id/password', usersController.resetPassword)
router.delete('/:id', usersController.deleteUser)

export default router
