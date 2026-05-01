import { useState, useRef, useEffect, useCallback } from 'react'
import { socket } from '../../lib/socket'
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

  // Connect socket on mount
  useEffect(() => {
    socket.connect()

    socket.on('agent:output', (data: any) => {
      if (data?.type === 'start') return
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && data?.content) {
          // Streaming update
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: m.content + (data.content || '') }
              : m
          )
        } else if (data?.content) {
          return [...prev, {
            id: Date.now().toString(),
            role: 'assistant' as const,
            content: data.content,
            tools_used: data.tools_used,
            timestamp: new Date(),
          }]
        }
        return prev
      })
    })

    socket.on('agent:end', () => {
      setLoading(false)
    })

    socket.on('connect', () => console.log('[chat] socket connected'))
    socket.on('disconnect', () => console.log('[chat] socket disconnected'))

    return () => {
      socket.off('agent:output')
      socket.off('agent:end')
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
        id: (Date.now() + 1).toString(),
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
              Try: "List the files in /tmp" or "Search the web for nanobot github"
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
