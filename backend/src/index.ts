import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { markdownRouter } from './routes/markdown.js'

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

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })

  // Agent streaming events (for future phases)
  socket.on('agent:start', (data) => {
    socket.broadcast.emit('agent:output', { type: 'start', data })
  })

  socket.on('agent:output', (data) => {
    socket.broadcast.emit('agent:output', data)
  })

  socket.on('agent:end', (data) => {
    socket.broadcast.emit('agent:output', { type: 'end', data })
  })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { io }
