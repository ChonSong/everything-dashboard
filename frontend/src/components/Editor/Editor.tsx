import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import styles from './Editor.module.css'

export function Editor() {
  const { fileId } = useParams()
  const [fileName, setFileName] = useState('Untitled')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: '<h1>Welcome to Everything Editor</h1><p>Start typing your markdown here...</p>',
    onUpdate: () => {
      setSaveStatus('unsaved')
      // Auto-save after 1 second of no typing
      setTimeout(() => {
        setSaveStatus('saving')
        // Simulate save
        setTimeout(() => setSaveStatus('saved'), 500)
      }, 1000)
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`${styles.toolbarButton} ${editor.isActive('bold') ? styles.active : ''}`}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`${styles.toolbarButton} ${editor.isActive('italic') ? styles.active : ''}`}
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`${styles.toolbarButton} ${editor.isActive('strike') ? styles.active : ''}`}
          >
            <s>S</s>
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`${styles.toolbarButton} ${editor.isActive('heading', { level: 1 }) ? styles.active : ''}`}
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`${styles.toolbarButton} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`${styles.toolbarButton} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
          >
            H3
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`${styles.toolbarButton} ${editor.isActive('bulletList') ? styles.active : ''}`}
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${styles.toolbarButton} ${editor.isActive('orderedList') ? styles.active : ''}`}
          >
            1.
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`${styles.toolbarButton} ${editor.isActive('codeBlock') ? styles.active : ''}`}
          >
            {'</>'}
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`${styles.toolbarButton} ${editor.isActive('highlight') ? styles.active : ''}`}
          >
            🖍
          </button>
        </div>

        <div className={styles.saveStatus}>
          {saveStatus === 'saved' && <span className={styles.saved}>✓ Saved</span>}
          {saveStatus === 'saving' && <span className={styles.saving}>Saving...</span>}
          {saveStatus === 'unsaved' && <span className={styles.unsaved}>● Unsaved</span>}
        </div>
      </div>

      <EditorContent editor={editor} className={styles.editor} />
    </div>
  )
}
