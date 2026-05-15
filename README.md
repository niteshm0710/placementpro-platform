# PlacementPro AI

A complete role-based campus placement platform — Student, HOD, TPO — with JWT auth, MongoDB storage, and deterministic demo-AI features (Resume Analyzer, Skill Gap, Placement Prediction, Mock Interview).

## Tech Stack
- **Backend**: FastAPI (Python), Motor (async MongoDB), PyJWT, bcrypt, pypdf, pdfplumber
- **Frontend**: React 19, React Router 7, Tailwind CSS, shadcn UI, Recharts, Axios
- **DB**: MongoDB

## Local Setup (VS Code)

### Prerequisites
- Python 3.10+
- Node.js 18+ and Yarn
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="placementpro"
CORS_ORIGINS="*"
JWT_SECRET="your-long-random-secret"
```

Start backend:
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### 2. Frontend
```bash
cd frontend
yarn install
```

Create `frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=0
```

Start frontend:
```bash
yarn start
```

Open http://localhost:3000.

## Demo Accounts (auto-seeded on first backend run)
Password for all: **password123**

| Role    | Email             |
|---------|-------------------|
| Student | student@demo.com  |
| HOD     | hod@demo.com      |
| TPO     | tpo@demo.com      |

## Features

### Student
- Resume upload (PDF text-extraction via pdfplumber/pypdf)
- Resume Analyzer (ATS score, quality, skills, strengths, weaknesses, suggestions)
- Skill Gap Analyzer with course recommendations
- Placement Prediction (probability, readiness, improvement areas)
- Mock Interview with scored feedback
- Job drives, applications tracker, notifications, profile settings

### HOD
- Department analytics dashboard with charts
- Student performance tracking
- Resume review with AI analysis
- Department-wide skill gap overview
- Reports (CSV export)

### TPO
- Placement drive CRUD
- Applications + shortlisting (with auto-notifications to students)
- Institute-wide analytics
- Student directory
- Broadcast notifications
- Reports (CSV export)

## Project Structure
```
.
├── backend/
│   ├── server.py            # FastAPI app, all routes & demo AI logic
│   ├── requirements.txt
│   └── .env (you create)
├── frontend/
│   ├── src/
│   │   ├── App.js           # Routing
│   │   ├── components/      # DashboardLayout + shadcn UI
│   │   ├── context/         # AuthContext (JWT in localStorage)
│   │   ├── lib/api.js       # Axios instance with auth interceptor
│   │   └── pages/
│   │       ├── Landing.jsx
│   │       ├── Login.jsx / Signup.jsx
│   │       ├── student/     # 10 student pages
│   │       ├── hod/         # 5 HOD pages
│   │       └── tpo/         # 6 TPO pages
│   ├── package.json
│   └── .env (you create)
├── memory/
│   ├── PRD.md
│   └── test_credentials.md
└── design_guidelines.json
```

## Notes
- All "AI" features are deterministic demo logic (hash-based) — no external LLM calls.
- All API routes are prefixed with `/api`.
- JWT is stored in `localStorage` as `pp_token`.
- "Made with Emergent" branding has been removed.

## License
MIT (or your choice).
