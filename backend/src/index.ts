import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { markdownRouter } from './routes/markdown.js'
import { agentRouter } from './routes/agent.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/files', markdownRouter)
app.use('/api/agent', agentRouter)

// Socket.IO — expose io globally so the /api/agent/forward route can use it
// to relay Hermes stream events to connected React clients.
io.on('connection', (socket) => {
  console.log('[socket] client connected:', socket.id)
  socket.on('disconnect', () => {
    console.log('[socket] client disconnected:', socket.id)
  })
})
;(global as any).__io = io

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { io }
