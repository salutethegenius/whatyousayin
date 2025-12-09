from app.db.session import Base

# Import all models here so Alembic can discover them
from app.models.user import User
from app.models.room import Room
from app.models.message import Message

__all__ = ["Base", "User", "Room", "Message"]

