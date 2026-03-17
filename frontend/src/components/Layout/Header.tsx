import styles from './Header.module.css'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Everything Dashboard' }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.actions}>
        <button className={styles.iconButton} aria-label="Notifications">
          🔔
        </button>
        <button className={styles.iconButton} aria-label="Search">
          🔍
        </button>
      </div>
    </header>
  )
}
