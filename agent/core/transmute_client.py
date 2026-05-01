"""repo-transmute client — semantic blueprint search before coding tasks."""
from __future__ import annotations

import httpx
from typing import Any


class TransmuteClient:
    """Searches repo-transmute for relevant code blueprints."""

    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url

    async def search(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        """Search repo-transmute for relevant blueprints."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.base_url}/search",
                    params={"q": query, "top_k": top_k},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("results", [])
        except Exception:
            pass
        return []
