from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import Optional

from app.core.config import settings
from app.core.security import get_current_user
from app.db.session import SessionLocal
from app.models.user import User
from app.models.room import Room
from app.models.message import Message
from app.websocket.manager import manager
from app.schemas.message import MessageResponse
from app.services.moderation import moderate_content

router = APIRouter()


def get_user_from_token(token: str) -> Optional[dict]:
    """Extract user info from JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username:
            return {"username": username}
    except JWTError:
        return None
    return None


@router.websocket("/system")
async def system_websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for global system events (presence, DMs)"""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    user_info = get_user_from_token(token)
    if not user_info:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Connect to system "room" (id=0) with username
    await manager.connect(websocket, 0, user_info["username"])
    
    try:
        # Send initial presence list
        online_users = await manager.get_online_users()
        await manager.send_personal_message({
            "type": "presence_sync",
            "users": online_users
        }, websocket)
        
        while True:
            data = await websocket.receive_json()
            # Handle DMs here later
            
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_info["username"])
    except Exception:
        await manager.disconnect(websocket, user_info["username"])


@router.websocket("/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: int):
    """WebSocket endpoint for real-time chat in a room"""
    # Get token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Verify token and get user info
    user_info = get_user_from_token(token)
    if not user_info:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Verify room exists and is public
    db = SessionLocal()
    try:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Room not found")
            db.close()
            return
        if not room.is_public:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Room is private")
            db.close()
            return
        
        # Connect to room with username for presence
        await manager.connect(websocket, room_id, user_info["username"])
        
        # Send welcome message
        await manager.send_personal_message({
            "type": "connected",
            "message": f"Connected to {room.name}",
            "room_id": room_id
        }, websocket)
        
        # Notify others in room
        await manager.broadcast_to_room({
            "type": "user_joined",
            "username": user_info["username"],
            "room_id": room_id
        }, room_id, exclude=websocket)
        
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_json()
                
                if data.get("type") == "message":
                    content = data.get("content", "").strip()
                    reply_to_id = data.get("reply_to_id")
                    
                    if not content:
                        continue
                    
                    # Moderate content
                    is_safe, reason = moderate_content(content)
                    if not is_safe:
                        await manager.send_personal_message({
                            "type": "error",
                            "message": reason or "Message content violates community guidelines"
                        }, websocket)
                        continue
                    
                    # Get user from database
                    user = db.query(User).filter(User.username == user_info["username"]).first()
                    if not user:
                        continue
                    
                    # Create message in database
                    db_message = Message(
                        content=content,
                        room_id=room_id,
                        user_id=user.id,
                        reply_to_id=reply_to_id
                    )
                    db.add(db_message)
                    db.commit()
                    db.refresh(db_message)
                    
                    # Prepare message response
                    message_response = {
                        "type": "message",
                        "id": db_message.id,
                        "content": db_message.content,
                        "room_id": db_message.room_id,
                        "user_id": db_message.user_id,
                        "username": user.username,
                        "reply_to_id": db_message.reply_to_id,
                        "created_at": db_message.created_at.isoformat()
                    }
                    
                    # Broadcast to all in room
                    await manager.broadcast_to_room(message_response, room_id)
                
                elif data.get("type") == "typing":
                    # Broadcast typing indicator
                    await manager.broadcast_to_room({
                        "type": "typing",
                        "username": user_info["username"],
                        "room_id": room_id
                    }, room_id, exclude=websocket)
        
        except WebSocketDisconnect:
            await manager.disconnect(websocket, user_info["username"])
            # Notify others in room
            await manager.broadcast_to_room({
                "type": "user_left",
                "username": user_info["username"],
                "room_id": room_id
            }, room_id)
        finally:
            db.close()
    
    except Exception as e:
        await manager.disconnect(websocket, user_info.get("username") if user_info else None)
        db.close()
        raise
