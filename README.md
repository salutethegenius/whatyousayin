# What You Sayin' OS 🇧🇸

**The modern digital desktop for the Caribbean.**
"What You Sayin'" is a web-based operating system (WebTop) designed to connect the Bahamian community with a premium, glassmorphic interface.

## 🌟 Key Features

### 🖥️ Glassmorphic Desktop Environment
- **Web-based OS**: A full desktop experience directly in your browser.
- **Window Management**: Drag, drop, minimize, and restore translucent glass windows.
- **Glass UI**: Modern 2025 aesthetic with blur effects, dynamic backgrounds, and smooth animations.
- **App Ecosystem**:
  - **The Verandah**: Real-time chat with channel support (Nassau Vibes, Island Life).
  - **Buddy List**: Keep track of friends with live online presence, pinned for easy access.
  - **Widgets**: Weather and News integration (Coming Soon).

### ⚡ Real-Time Tech
- **Global Presence**: System-wide WebSocket based on Redis tracks who's online anywhere in the OS.
- **Live Typing**: See who's "scribing..." in real-time.
- **Bahamian Moderation**: Custom AI filtering that understands Bahamian dialect and slang while keeping the chat clean.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, Python 3.11, SQLAlchemy, PostgreSQL
- **Real-time**: WebSockets, Redis (Pub/Sub)
- **AI**: OpenAI (Embeddings & Moderation)

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/salutethegenius/whatyousayin.git
   cd whatyousayin
   ```

2. Copy `.env.example` to `.env` and configure your keys:
   ```bash
   cp .env.example .env
   ```

3. Run the services:
   ```bash
   docker compose up --build
   ```

4. Open your browser:
   - **Desktop OS**: http://localhost:3000
   - **API Docs**: http://localhost:8000/docs

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📂 Project Structure

```
whatyousayin/
├── frontend/          # Next.js 14 Desktop OS
├── backend/           # FastAPI Application
├── shared/            # Shared Types
└── docker-compose.yml
```

## 📄 License

MIT
