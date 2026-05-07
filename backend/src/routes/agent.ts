import { Router } from 'express'
import { EventEmitter } from 'events'

export const agentRouter = Router()
export const agentEvents = new EventEmitter()

// Hermes API Server — http://localhost:8642 (hermes gateway with API server enabled)
const HERMES_API_URL = process.env.HERMES_API_URL || 'http://127.0.0.1:8642'
const HERMES_API_KEY = process.env.HERMES_API_KEY || 'change-me-local-dev'
const HERMES_MODEL  = process.env.HERMES_MODEL  || 'hermes-agent'

// Health check — verify Hermes API server is reachable
agentRouter.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${HERMES_API_URL}/health`, {
      headers: { Authorization: `Bearer ${HERMES_API_KEY}` },
    })
    if (!r.ok) {
      res.json({ status: 'error', ready: false, detail: `Hermes returned ${r.status}` })
      return
    }
    const data = await r.json() as any
    res.json({ status: 'ok', ready: true, ...data })
  } catch (err: any) {
    res.json({ status: 'unreachable', ready: false, detail: err.message })
  }
})

// POST /api/agent/run — stateless OpenAI-format chat completion via Hermes
agentRouter.post('/run', async (req, res) => {
  const { message, session = 'dashboard', stream = false } = req.body as {
    message?: string
    session?: string
    stream?: boolean
  }

  if (!message) {
    res.status(400).json({ error: 'message is required' })
    return
  }

  try {
    const upstreamRes = await fetch(`${HERMES_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HERMES_API_KEY}`,
      },
      body: JSON.stringify({
        model: HERMES_MODEL,
        messages: [{ role: 'user', content: message }],
        stream,
        // Hermes supports conversation key for multi-turn sessions
        ...(session ? { conversation: session } : {}),
      }),
    })

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text()
      console.error(`[agent] Hermes API error ${upstreamRes.status}: ${errText}`)
      res.status(502).json({ error: `Hermes error: ${upstreamRes.status}`, detail: errText })
      return
    }

    const data = await upstreamRes.json()
    res.json(data)
  } catch (err: any) {
    console.error('[agent] /run error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/agent/forward — receive events from Hermes and re-emit via Socket.io
// Hermes (via gateway config) POSTs its stream events here; we relay to frontend sockets.
agentRouter.post('/forward', (req, res) => {
  const { event, data } = req.body as { event: string; data: any }
  if (!event) {
    res.status(400).json({ error: 'event is required' })
    return
  }
  // Emit to local Express socket.io clients
  ;(global as any).__io?.emit(event, data)
  // Also emit on our own EventEmitter for any other local listeners
  agentEvents.emit(event, data)
  res.json({ ok: true })
})

// GET /api/agent/aie-events — tail the Hermes events JSONL log (if present)
agentRouter.get('/aie-events', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 500)
  const logPath = process.env.AIE_LOG_PATH || '/opt/data/aie-logs/agent-events.jsonl'

  try {
    const { readFileSync } = await import('fs')
    const content = readFileSync(logPath, 'utf-8')
    const lines = content.trim().split('\n').slice(-limit)
    const events = lines
      .map((l: string) => {
        try { return JSON.parse(l) }
        catch { return null }
      })
      .filter(Boolean)
    res.json({ events })
  } catch {
    res.json({ events: [] })
  }
})
