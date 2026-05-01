import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { markdownRouter } from './routes/markdown.js'
import { agentRouter, agentEvents } from './routes/agent.js'

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

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })

  // Forward agent events to all connected clients
  agentEvents.on('agent:start', (data) => socket.emit('agent:start', data))
  agentEvents.on('agent:output', (data) => socket.emit('agent:output', data))
  agentEvents.on('agent:end', (data) => socket.emit('agent:end', data))
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Expose io globally for the agent forward route
;(global as any).__io = io

export { io }
