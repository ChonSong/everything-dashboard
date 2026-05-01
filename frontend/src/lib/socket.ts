import { io, Socket } from 'socket.io-client'

// Socket.io client singleton — connects to the Express backend on port 3001
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
})
