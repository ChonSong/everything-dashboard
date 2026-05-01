import { Router } from 'express'
import { spawn } from 'child_process'
import { EventEmitter } from 'events'
import { readFileSync } from 'fs'

export const agentRouter = Router()
export const agentEvents = new EventEmitter()

const AGENT_SIDE_PORT = process.env.AGENT_PORT || 8001
const AGENT_HOST = '127.0.0.1'
const AGENT_WORKSPACE = process.env.AGENT_WORKSPACE || '/tmp/agent-workspace'
const NANOBOT_DIR = process.env.NANOBOT_DIR || '/opt/data/nanobot'

let nanobotProcess: ReturnType<typeof spawn> | null = null
let nanobotReady = false

// Start nanobot serve as a sidecar
function startNanobotSidecar() {
  if (nanobotProcess) return

  console.log(`[agent] starting nanobot serve on ${AGENT_HOST}:${AGENT_SIDE_PORT}...`)

  nanobotProcess = spawn('python3', [
    '-m', 'nanobot',
    'serve',
    '--port', String(AGENT_SIDE_PORT),
    '--host', AGENT_HOST,
    '--workspace', AGENT_WORKSPACE,
  ], {
    cwd: NANOBOT_DIR,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  })

  nanobotProcess.stdout?.on('data', (d) => {
    const line = d.toString().trim()
    console.log('[nanobot]', line)
    if (line.includes('Starting OpenAI-compatible API server') || line.includes('http://')) {
      nanobotReady = true
      console.log('[agent] nanobot sidecar ready')
    }
  })

  nanobotProcess.stderr?.on('data', (d) => {
    console.error('[nanobot:err]', d.toString().trim())
  })

  nanobotProcess.on('error', (e) => {
    console.error('[agent] nanobot start error:', e.message)
  })

  nanobotProcess.on('exit', (code) => {
    console.log(`[agent] nanobot sidecar exited with code ${code}`)
    nanobotProcess = null
    nanobotReady = false
  })
}

// POST /api/agent/run — run nanobot with a user message
agentRouter.post('/run', async (req, res) => {
  const { message, session = 'default' } = req.body as {
    message: string
    session?: string
  }
  if (!message) {
    res.status(400).json({ error: 'message is required' })
    return
  }

  // Wait up to 5s for nanobot to be ready
  if (!nanobotReady) {
    res.status(503).json({ error: 'nanobot sidecar not ready yet' })
    return
  }

  try {
    const apiKey = process.env.NANOBOT_API_KEY || 'nanobot-internal'
    const upstreamRes = await fetch(
      `http://${AGENT_HOST}:${AGENT_SIDE_PORT}/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          messages: [{ role: 'user', content: message }],
          stream: false,
          session_key: session,
        }),
      }
    )

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text()
      console.error(`[agent] nanobot API error ${upstreamRes.status}: ${errText}`)
      res.status(502).json({ error: `nanobot error: ${upstreamRes.status}`, detail: errText })
      return
    }

    const data = await upstreamRes.json()
    res.json(data)
  } catch (err: any) {
    console.error('[agent] /run error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/agent/forward — receive events from Python agent and re-emit via Socket.io
agentRouter.post('/forward', (req, res) => {
  const { event, data } = req.body as { event: string; data: any }
  // Forward to Socket.io connected clients
  ;(global as any).__io?.emit(event, data)
  agentEvents.emit(event, data)
  res.json({ ok: true })
})

// GET /api/agent/aie-events — tail the AIE JSONL log
agentRouter.get('/aie-events', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 500)
  const logPath = process.env.AIE_LOG_PATH || '/opt/data/aie-logs/agent-events.jsonl'

  try {
    const content = readFileSync(logPath, 'utf-8')
    const lines = content.trim().split('\n').slice(-limit)
    const events = lines
      .map((l) => {
        try { return JSON.parse(l) }
        catch { return null }
      })
      .filter(Boolean)
    res.json({ events })
  } catch {
    res.json({ events: [] })
  }
})

// GET /api/agent/health — check nanobot sidecar health
agentRouter.get('/health', async (req, res) => {
  if (!nanobotReady || !nanobotProcess) {
    res.json({ status: 'not_ready', ready: false })
    return
  }
  try {
    const healthRes = await fetch(`http://${AGENT_HOST}:${AGENT_SIDE_PORT}/health`, {
      signal: { signal: 'ABORT' } as any,
    } as any)
    const data = await healthRes.json()
    res.json({ status: 'ok', ready: true, ...data })
  } catch {
    res.json({ status: 'unreachable', ready: false })
  }
})

// Start the sidecar immediately when this module loads
startNanobotSidecar()
