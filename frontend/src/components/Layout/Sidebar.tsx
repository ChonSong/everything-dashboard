import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import styles from './Sidebar.module.css'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '◫' },
  { path: '/agent', label: 'Agent', icon: '🤖' },
  { path: '/agent/observe', label: 'Observability', icon: '📊' },
  { path: '/editor', label: 'Editor', icon: '✎' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>◆</span>
        {!collapsed && <span className={styles.logoText}>Everything</span>}
      </div>
      
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button 
        className={styles.toggle}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '→' : '←'}
      </button>
    </aside>
  )
}
