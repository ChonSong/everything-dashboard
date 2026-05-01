"""Socket.io event emitter — forwards nanobot events to Express via HTTP."""
from __future__ import annotations

import httpx


class AgentEventEmitter:
    """Forwards agent events to Express backend via HTTP POST.

    Express exposes POST /api/agent/forward which re-emits to Socket.io clients.
    """

    def __init__(self, express_url: str = "http://localhost:3001"):
        self.express_url = express_url

    async def emit(self, event_name: str, data: dict) -> None:
        """Forward event to Express Socket.io bridge."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{self.express_url}/api/agent/forward",
                    json={"event": event_name, "data": data},
                )
        except Exception:
            # Silently fail — don't let emit errors crash the agent
            pass
