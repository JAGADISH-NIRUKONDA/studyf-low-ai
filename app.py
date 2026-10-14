import os
from datetime import datetime, date, timedelta
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, render_template, redirect, url_for, request, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-only-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///study_planner.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    color = db.Column(db.String(20), default="#6366f1")
    target_hours = db.Column(db.Float, default=5)
    topics = db.relationship("Topic", backref="subject", cascade="all, delete-orphan")
    tasks = db.relationship("Task", backref="subject", cascade="all, delete-orphan")

class Topic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"), nullable=False)
    title = db.Column(db.String(180), nullable=False)
    difficulty = db.Column(db.String(20), default="Medium")
    completed = db.Column(db.Boolean, default=False)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"))
    title = db.Column(db.String(200), nullable=False)
    due_date = db.Column(db.Date)
    priority = db.Column(db.String(20), default="Medium")
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"))
    title = db.Column(db.String(200), nullable=False)
    session_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(10), default="09:00")
    duration_minutes = db.Column(db.Integer, default=45)
    completed = db.Column(db.Boolean, default=False)

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"))
    title = db.Column(db.String(180), nullable=False)
    content = db.Column(db.Text, default="")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    topic = db.Column(db.String(120), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

def owned_subject(subject_id):
    return Subject.query.filter_by(id=subject_id, user_id=current_user.id).first()

@app.context_processor
def inject_globals():
    return {"today": date.today()}

@app.route("/")
def home():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    return render_template("landing.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        if not name or not email or len(password) < 8:
            flash("Enter your name, a valid email, and a password of at least 8 characters.", "error")
        elif User.query.filter_by(email=email).first():
            flash("An account with this email already exists.", "error")
        else:
            user = User(name=name, email=email)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            login_user(user)
            flash("Welcome! Your account is ready.", "success")
            return redirect(url_for("dashboard"))
    return render_template("auth.html", mode="register")

@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for("dashboard"))
        flash("Invalid email or password.", "error")
    return render_template("auth.html", mode="login")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("home"))

@app.route("/dashboard")
@login_required
def dashboard():
    subjects = Subject.query.filter_by(user_id=current_user.id).all()
    tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.completed, Task.due_date.asc()).limit(8).all()
    sessions = StudySession.query.filter_by(user_id=current_user.id, session_date=date.today()).order_by(StudySession.start_time).all()
    notes_count = Note.query.filter_by(user_id=current_user.id).count()
    completed_tasks = Task.query.filter_by(user_id=current_user.id, completed=True).count()
    total_tasks = Task.query.filter_by(user_id=current_user.id).count()
    completed_sessions = StudySession.query.filter_by(user_id=current_user.id, completed=True).count()
    return render_template("dashboard.html", subjects=subjects, tasks=tasks, sessions=sessions,
        notes_count=notes_count, completed_tasks=completed_tasks, total_tasks=total_tasks,
        completed_sessions=completed_sessions)

@app.route("/subjects", methods=["GET", "POST"])
@login_required
def subjects():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        if name:
            db.session.add(Subject(user_id=current_user.id, name=name, target_hours=float(request.form.get("target_hours") or 5)))
            db.session.commit()
            flash("Subject added.", "success")
        return redirect(url_for("subjects"))
    return render_template("subjects.html", subjects=Subject.query.filter_by(user_id=current_user.id).all())

@app.route("/subjects/<int:subject_id>/delete", methods=["POST"])
@login_required
def delete_subject(subject_id):
    subject = owned_subject(subject_id)
    if subject:
        db.session.delete(subject)
        db.session.commit()
        flash("Subject deleted.", "success")
    return redirect(url_for("subjects"))

@app.route("/subjects/<int:subject_id>/topics", methods=["POST"])
@login_required
def add_topic(subject_id):
    subject = owned_subject(subject_id)
    title = request.form.get("title", "").strip()
    if subject and title:
        db.session.add(Topic(subject_id=subject.id, title=title, difficulty=request.form.get("difficulty", "Medium")))
        db.session.commit()
        flash("Topic added.", "success")
    return redirect(url_for("subjects"))

