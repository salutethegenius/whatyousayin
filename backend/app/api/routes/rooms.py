from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.room import Room
from app.models.user import User
from app.schemas.room import RoomCreate, RoomResponse
from app.core.security import get_current_user

router = APIRouter()


@router.get("", response_model=List[RoomResponse])
async def list_rooms(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all public rooms"""
    rooms = db.query(Room).filter(Room.is_public == True).offset(skip).limit(limit).all()
    return rooms


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_data: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new room (authenticated users only)"""
    # Check if room name already exists
    existing_room = db.query(Room).filter(Room.name == room_data.name).first()
    if existing_room:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room name already exists"
        )
    
    db_room = Room(
        name=room_data.name,
        description=room_data.description,
        is_public=room_data.is_public,
        created_by=current_user.id
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: int,
    db: Session = Depends(get_db)
):
    """Get room details by ID"""
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
    return room

