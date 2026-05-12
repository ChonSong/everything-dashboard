# AGENTS.md — everything-dashboard

> Lightweight unified dashboard with widgets (Task Board, Chat, Editor, Terminal).
> Local: /opt/data/everything-dashboard

## About
Everything Dashboard is a lightweight monolithic webapp providing a unified dashboard
with pluggable widgets. Phase 1 (MVP) includes Task Board, Chat, Markdown Editor, and
Terminal widgets backed by plaintext Markdown storage and a Node.js/Express backend.

## Key Directories
| Path | Purpose |
|------|---------|
| `frontend/` | React 18 + Vite SPA |
| `frontend/src/components/` | Dashboard layout, widgets (TaskBoard, Chat, Editor, Terminal) |
| `frontend/src/stores/` | State management |
| `backend/` | Node.js + Express + Socket.io server |
| `backend/src/routes/` | API routes (Markdown CRUD) |
| `backend/src/socket/` | Socket.io handlers |
| `scripts/` | Utility scripts |
| `agent/` | Agent integration (future Python agent core) |

## Tech Stack
- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Node.js + Express + Socket.io
- **Editor:** Milkdown/TipTap (Markdown)
- **Storage:** Plaintext Markdown files
- **Deploy:** Docker Compose

## Quick Start
```bash
cd /opt/data/everything-dashboard
# Backend
cd backend && npm install && npm run dev
# Frontend
cd frontend && npm install && npm run dev
# Or with Docker
docker compose up -d
```

## Status
Phase 1 MVP — core dashboard with 4 widgets. Future phases planned for Python agent core integration.

## Integration Points
- Part of the broader "one website to rule them all" vision
- Complements hermes-web-computer (tiling AI desktop) with widget-based dashboard approach
- Markdown storage enables interoperability with other tools in the ecosystem
