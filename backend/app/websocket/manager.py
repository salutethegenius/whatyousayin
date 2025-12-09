from typing import Dict, List, Set
from fastapi import WebSocket
import json
import redis
from app.core.config import settings

# Initialize Redis client for pub/sub (for future scaling)
try:
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
except:
    redis_client = None


class ConnectionManager:
    """Manages WebSocket connections per room"""
    
    def __init__(self):
        # room_id -> Set[WebSocket]
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # WebSocket -> room_id
        self.websocket_rooms: Dict[WebSocket, int] = {}
    
    async def connect(self, websocket: WebSocket, room_id: int, username: str = None):
        """Connect a WebSocket to a room"""
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        
        self.active_connections[room_id].add(websocket)
        self.websocket_rooms[websocket] = room_id

        # Track user presence if username provided
        if username:
            if not hasattr(self, 'user_connections'):
                self.user_connections: Dict[str, Set[WebSocket]] = {}
            
            if username not in self.user_connections:
                self.user_connections[username] = set()
                # Broadcast "user_online" event
                await self.broadcast_global({
                    "type": "presence",
                    "status": "online",
                    "username": username
                })
            
            self.user_connections[username].add(websocket)
    
    async def disconnect(self, websocket: WebSocket, username: str = None):
        """Disconnect a WebSocket from its room"""
        room_id = self.websocket_rooms.get(websocket)
        if room_id and room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            if len(self.active_connections[room_id]) == 0:
                del self.active_connections[room_id]
        
        self.websocket_rooms.pop(websocket, None)

        # Handle presence
        if username and hasattr(self, 'user_connections') and username in self.user_connections:
            self.user_connections[username].discard(websocket)
            if len(self.user_connections[username]) == 0:
                del self.user_connections[username]
                # Broadcast "user_offline" event
                await self.broadcast_global({
                    "type": "presence",
                    "status": "offline",
                    "username": username
                })

    async def broadcast_global(self, message: dict):
        """Broadcast to ALL connected clients"""
        for connections in self.active_connections.values():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except:
                    pass

    async def get_online_users(self) -> List[str]:
        if hasattr(self, 'user_connections'):
            return list(self.user_connections.keys())
        return []

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except RuntimeError:
            # Socket already closed or connection lost
            pass

    async def broadcast_to_room(self, message: dict, room_id: int, exclude: WebSocket = None):
        """Broadcast a message to all connections in a room"""
        if room_id not in self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections[room_id]:
            if connection == exclude:
                continue
            try:
                await connection.send_json(message)
            except:
                # Connection is dead, mark for removal
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection)
        
        # Publish to Redis for multi-instance scaling (if Redis is available)
        if redis_client:
            try:
                redis_client.publish(f"room:{room_id}", json.dumps(message))
            except:
                pass
    
    def get_room_connection_count(self, room_id: int) -> int:
        """Get the number of active connections in a room"""
        return len(self.active_connections.get(room_id, set()))


# Global connection manager instance
manager = ConnectionManager()

