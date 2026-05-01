"""AIE Client — async JSONL logger for agent-interaction-evaluator."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
from datetime import datetime, timezone


class AIEClient:
    """Appends JSONL events to the AIE log file."""

    def __init__(self, log_path: str = "/opt/data/aie-logs/agent-events.jsonl"):
        self.log_path = Path(log_path)
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = asyncio.Lock()

    async def log_event(self, event: dict) -> None:
        """Append a JSONL event to the AIE log."""
        line = json.dumps(event, ensure_ascii=False) + "\n"
        async with self._lock:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(line)
