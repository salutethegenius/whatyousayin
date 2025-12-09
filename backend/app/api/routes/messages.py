from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models.message import Message
from app.models.room import Room
from app.models.user import User
from app.schemas.message import MessageCreate, MessageResponse
from app.core.security import get_current_user
from app.services.moderation import moderate_content

router = APIRouter()


@router.get("/rooms/{room_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    room_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get messages for a room (paginated)"""
    # Verify room exists and is public
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    if not room.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Room is private"
        )
    
    messages = (
        db.query(Message)
        .filter(Message.room_id == room_id)
        .order_by(Message.created_at)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return messages


@router.post("/rooms/{room_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    room_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to a room (authenticated users only)"""
    # Verify room exists and is public
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    if not room.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Room is private"
        )
    
    # Verify reply_to message exists if provided
    if message_data.reply_to_id:
        reply_message = db.query(Message).filter(Message.id == message_data.reply_to_id).first()
        if not reply_message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reply message not found"
            )
        if reply_message.room_id != room_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reply message is not in this room"
            )
    
    # Moderate content
    is_safe, reason = moderate_content(message_data.content)
    if not is_safe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason or "Message content violates community guidelines"
        )
    
    db_message = Message(
        content=message_data.content,
        room_id=room_id,
        user_id=current_user.id,
        reply_to_id=message_data.reply_to_id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


@router.post("/messages/{message_id}/reply", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def reply_to_message(
    message_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reply to a specific message (convenience endpoint)"""
    # Get the original message
    original_message = db.query(Message).filter(Message.id == message_id).first()
    if not original_message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Moderate content
    is_safe, reason = moderate_content(message_data.content)
    if not is_safe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason or "Message content violates community guidelines"
        )
    
    # Create reply
    db_message = Message(
        content=message_data.content,
        room_id=original_message.room_id,
        user_id=current_user.id,
        reply_to_id=message_id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

