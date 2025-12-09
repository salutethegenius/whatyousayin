from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserResponse


class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True


class RoomCreate(RoomBase):
    pass


class RoomResponse(RoomBase):
    id: int
    created_by: int
    created_at: datetime
    creator: Optional[UserResponse] = None

    class Config:
        from_attributes = True

