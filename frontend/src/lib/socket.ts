import { io, Socket } from 'socket.io-client'

// Socket.io client singleton — connects to the Express backend on port 3001
// The backend acts as a relay for Hermes Agent stream events (forwarded via /api/agent/forward)
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
})

// Hermes event types (relayed through the Express backend)
export interface HermesStartEvent {
  session_id: string
  model: string
}

export interface HermesOutputEvent {
  content: string
  tool_calls?: HermesToolCall[]
  tool_results?: HermesToolResult[]
  reasoning?: string
}

export interface HermesToolCall {
  name: string
  arguments: Record<string, unknown>
  id: string
}

export interface HermesToolResult {
  tool_call_id: string
  result: string
  success: boolean
}

export interface HermesEndEvent {
  session_id: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  done: boolean
}

export type HermesEventMap = {
  start: HermesStartEvent
  output: HermesOutputEvent
  end: HermesEndEvent
}
