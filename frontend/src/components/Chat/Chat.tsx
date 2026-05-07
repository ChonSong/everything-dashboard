import { useState, useRef, useEffect, useCallback } from 'react'
import { socket, type HermesOutputEvent, type HermesToolCall } from '../../lib/socket'
import styles from './Chat.module.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  tools_used?: string[]
  timestamp: Date
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Track the last assistant message id so we can stream into it
  const lastAssistantIdRef = useRef<string | null>(null)

  // Connect socket on mount
  useEffect(() => {
    socket.connect()

    // Hermes 'start' event — agent is beginning a response
    socket.on('start', (data: any) => {
      console.log('[chat] session start:', data)
    })

    // Hermes 'output' event — streaming text and/or tool calls from Hermes Agent
    // Hermes payload shape:
    // {
    //   content: string,           // streamed text content (may be incremental)
    //   tool_calls?: Array<{       // tool calls being made
    //     name: string,
    //     arguments: Record<string, unknown>,
    //     id: string
    //   }>,
    //   tool_results?: Array<{     // results of previously-called tools
    //     tool_call_id: string,
    //     result: string,
    //     success: boolean
    //   }>,
    //   reasoning?: string         // optional reasoning trace
    // }
    socket.on('output', (data: HermesOutputEvent) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1]

        // If the last message is an assistant message, stream into it
        if (last?.role === 'assistant' && last.id === lastAssistantIdRef.current) {
          // Merge tool_calls if present (don't lose previously shown tools)
          const existingTools = last.tools_used ?? []
          const newToolNames = data.tool_calls?.map((tc) => tc.name) ?? []
          const mergedTools = [...new Set([...existingTools, ...newToolNames])]

          return prev.map((m, i) =>
            i === prev.length - 1
              ? {
                  ...m,
                  content: m.content + (data.content ?? ''),
                  tools_used: mergedTools.length > 0 ? mergedTools : m.tools_used,
                }
              : m
          )
        }

        // Otherwise create a new assistant message
        const assistantMsg: Message = {
          id: lastAssistantIdRef.current ?? Date.now().toString(),
          role: 'assistant',
          content: data.content ?? '',
          tools_used: data.tool_calls?.map((tc) => tc.name),
          timestamp: new Date(),
        }
        return [...prev, assistantMsg]
      })
    })

    // Hermes 'end' event — agent finished
    socket.on('end', (data: any) => {
      console.log('[chat] session end:', data)
      setLoading(false)
      lastAssistantIdRef.current = null
    })

    socket.on('connect', () => console.log('[chat] socket connected'))
    socket.on('disconnect', () => console.log('[chat] socket disconnected'))

    return () => {
      socket.off('start')
      socket.off('output')
      socket.off('end')
      socket.disconnect()
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    // Set a placeholder assistant id for streaming to target
    lastAssistantIdRef.current = (Date.now() + 1).toString()

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session: 'dashboard' }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const assistantMsg: Message = {
        id: lastAssistantIdRef.current,
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || '(no content)',
        tools_used: undefined,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      lastAssistantIdRef.current = null
    }
  }, [input, loading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={styles.chat}>
      <div className={styles.header}>
        <h2>🤖 Agent Chat</h2>
        <span className={styles.status}>
          {loading ? '⏳ thinking...' : '✓ ready'}
        </span>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            <p>Ask me anything — I'll use tools to help you.</p>
            <p className={styles.hint}>
              Try: &quot;List the files in /tmp&quot; or &quot;Search the web for nanobot github&quot;
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.role}>{msg.role === 'user' ? '👤' : '🤖'}</div>
            <div className={styles.content}>
              <p>{msg.content}</p>
              {msg.tools_used && msg.tools_used.length > 0 && (
                <div className={styles.tools}>
                  {msg.tools_used.map((t) => (
                    <span key={t} className={styles.tool}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className={`${styles.message} ${styles.assistant} ${styles.loading}`}>
            <div className={styles.role}>🤖</div>
            <div className={styles.content}><p>...</p></div>
          </div>
        )}
        {error && (
          <div className={styles.error}>
            ⚠️ Error: {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the agent... (Enter to send, Shift+Enter for newline)"
          rows={2}
          disabled={loading}
        />
        <button
          className={styles.sendBtn}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  )
}
