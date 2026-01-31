# ChitFund Backend - FastAPI + PostgreSQL

## Setup Instructions

### 1. Prerequisites
- Python 3.10+
- PostgreSQL database
- pip or poetry

### 2. Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/chitfund"
export CORS_ORIGINS="http://localhost:5173,https://your-frontend-domain.com"

# Run migrations
alembic upgrade head

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Configuration

In your React app, set the API URL:
```bash
VITE_API_URL=https://your-backend-domain.com
```

### 4. Deployment Options
- **Railway**: Easy Python deployment with PostgreSQL add-on
- **Render**: Free tier available with managed PostgreSQL
- **Fly.io**: Global deployment with PostgreSQL support
- **DigitalOcean App Platform**: Simple deployment with managed DB

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/chits | List all chit funds |
| GET | /api/chits/{id} | Get single chit fund |
| POST | /api/chits | Create new chit fund |
| POST | /api/chits/{id}/members | Add member to chit |
| DELETE | /api/chits/{id}/members/{member_id} | Remove member |
| POST | /api/chits/{id}/draw | Conduct monthly draw |
| GET | /api/chits/{id}/eligible | Get eligible members for draw |
