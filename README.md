# What You Sayin' - Bahamian Chat Platform

A modern chat platform blending classic chatroom nostalgia with Discord-like UX and distinct Bahamian branding.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **Real-time**: WebSockets, Redis (pub/sub for scaling)
- **AI**: OpenAI (embeddings, moderation), Pinecone (optional)

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Quick Start with Docker

1. Clone the repository
2. Copy `.env.example` to `.env` and update values if needed
3. Run the services:
   ```bash
   docker-compose up
   ```

This will start:
- Frontend on http://localhost:3000
- Backend API on http://localhost:8000
- PostgreSQL on localhost:5432
- Redis on localhost:6379

### Local Development (without Docker)

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up database
alembic upgrade head

# Run server
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

See `.env.example` for required environment variables.

## Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
whatyousayin/
├── frontend/          # Next.js 14 app
├── backend/           # FastAPI application
├── shared/            # Shared TypeScript types
└── docker-compose.yml
```

## License

MIT

