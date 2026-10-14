# StudyFlow AI — AI Smart Study Planner & Career Architect

A modern, responsive, full-stack student productivity platform upgraded to **React.js + Vite** and **Python Flask + MongoDB Atlas / Local Server**.

Features constraint-based intelligent study timetable generation, interactive MCQ examinations with secure backend grading, academic AI doubt assistance with chat history & note conversion, personalized career guidance with skill-gap analysis, and progress analytics with CSV export.

---

## 1. Upgraded Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, Vite | React Router DOM v6, Axios, Lucide React icons, Recharts, Canvas Confetti |
| **Backend** | Python Flask REST API | Modular application factory, Flask-CORS, Flask-JWT-Extended, PyMongo, Werkzeug |
| **Database** | MongoDB | 12 dedicated collections (`users`, `subjects`, `topics`, `study_sessions`, `tasks`, `notes`, `quiz_questions`, `quiz_attempts`, `career_profiles`, `career_recommendations`, `chat_conversations`, `chat_messages`) |
| **AI Integration** | Google Gemini / OpenAI / Educational Fallback | Server-side integration with graceful educational fallback mode when no API key is provided |

---

## 2. Project Structure

```
ai_smart_study_planner/
├── backend/
│   ├── app/
│   │   ├── database/          # PyMongo initialization, indexes, ObjectId serializers
│   │   ├── routes/            # REST API endpoints (auth, subjects, topics, tasks, planner, quizzes, career, chat, analytics)
│   │   ├── services/          # Business logic (PlannerService, QuizService, CareerService, AIService)
│   │   ├── utils/             # Helpers, validation, auth decorators
│   │   ├── config.py          # Configuration loading from .env
│   │   └── __init__.py        # Flask application factory with CORS & JWT
│   ├── tests/                 # Automated test suite (11 integration & security tests)
│   ├── migrate_sqlite.py      # Repeatable SQLite -> MongoDB migration script
│   ├── run.py                 # Backend development runner
│   ├── requirements.txt       # Python backend dependencies
│   └── .env.example           # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/        # Sidebar, Topbar, PomodoroTimer, StatCard, Modal, EmptyState
│   │   ├── context/           # AuthContext (JWT session), ThemeContext (Dark/Light mode)
│   │   ├── layouts/           # DashboardLayout, PublicLayout
│   │   ├── pages/             # Landing, Login, Register, Dashboard, Subjects, Planner, Quizzes, Assistant, Career, Notes, Analytics, Settings
│   │   ├── services/          # Axios instance and API service functions
│   │   ├── styles/            # CSS variables design system
│   │   ├── App.jsx            # React Router setup
│   │   └── main.jsx           # App entry point
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── _backup_original/          # Preserved backup of original SQLite project
├── run.py                     # Root convenience runner pointing to backend
├── requirements.txt           # Top-level requirements
└── README.md
```

---

## 3. Environment & Database Configuration

### Step 1: Copy Environment File
In the `backend/` directory (or root), create `.env` from `.env.example`:

```powershell
Copy-Item backend\.env.example backend\.env
```

### Step 2: Configure Environment Variables in `backend/.env`
```env
# MongoDB Connection (Local or Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=studyflow_ai

# Security & Authentication
SECRET_KEY=your-production-secret-key-change-me
JWT_SECRET_KEY=your-jwt-secret-key-change-me
JWT_ACCESS_TOKEN_EXPIRES_DAYS=7

# Optional: Real AI Model Integration (e.g. Google Gemini or OpenAI)
# If empty, transparent educational fallback mode is used automatically.
AI_PROVIDER=gemini
AI_API_KEY=your-google-gemini-api-key-here
AI_MODEL=gemini-1.5-flash

# Frontend URL for CORS protection
FRONTEND_URL=http://localhost:5173
PORT=5000
FLASK_ENV=development
```

---

## 4. SQLite to MongoDB Data Migration

If you have existing student records in `instance/study_planner.db`:
The original database and files were backed up in `_backup_original/`.

Run the automated migration script to transfer all users, subjects, topics, tasks, study sessions, notes, and quiz attempts to MongoDB:

```powershell
.\.venv\Scripts\python.exe backend\migrate_sqlite.py
```

---

## 5. How to Run in VS Code Terminal

Open two terminals in VS Code:

### Terminal 1: Run Flask Backend API
```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Or run directly with python:
.\.venv\Scripts\python.exe backend\run.py
```
> Backend API will start on **http://127.0.0.1:5000**  
> Health check: **http://127.0.0.1:5000/api/health**

---

### Terminal 2: Run React Frontend (Vite)
```powershell
cd frontend
npm.cmd run dev
```
> React Frontend will start on **http://localhost:5173**  
> Requests to `/api/*` are automatically proxied to Flask on port 5000.

---

## 6. Running Tests

Run the backend test suite with PyTest:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\ -v
```

All 11 tests cover:
- Health check verification
- JWT registration, duplicate email rejection, invalid password rejection, and valid login
- Protected route 401 unauthorized rejection
- Subjects and Topics CRUD, topic completion toggles
- Task creation, completion toggle, and deletion
- Constraint-based AI study schedule generation and recalculation
- Quiz security (verifying correct answers are **never** exposed before submission) and server-side score calculation
- Academic AI Doubt Assistant conversation persistence and one-click conversion to Notes
- Personalized Career Guidance with skill-gap analysis and learning roadmaps
- Dashboard metrics and CSV progress report export
- SQLite to MongoDB migration data integrity and user persistence

---

## 7. Core Modules Overview

### 1. AI Study Planner & Focus Timer
- **Constraint-based scheduling algorithm**: calculates topic priority based on difficulty weighting (Easy/Medium/Hard), syllabus importance (1-5), and exam date urgency.
- Prevents scheduling beyond daily available study hours.
- Automatic **"Recalculate Missed"** button that identifies overdue sessions and reprioritizes upcoming days.
- **Integrated Pomodoro Focus Timer**: 25m focus / 5m short break / 15m long break with sound and cycle logging.

### 2. MCQ Tests & Results
- Choose topic, question count (3, 5, 10), and difficulty.
- **Timed Exam Mode** with real-time countdown timer vs Practice Mode.
- Answers are evaluated strictly on the backend to prevent inspection attacks.
- Review mode displays correct answers with detailed academic explanations.
- Detects weak topics (<70% score) and surfaces revision recommendations.

### 3. AI Academic Doubt Assistant
- Real-time conversation thread with past context retention.
- Multi-thread conversation manager (create, switch, rename, delete).
- Subject context filter dropdown.
- One-click **"Save to Notes"** button converting explanations into revision notes.
- Transparent mode indicator (notifies user when AI key is active or when educational fallback is active).

### 4. AI Career Guidance
- Student profile with academic interests and technical skill proficiency levels.
- Match percentage calculation against career paths (Full Stack Developer, AI/ML Engineer, Data Scientist, Cloud & DevOps).
- Color-coded **Skill Gap Analysis** (Matched vs Missing skills).
- 4-phase structured learning roadmaps with duration estimates, portfolio projects, and verified certification tracks.

### 5. Notes & Progress Analytics
- Search and filter notes by subject or tags.
- Recharts interactive data visualizations for syllabus completion, 7-day study velocity, and quiz score trends.
- One-click **"Export Academic Report (CSV)"** download.
