import { useState } from 'react'
import styles from './Settings.module.css'

interface SettingsSection {
  id: string
  title: string
  description: string
}

const sections: SettingsSection[] = [
  { id: 'general', title: 'General', description: 'Basic app settings' },
  { id: 'ai', title: 'AI Configuration', description: 'LLM and agent settings' },
  { id: 'appearance', title: 'Appearance', description: 'Theme and display options' },
  { id: 'storage', title: 'Storage', description: 'File and data management' },
]

export function Settings() {
  const [activeSection, setActiveSection] = useState('general')
  const [settings, setSettings] = useState({
    llmProvider: 'litellm',
    llmModel: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4096,
    theme: 'dark',
    autoSave: true,
    autoSaveInterval: 30,
  })

  return (
    <div className={styles.settings}>
      <div className={styles.sidebar}>
        <h2>Settings</h2>
        <nav className={styles.nav}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`${styles.navItem} ${activeSection === section.id ? styles.active : ''}`}
            >
              <span className={styles.navTitle}>{section.title}</span>
              <span className={styles.navDesc}>{section.description}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.content}>
        {activeSection === 'general' && (
          <div className={styles.section}>
            <h3>General Settings</h3>
            <div className={styles.field}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                />
                Enable auto-save
              </label>
              <p className={styles.hint}>Automatically save changes while editing</p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Auto-save interval (seconds)</label>
              <input
                type="number"
                className={styles.input}
                value={settings.autoSaveInterval}
                onChange={(e) => setSettings({ ...settings, autoSaveInterval: parseInt(e.target.value) })}
                min={5}
                max={300}
              />
            </div>
          </div>
        )}

        {activeSection === 'ai' && (
          <div className={styles.section}>
            <h3>AI Configuration</h3>
            <div className={styles.field}>
              <label className={styles.label}>LLM Provider</label>
              <select
                className={styles.select}
                value={settings.llmProvider}
                onChange={(e) => setSettings({ ...settings, llmProvider: e.target.value })}
              >
                <option value="litellm">LiteLLM</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="local">Local Model</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Model</label>
              <select
                className={styles.select}
                value={settings.llmModel}
                onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Temperature: {settings.temperature}</label>
              <input
                type="range"
                className={styles.range}
                min={0}
                max={1}
                step={0.1}
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Max Tokens</label>
              <input
                type="number"
                className={styles.input}
                value={settings.maxTokens}
                onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div className={styles.section}>
            <h3>Appearance</h3>
            <div className={styles.field}>
              <label className={styles.label}>Theme</label>
              <select
                className={styles.select}
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        )}

        {activeSection === 'storage' && (
          <div className={styles.section}>
            <h3>Storage</h3>
            <div className={styles.field}>
              <label className={styles.label}>Storage Location</label>
              <input
                type="text"
                className={styles.input}
                value="./data/markdown"
                readOnly
              />
              <p className={styles.hint}>Markdown files are stored as plaintext files</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
