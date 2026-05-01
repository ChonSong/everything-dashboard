# Agent Core — Python nanobot sidecar for everything-dashboard
FROM python:3.11-slim

WORKDIR /app

# Install nanobot from source + runtime deps
COPY nanobot/ ./nanobot/
COPY core/ ./core/
COPY requirements.txt ./
RUN pip install --no-cache-dir -e ./nanobot \
    && pip install --no-cache-dir aiohttp httpx

# Expose the nanobot serve API port
EXPOSE 8001

# Workspace directory
RUN mkdir -p /tmp/agent-workspace

CMD ["python3", "-m", "nanobot", "serve", "--port", "8001", "--host", "0.0.0.0", "--workspace", "/tmp/agent-workspace"]
