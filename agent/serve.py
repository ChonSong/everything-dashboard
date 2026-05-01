#!/usr/bin/env python3
"""Start nanobot serve HTTP sidecar for everything-dashboard.

Usage: python serve.py [--port 8001] [--workspace /tmp/agent-workspace]
nanobot serve exposes an OpenAI-compatible /v1/chat/completions API.
Express proxies /api/agent/* → localhost:8001.
"""
import argparse
import sys
import os

# Ensure parent dir (nanobot) is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nanobot.api import serve

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="nanobot serve sidecar")
    parser.add_argument("--port", type=int, default=8001)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--workspace", default="/tmp/agent-workspace")
    args = parser.parse_args()

    # Override workspace before serve starts
    os.environ["NANOBOT_WORKSPACE"] = args.workspace

    serve(port=args.port, host=args.host)
