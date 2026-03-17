import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'

export const markdownRouter = Router()

const DATA_DIR = process.env.DATA_DIR || './data/markdown'

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// GET /api/files - List all markdown files
markdownRouter.get('/', async (req, res) => {
  try {
    await ensureDataDir()
    const files = await fs.readdir(DATA_DIR)
    const markdownFiles = files.filter(f => f.endsWith('.md'))
    
    const fileList = await Promise.all(
      markdownFiles.map(async (filename) => {
        const filePath = path.join(DATA_DIR, filename)
        const stats = await fs.stat(filePath)
        const content = await fs.readFile(filePath, 'utf-8')
        const preview = content.slice(0, 100).replace(/[#*`\n]/g, ' ').trim()
        
        return {
          id: filename.replace('.md', ''),
          name: filename,
          preview: preview + (content.length > 100 ? '...' : ''),
          updatedAt: stats.mtime
        }
      })
    )
    
    res.json(fileList)
  } catch (error) {
    console.error('Error listing files:', error)
    res.status(500).json({ error: 'Failed to list files' })
  }
})

// GET /api/files/:id - Get file content
markdownRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const filePath = path.join(DATA_DIR, `${id}.md`)
    
    const content = await fs.readFile(filePath, 'utf-8')
    res.json({ id, name: `${id}.md`, content })
  } catch (error) {
    console.error('Error reading file:', error)
    res.status(404).json({ error: 'File not found' })
  }
})

// POST /api/files - Create new file
markdownRouter.post('/', async (req, res) => {
  try {
    const { name, content = '' } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'File name is required' })
    }
    
    await ensureDataDir()
    
    const filename = name.endsWith('.md') ? name : `${name}.md`
    const filePath = path.join(DATA_DIR, filename)
    
    // Check if file exists
    try {
      await fs.access(filePath)
      return res.status(409).json({ error: 'File already exists' })
    } catch {
      // File doesn't exist, proceed to create
    }
    
    await fs.writeFile(filePath, content, 'utf-8')
    
    res.status(201).json({ 
      id: filename.replace('.md', ''), 
      name: filename, 
      content 
    })
  } catch (error) {
    console.error('Error creating file:', error)
    res.status(500).json({ error: 'Failed to create file' })
  }
})

// PUT /api/files/:id - Update file
markdownRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    
    const filePath = path.join(DATA_DIR, `${id}.md`)
    
    await fs.writeFile(filePath, content || '', 'utf-8')
    
    res.json({ id, name: `${id}.md`, content })
  } catch (error) {
    console.error('Error updating file:', error)
    res.status(500).json({ error: 'Failed to update file' })
  }
})

// DELETE /api/files/:id - Delete file
markdownRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const filePath = path.join(DATA_DIR, `${id}.md`)
    
    await fs.unlink(filePath)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    res.status(404).json({ error: 'File not found' })
  }
})
