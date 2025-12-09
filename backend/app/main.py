from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="What You Sayin' API",
    description="Bahamian Chat Platform API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.api.routes import auth, users, rooms, messages, websocket

app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])
app.include_router(messages.router, prefix="/api", tags=["messages"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "What You Sayin' API is running",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    return {
        "message": "What You Sayin' API",
        "docs": "/docs",
        "health": "/health"
    }

