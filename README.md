# AI Smart Study Planner — StudyFlow AI

A local Flask + SQLite student productivity web app. This is a functional MVP, with account registration/login, subjects and topics, a rule-based study timetable, tasks, notes, quizzes, a study-assistant fallback, and progress analytics.

## Requirements
- Python 3.10 or newer
- Internet connection for Bootstrap, Chart.js, and Google Fonts CDN assets (the backend works locally without them, but the styling/charts may be reduced offline).

## Windows setup (PowerShell)
```powershell
cd path\to\ai_smart_study_planner
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

If PowerShell blocks activation, do not change system policy; run the virtual environment's Python directly:
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

## Windows setup (Command Prompt / CMD)
```cmd
cd path\to\ai_smart_study_planner
python -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
copy .env.example .env
python app.py
```

Open http://127.0.0.1:5000.

## First use
Register with your name, email, and password (minimum 8 characters). Then:
1. Add subjects under **My Subjects**.
2. Add syllabus topics to each subject.
3. Generate a plan under **Study Planner**.
4. Add tasks, save notes, and take quizzes.
5. Review **Progress Analytics**.

## Notes about AI
The assistant is explicitly a basic rule-based fallback; no external LLM is connected by default. Quiz content comes from a small local question bank. For real AI-generated answers/questions, configure a provider and implement its server-side integration. Never put API keys in frontend code.

## Development
The SQLite database is initialized automatically when `app.py` starts. It is stored in Flask's instance folder by default for relative SQLite URIs. Health check: http://127.0.0.1:5000/api/health.

## Security / scope
This is a learning-project MVP, not production-ready. Before public deployment, add CSRF protection to all forms, production secret management, rate limiting, hardened session/cookie settings, migrations, robust validation, and production server configuration. The theme toggle stores a preference in the browser.
