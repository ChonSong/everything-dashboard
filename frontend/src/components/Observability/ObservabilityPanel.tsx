import { useEffect, useState } from 'react'
import styles from './Observability.module.css'

interface AIEEvent {
  type: 'delegation' | 'tool_call' | 'assumption' | 'drift' | 'circuit_open' | 'task_complete'
  timestamp: string
  data: Record<string, unknown>
}

export function ObservabilityPanel() {
  const [events, setEvents] = useState<AIEEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const r = await fetch('/api/agent/aie-events?limit=100')
        const data = await r.json()
        setEvents(data.events || [])
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, 5000)
    return () => clearInterval(interval)
  }, [])

  // Compute drift score
  const driftEvents = events.filter((e) => e.type === 'drift')
  const correctedDrift = driftEvents.filter((e) => e.data?.corrected).length
  const driftScore =
    driftEvents.length > 0
      ? Math.round((correctedDrift / driftEvents.length) * 100)
      : 100

  const circuitOpen = events.slice(-1)[0]?.type === 'circuit_open'
  const lastEvent = events[events.length - 1]

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>📊 Agent Observability</h3>
        <span
          className={styles.driftScore}
          title="Assumption correction rate — higher is better"
        >
          📈 {driftScore}% drift corrected
        </span>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Events</span>
          <span className={styles.metricValue}>{events.length}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Drift Events</span>
          <span className={styles.metricValue}>{driftEvents.length}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Circuits</span>
          {circuitOpen ? (
            <span className={`${styles.metricValue} ${styles.circuitOpen}`}>
              ⚠️ OPEN
            </span>
          ) : (
            <span className={`${styles.metricValue} ${styles.circuitOk}`}>
              ✓ normal
            </span>
          )}
        </div>
      </div>

      <div className={styles.eventFeed}>
        <div className={styles.feedHeader}>Recent Events</div>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : events.length === 0 ? (
          <div className={styles.empty}>
            No events yet — try sending a message to the agent.
          </div>
        ) : (
          events
            .slice(-50)
            .reverse()
            .map((evt, i) => (
              <div key={i} className={`${styles.eventRow} ${styles[`event-${evt.type}`]}`}>
                <span className={styles.eventType}>{evt.type}</span>
                <span className={styles.eventTime}>
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
                {evt.data?.tool && (
                  <span className={styles.eventTool}>using {String(evt.data.tool)}</span>
                )}
                {evt.data?.corrected !== undefined && (
                  <span className={styles.eventDrift}>
                    {evt.data.corrected ? '✓ corrected' : '✗ uncorrected'}
                  </span>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  )
}
