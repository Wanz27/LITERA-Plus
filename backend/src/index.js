import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './auth/auth.routes.js'
import librariesRoutes from './libraries/libraries.routes.js'
import booksRoutes from './books/books.routes.js'
import activityRoutes from './activity/activity.routes.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// 1. Base & Health Check Routes
app.get('/', (req, res) => res.json({ success: true, message: 'LITERA+ API Server is running!' }))
app.get('/api/health', (req, res) => res.json({ success: true, message: 'LITERA+ API aktif' }))

// 2. Application Feature Routes
app.use('/api/auth', authRoutes)
app.use('/api/libraries', librariesRoutes)
app.use('/api/books', booksRoutes)
app.use('/api/activity-log', activityRoutes)

// 3. Server Listener (Untuk Local Development)
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`LITERA+ API berjalan di port ${PORT}`))

export default app