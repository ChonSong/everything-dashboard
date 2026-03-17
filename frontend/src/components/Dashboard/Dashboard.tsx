import { Link } from 'react-router-dom'
import styles from './Dashboard.module.css'

const widgets = [
  { id: 'tasks', title: 'Task Board', icon: '▦', description: 'Kanban-style task management', path: '/editor' },
  { id: 'chat', title: 'Chat', icon: '💬', description: 'AI-powered conversations', path: '/editor' },
  { id: 'editor', title: 'Editor', icon: '✎', description: 'Markdown document editing', path: '/editor' },
  { id: 'terminal', title: 'Terminal', icon: '▸', description: 'Integrated terminal', path: '/editor' },
]

export function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <section className={styles.welcome}>
        <h2>Welcome to Everything Dashboard</h2>
        <p>Your unified workspace for tasks, notes, and AI assistance.</p>
      </section>

      <section className={styles.widgets}>
        <h3 className={styles.sectionTitle}>Widgets</h3>
        <div className={styles.widgetGrid}>
          {widgets.map((widget) => (
            <Link key={widget.id} to={widget.path} className={styles.widgetCard}>
              <div className={styles.widgetIcon}>{widget.icon}</div>
              <div className={styles.widgetContent}>
                <h4>{widget.title}</h4>
                <p>{widget.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.quickActions}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.actionButtons}>
          <Link to="/editor" className={styles.actionButton}>
            + New Document
          </Link>
          <Link to="/settings" className={styles.actionButton}>
            Configure AI
          </Link>
        </div>
      </section>
    </div>
  )
}