@app.route("/topics/<int:topic_id>/toggle", methods=["POST"])
@login_required
def toggle_topic(topic_id):
    topic = Topic.query.join(Subject).filter(Topic.id == topic_id, Subject.user_id == current_user.id).first()
    if topic:
        topic.completed = not topic.completed
        db.session.commit()
    return redirect(url_for("subjects"))

@app.route("/tasks", methods=["GET", "POST"])
@login_required
def tasks():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        if title:
            due = request.form.get("due_date")
            sid = request.form.get("subject_id")
            subject = owned_subject(int(sid)) if sid and sid.isdigit() else None
            db.session.add(Task(user_id=current_user.id, title=title, due_date=date.fromisoformat(due) if due else None,
                                priority=request.form.get("priority", "Medium"), subject_id=subject.id if subject else None))
            db.session.commit()
            flash("Task created.", "success")
        return redirect(url_for("tasks"))
    all_tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.completed, Task.due_date.asc()).all()
    return render_template("tasks.html", tasks=all_tasks, subjects=Subject.query.filter_by(user_id=current_user.id).all())

@app.route("/tasks/<int:task_id>/toggle", methods=["POST"])
@login_required
def toggle_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if task:
        task.completed = not task.completed
        db.session.commit()
    return redirect(request.referrer or url_for("tasks"))

@app.route("/tasks/<int:task_id>/delete", methods=["POST"])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if task:
        db.session.delete(task)
        db.session.commit()
    return redirect(url_for("tasks"))

@app.route("/planner", methods=["GET", "POST"])
@login_required
def planner():
    if request.method == "POST":
        start = date.fromisoformat(request.form.get("start_date") or date.today().isoformat())
        days = max(1, min(14, int(request.form.get("days") or 7)))
        hours = max(1, min(12, int(request.form.get("hours_per_day") or 3)))
        subjects = Subject.query.filter_by(user_id=current_user.id).all()
        topics = [t for s in subjects for t in s.topics if not t.completed]
        if not topics:
            flash("Add subjects and incomplete topics first to generate a plan.", "error")
        else:
            # Simple deterministic planner: distribute topics across available daily slots.
            slots_per_day = max(1, hours * 60 // 45)
            for offset in range(days):
                day = start + timedelta(days=offset)
                for slot in range(slots_per_day):
                    idx = offset * slots_per_day + slot
                    if idx >= len(topics):
                        break
                    topic = topics[idx]
                    db.session.add(StudySession(user_id=current_user.id, subject_id=topic.subject_id,
                        title=topic.title, session_date=day, start_time=f"{9 + slot:02d}:00", duration_minutes=45))
            db.session.commit()
            flash(f"Created a {days}-day plan with up to {min(len(topics), days * slots_per_day)} study sessions.", "success")
        return redirect(url_for("planner"))
    sessions = StudySession.query.filter_by(user_id=current_user.id).order_by(StudySession.session_date, StudySession.start_time).all()
    return render_template("planner.html", sessions=sessions, subjects=Subject.query.filter_by(user_id=current_user.id).all())

@app.route("/sessions/<int:session_id>/toggle", methods=["POST"])
@login_required
def toggle_session(session_id):
    session = StudySession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if session:
        session.completed = not session.completed
        db.session.commit()
    return redirect(url_for("planner"))

@app.route("/notes", methods=["GET", "POST"])
@login_required
def notes():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        content = request.form.get("content", "").strip()
        if title:
            sid = request.form.get("subject_id")
            subject = owned_subject(int(sid)) if sid and sid.isdigit() else None
            db.session.add(Note(user_id=current_user.id, title=title, content=content, subject_id=subject.id if subject else None))
            db.session.commit()
            flash("Note saved.", "success")
        return redirect(url_for("notes"))
    all_notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.updated_at.desc()).all()
    return render_template("notes.html", notes=all_notes, subjects=Subject.query.filter_by(user_id=current_user.id).all())

