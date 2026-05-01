#!/usr/bin/env python3
"""Quick test — verify nanobot imports and basic run works."""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def test():
    from nanobot import Nanobot
    bot = Nanobot.from_config(workspace="/tmp/test-workspace")
    result = await bot.run("Say hello in one sentence. Be concise.")
    print("Content:", result.content[:200])
    print("Tools used:", result.tools_used)

if __name__ == "__main__":
    asyncio.run(test())
