"""Python Agent Core — wraps HKUDS/nanobot for everything-dashboard."""
from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from nanobot import Nanobot

from .aie_client import AIEClient
from .transmute_client import TransmuteClient
from .event_emitter import AgentEventEmitter


class AgentCore:
    """Async nanobot wrapper with AIE logging and blueprint injection.

    Exposes: async run(user_message: str, session_key: str) -> dict
    """

    def __init__(self, workspace: str | None = None):
        self.workspace = Path(workspace or "/tmp/agent-workspace")
        self.workspace.mkdir(parents=True, exist_ok=True)

        self.nanobot = Nanobot.from_config(workspace=str(self.workspace))
        self.aie = AIEClient()
        self.transmute = TransmuteClient()
        self._emitter = AgentEventEmitter()

    async def run(self, user_message: str, session_key: str = "default") -> dict[str, Any]:
        """Run nanobot on user_message with AIE logging and blueprint injection."""
        ts = datetime.now(timezone.utc).isoformat()

        # Emit start to Socket.io
        await self._emitter.emit("agent:start", {
            "message": user_message,
            "session": session_key,
            "timestamp": ts,
        })

        # Pre-task: log delegation event to AIE
        await self.aie.log_event({
            "type": "delegation",
            "timestamp": ts,
            "data": {
                "session": session_key,
                "message": user_message,
                "agent": "nanobot",
            },
        })

        # Optional: search repo-transmute for relevant blueprints
        blueprints: list[dict] = []
        try:
            blueprints = await self.transmute.search(user_message, top_k=3)
        except Exception:
            pass  # Transmute is optional; don't crash if unavailable

        # Inject blueprints into context
        enriched_message = self._inject_blueprints(user_message, blueprints)

        # Run nanobot
        result = await self.nanobot.run(enriched_message, session_key=session_key)

        # Post-task: log completion to AIE
        await self.aie.log_event({
            "type": "task_complete",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "session": session_key,
                "tools_used": result.tools_used,
                "content_length": len(result.content),
            },
        })

        # Emit output to Socket.io
        await self._emitter.emit("agent:output", {
            "content": result.content,
            "tools_used": result.tools_used,
            "messages": result.messages,
        })
        await self._emitter.emit("agent:end", {"session": session_key})

        return {
            "content": result.content,
            "tools_used": result.tools_used,
            "messages": result.messages,
        }

    def _inject_blueprints(self, message: str, blueprints: list[dict]) -> str:
        """Prepend relevant repo-transmute blueprints to the user message."""
        if not blueprints:
            return message
        header = "\n\n## Relevant Code Blueprints\n"
        for i, bp in enumerate(blueprints, 1):
            code = bp.get("code", "")
            header += f"\n### Blueprint {i}: {bp.get('name', 'unknown')}\n```\n{code}\n```\n"
        return header + message