QUIZ_BANK = {
    "python": [
        ("Which keyword defines a function in Python?", ["func", "def", "function", "method"], 1, "The def keyword defines a function."),
        ("Which type is mutable?", ["tuple", "str", "list", "int"], 2, "Lists can be modified after creation."),
        ("What does len([1, 2, 3]) return?", ["2", "3", "4", "None"], 1, "There are three elements."),
    ],
    "ai": [
        ("Which is a supervised learning task?", ["Clustering", "Classification with labels", "Dimensionality reduction", "Association rules"], 1, "Supervised learning uses labelled examples."),
        ("What does overfitting mean?", ["Model is too simple", "Model fits training data too closely", "No training occurs", "Data is normalized"], 1, "Overfitting harms generalization."),
        ("Which metric is the harmonic mean of precision and recall?", ["Accuracy", "F1-score", "MSE", "R-squared"], 1, "F1-score is the harmonic mean of precision and recall."),
    ],
    "general": [
        ("Which data structure follows FIFO?", ["Stack", "Queue", "Tree", "Graph"], 1, "A queue follows First In, First Out."),
        ("Which SQL command reads records?", ["INSERT", "UPDATE", "SELECT", "DROP"], 2, "SELECT retrieves records."),
        ("What is the purpose of version control?", ["Style pages", "Track changes", "Compile code", "Design databases"], 1, "Version control records and manages changes."),
    ]
}

@app.route("/quizzes", methods=["GET", "POST"])
@login_required
def quizzes():
    result = None
    questions = None
    topic = "general"
    if request.method == "POST":
        topic = request.form.get("topic", "general").lower()
        bank_key = "python" if "python" in topic else "ai" if any(x in topic for x in ["ai", "machine", "learning", "data"]) else "general"
        questions = QUIZ_BANK[bank_key]
        if request.form.get("action") == "submit":
            score = sum(1 for i, q in enumerate(questions) if request.form.get(f"q{i}") == str(q[2]))
            db.session.add(QuizAttempt(user_id=current_user.id, topic=topic, score=score, total=len(questions)))
            db.session.commit()
            result = {"score": score, "total": len(questions), "questions": questions}
    attempts = QuizAttempt.query.filter_by(user_id=current_user.id).order_by(QuizAttempt.created_at.desc()).limit(10).all()
    return render_template("quizzes.html", questions=questions, result=result, topic=topic, attempts=attempts)

@app.route("/assistant", methods=["GET", "POST"])
@login_required
def assistant():
    answer = None
    question = ""
    if request.method == "POST":
        question = request.form.get("question", "").strip()
        if question:
            lower = question.lower()
            if "pomodoro" in lower:
                answer = "Try 25 minutes of focused study followed by a 5-minute break. After four focus sessions, take a longer 15–30 minute break."
            elif "study plan" in lower or "timetable" in lower:
                answer = "Open Study Planner, add subjects and topics under Subjects, then choose your start date, study hours, and duration to generate a timetable."
            elif "overfit" in lower:
                answer = "Overfitting happens when a model learns training data too closely and performs poorly on unseen data. Try validation data, regularization, and simpler models."
            elif "python" in lower:
                answer = "For Python, study one concept at a time, write a small example, solve 3–5 exercises, and review mistakes. Save your topic list under Subjects."
            else:
                answer = ("Study assistant fallback mode: break your question into a clear concept, a worked example, and a short practice task. "
                          "No external AI provider is configured, so this is a basic guidance response rather than an LLM-generated answer. "
                          "Add an AI provider in your environment configuration to enable real model responses.")
    return render_template("assistant.html", answer=answer, question=question)

@app.route("/analytics")
@login_required
def analytics():
    subjects = Subject.query.filter_by(user_id=current_user.id).all()
    labels = [s.name for s in subjects]
    progress = [round((sum(1 for t in s.topics if t.completed) / len(s.topics) * 100) if s.topics else 0) for s in subjects]
    quiz_attempts = QuizAttempt.query.filter_by(user_id=current_user.id).order_by(QuizAttempt.created_at.desc()).limit(8).all()
    task_total = Task.query.filter_by(user_id=current_user.id).count()
    task_done = Task.query.filter_by(user_id=current_user.id, completed=True).count()
    session_minutes = sum(s.duration_minutes for s in StudySession.query.filter_by(user_id=current_user.id, completed=True).all())
    return render_template("analytics.html", labels=labels, progress=progress, attempts=quiz_attempts,
        task_total=task_total, task_done=task_done, session_minutes=session_minutes)

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "app": "AI Smart Study Planner"})

@app.cli.command("init-db")
def init_db_command():
    db.create_all()
    print("Database initialized.")

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
