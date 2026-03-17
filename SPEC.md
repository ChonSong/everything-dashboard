# Everything Dashboard - Phase 1 Specification

## Project Overview
- **Name:** Everything Dashboard
- **Type:** Lightweight monolithic webapp
- **Core Functionality:** Unified dashboard with widgets (Task Board, Chat, Editor, Terminal) backed by Markdown storage and Python agent core
- **Target Users:** Developers, power users needing unified workflow management

## Technical Stack
- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express + Socket.io
- **Storage:** Plaintext Markdown files
- **Agent Core:** Python (future phases)

## Architecture

### Directory Structure
```
everything-dashboard/
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Dashboard/    # Main dashboard layout
│   │   │   ├── Widgets/      # Widget components
│   │   │   │   ├── TaskBoard/
│   │   │   │   ├── Chat/
│   │   │   │   ├── Editor/
│   │   │   │   └── Terminal/
│   │   │   ├── Editor/       # Markdown editor (Milkdown/TipTap)
│   │   │   └── Settings/     # Settings tab (Nanobot WebGUI)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities
│   │   ├── stores/           # State management
│   │   └── App.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js Express server
│   ├── src/
│   │   ├── routes/           # API routes
│   │   │   └── markdown.ts   # Markdown CRUD
│   │   ├── socket/           # Socket.io handlers
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml        # Deployment config
└── SPEC.md                   # This file
```

### Phase 1 Scope (MVP)
1. React frontend with Dashboard layout
2. Markdown editor component (using TipTap or Milkdown)
3. Express backend with Markdown file CRUD
4. Basic file structure

### Future Phases (Out of Scope)
- Task Board widget
- Chat widget
- Terminal widget
- Agent daemon
- LiteLLM integration
- Kanban from Markdown

## UI/UX Specification

### Dashboard Layout
- **Sidebar:** Collapsible navigation (240px expanded, 64px collapsed)
- **Main Area:** Grid-based widget container
- **Header:** Minimal top bar with title + settings icon

### Color Palette
```css
--bg-primary: #0f0f0f;
--bg-secondary: #1a1a1a;
--bg-tertiary: #252525;
--text-primary: #ffffff;
--text-secondary: #a0a0a0;
--accent: #6366f1;
--accent-hover: #818cf8;
--border: #333333;
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
```

### Typography
- **Font Family:** Inter, system-ui, sans-serif
- **Headings:** 600 weight
- **Body:** 400 weight, 14px base
- **Monospace:** JetBrains Mono (for terminal/code)

### Components

#### Markdown Editor
- Toolbar: Bold, Italic, Heading, List, Code, Link
- Split view: Editor | Preview
- Auto-save indicator
- Syntax highlighting

#### Dashboard Widget Container
- Grid layout (responsive)
- Widget cards with title + content
- Drag handle for reordering (future)

## Functionality Specification

### Core Features (Phase 1)
1. **Dashboard View** - Main entry point with widget grid
2. **Markdown Editor** - Rich text editing with TipTap
3. **File Operations** - Create, read, update, delete Markdown files via API
4. **Settings Tab** - Placeholder for future Nanobot config

### API Endpoints (Phase 1)
```
GET    /api/files           - List all markdown files
GET    /api/files/:id       - Get file content
POST   /api/files           - Create new file
PUT    /api/files/:id       - Update file
DELETE /api/files/:id       - Delete file
```

### Data Flow
1. User interacts with React frontend
2. Frontend calls Express API
3. Express reads/writes Markdown files to disk
4. Response returned to frontend

## Acceptance Criteria

### Visual Checkpoints
- [ ] Dashboard loads with sidebar and main area
- [ ] Sidebar shows navigation items (Dashboard, Editor, Settings)
- [ ] Markdown editor renders with toolbar
- [ ] Editor supports basic formatting (bold, italic, headings)
- [ ] Dark theme applied consistently

### Functional Checkpoints
- [ ] Frontend builds without errors (`npm run build`)
- [ ] Backend starts without errors (`npm run dev`)
- [ ] API returns file list
- [ ] Can create new markdown file via API
- [ ] Can update existing file via API

### Quality Gates
- [ ] TypeScript compiles without errors
- [ ] No console errors on page load
- [ ] Responsive layout works at 1024px+ width
