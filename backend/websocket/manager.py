import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

ws_router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, batch_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(batch_id, []).append(websocket)

    async def disconnect(self, batch_id: str, websocket: WebSocket):
        async with self._lock:
            conns = self._connections.get(batch_id, [])
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                self._connections.pop(batch_id, None)

    async def send_progress(self, batch_id: str, data: dict[str, Any]):
        async with self._lock:
            conns = list(self._connections.get(batch_id, []))
        dead: list[WebSocket] = []
        for ws in conns:
            try:
                await ws.send_text(json.dumps(data, ensure_ascii=False))
            except Exception:
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    conns = self._connections.get(batch_id, [])
                    if ws in conns:
                        conns.remove(ws)


manager = ConnectionManager()


@ws_router.websocket("/ws/batch/{batch_id}")
async def batch_ws(websocket: WebSocket, batch_id: str):
    await manager.connect(batch_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(batch_id, websocket)
