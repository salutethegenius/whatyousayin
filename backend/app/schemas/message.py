from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserResponse


class MessageBase(BaseModel):
    content: str
    reply_to_id: Optional[int] = None
    recipient_id: Optional[int] = None
    room_id: Optional[int] = None


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[UserResponse] = None
    reply_to: Optional['MessageResponse'] = None
    recipient: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# Update forward reference
MessageResponse.model_rebuild()

