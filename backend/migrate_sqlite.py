import os
import sqlite3
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
SQLITE_PATH = os.path.join(BASE_DIR, "..", "instance", "study_planner.db")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "studyflow_ai")

INITIAL_QUIZ_BANK = [
    {
        "topic": "Python",
        "difficulty": "Easy",
        "question": "Which keyword defines a function in Python?",
        "options": ["func", "def", "function", "method"],
        "correct_option": 1,
        "explanation": "The 'def' keyword defines a function in Python.",
        "is_ai_generated": False
    },
    {
        "topic": "Python",
        "difficulty": "Medium",
        "question": "Which type is mutable in Python?",
        "options": ["tuple", "str", "list", "int"],
        "correct_option": 2,
        "explanation": "Lists can be modified in-place after creation.",
        "is_ai_generated": False
    },
    {
        "topic": "Python",
        "difficulty": "Easy",
        "question": "What does len([1, 2, 3]) return?",
        "options": ["2", "3", "4", "None"],
        "correct_option": 1,
        "explanation": "There are three items in the list, so len returns 3.",
        "is_ai_generated": False
    },
    {
        "topic": "Artificial Intelligence",
        "difficulty": "Medium",
        "question": "Which is a supervised learning task?",
        "options": ["Clustering", "Classification with labels", "Dimensionality reduction", "Association rules"],
        "correct_option": 1,
        "explanation": "Supervised learning relies on labelled training examples.",
        "is_ai_generated": False
    },
    {
        "topic": "Artificial Intelligence",
        "difficulty": "Medium",
        "question": "What does overfitting mean in machine learning?",
        "options": ["Model is too simple", "Model fits training data too closely", "No training occurs", "Data is normalized"],
        "correct_option": 1,
        "explanation": "Overfitting harms generalization to unseen test data.",
        "is_ai_generated": False
    },
    {
        "topic": "Artificial Intelligence",
        "difficulty": "Hard",
        "question": "Which metric is the harmonic mean of precision and recall?",
        "options": ["Accuracy", "F1-score", "MSE", "R-squared"],
        "correct_option": 1,
        "explanation": "F1-score is 2 * (precision * recall) / (precision + recall).",
        "is_ai_generated": False
    },
    {
        "topic": "Computer Science",
        "difficulty": "Easy",
        "question": "Which data structure follows FIFO (First In, First Out)?",
        "options": ["Stack", "Queue", "Tree", "Graph"],
        "correct_option": 1,
        "explanation": "A Queue operates on the First In, First Out principle.",
        "is_ai_generated": False
    },
    {
        "topic": "Computer Science",
        "difficulty": "Easy",
        "question": "Which SQL command reads records from a table?",
        "options": ["INSERT", "UPDATE", "SELECT", "DROP"],
        "correct_option": 2,
        "explanation": "SELECT is used to query and read records.",
        "is_ai_generated": False
    },
    {
        "topic": "Computer Science",
        "difficulty": "Easy",
        "question": "What is the primary purpose of version control like Git?",
        "options": ["Style pages", "Track changes", "Compile code", "Design databases"],
        "correct_option": 1,
        "explanation": "Version control systems record history and track modifications over time.",
        "is_ai_generated": False
    }
]

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(str(date_str).replace("Z", ""))
    except Exception:
        return None

def migrate():
    print(f"[Migration] Checking SQLite path: {SQLITE_PATH}")
    if not os.path.exists(SQLITE_PATH):
        print(f"[Migration] SQLite database not found at {SQLITE_PATH}. Proceeding with clean MongoDB setup.")
        client = MongoClient(MONGODB_URI)
        db = client[MONGODB_DATABASE]
        seed_questions(db)
        return

    con = sqlite3.connect(SQLITE_PATH)
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DATABASE]

    user_map = {}
    subject_map = {}

    # 1. Users
    user_rows = cur.execute("SELECT * FROM user").fetchall()
    print(f"[Migration] Found {len(user_rows)} users in SQLite.")
    for u in user_rows:
        email = u["email"].strip().lower()
        existing = db.users.find_one({"email": email})
        created_at = parse_date(u["created_at"]) or datetime.utcnow()
        if existing:
            user_oid = existing["_id"]
            print(f"  User {email} already in MongoDB (_id={user_oid})")
        else:
            res = db.users.insert_one({
                "name": u["name"],
                "email": email,
                "password_hash": u["password_hash"],
                "created_at": created_at,
                "preferences": {"theme": "light", "notifications_enabled": True}
            })
            user_oid = res.inserted_id
            print(f"  Migrated user: {email} -> {user_oid}")
        user_map[u["id"]] = user_oid

    # 2. Subjects
    subject_rows = cur.execute("SELECT * FROM subject").fetchall()
    print(f"[Migration] Found {len(subject_rows)} subjects in SQLite.")
    for s in subject_rows:
        user_oid = user_map.get(s["user_id"])
        if not user_oid:
            continue
        existing = db.subjects.find_one({"user_id": user_oid, "name": s["name"]})
        if existing:
            subject_map[s["id"]] = existing["_id"]
        else:
            res = db.subjects.insert_one({
                "user_id": user_oid,
                "name": s["name"],
                "color": s["color"] if "color" in s.keys() and s["color"] else "#6366f1",
                "target_hours": float(s["target_hours"]) if "target_hours" in s.keys() and s["target_hours"] else 5.0,
                "exam_date": None,
                "created_at": datetime.utcnow()
            })
            subject_map[s["id"]] = res.inserted_id
            print(f"  Migrated subject: {s['name']} -> {res.inserted_id}")

    # 3. Topics
    topic_rows = cur.execute("SELECT * FROM topic").fetchall()
    print(f"[Migration] Found {len(topic_rows)} topics in SQLite.")
    for t in topic_rows:
        subj_oid = subject_map.get(t["subject_id"])
        if not subj_oid:
            continue
        subj = db.subjects.find_one({"_id": subj_oid})
        user_oid = subj["user_id"] if subj else None
        existing = db.topics.find_one({"subject_id": subj_oid, "title": t["title"]})
        if not existing:
            db.topics.insert_one({
                "user_id": user_oid,
                "subject_id": subj_oid,
                "title": t["title"],
                "difficulty": t["difficulty"] if "difficulty" in t.keys() and t["difficulty"] else "Medium",
                "estimated_minutes": 45,
                "importance": 3,
                "completed": bool(t["completed"]),
                "completed_at": datetime.utcnow() if bool(t["completed"]) else None,
                "created_at": datetime.utcnow()
            })

    # 4. Tasks
    task_rows = cur.execute("SELECT * FROM task").fetchall()
    print(f"[Migration] Found {len(task_rows)} tasks in SQLite.")
    for tk in task_rows:
        user_oid = user_map.get(tk["user_id"])
        if not user_oid:
            continue
        subj_oid = subject_map.get(tk["subject_id"]) if tk["subject_id"] else None
        existing = db.tasks.find_one({"user_id": user_oid, "title": tk["title"]})
        if not existing:
            db.tasks.insert_one({
                "user_id": user_oid,
                "subject_id": subj_oid,
                "title": tk["title"],
                "due_date": str(tk["due_date"]) if tk["due_date"] else None,
                "priority": tk["priority"] if "priority" in tk.keys() and tk["priority"] else "Medium",
                "completed": bool(tk["completed"]),
                "created_at": parse_date(tk["created_at"]) or datetime.utcnow()
            })

    # 5. Study Sessions
    session_rows = cur.execute("SELECT * FROM study_session").fetchall()
    print(f"[Migration] Found {len(session_rows)} study sessions in SQLite.")
    for ss in session_rows:
        user_oid = user_map.get(ss["user_id"])
        if not user_oid:
            continue
        subj_oid = subject_map.get(ss["subject_id"]) if ss["subject_id"] else None
        existing = db.study_sessions.find_one({
            "user_id": user_oid,
            "title": ss["title"],
            "session_date": str(ss["session_date"])
        })
        if not existing:
            db.study_sessions.insert_one({
                "user_id": user_oid,
                "subject_id": subj_oid,
                "title": ss["title"],
                "session_date": str(ss["session_date"]),
                "start_time": ss["start_time"] if "start_time" in ss.keys() and ss["start_time"] else "09:00",
                "duration_minutes": int(ss["duration_minutes"]) if "duration_minutes" in ss.keys() and ss["duration_minutes"] else 45,
                "status": "completed" if bool(ss["completed"]) else "pending",
                "completed": bool(ss["completed"]),
                "created_at": datetime.utcnow()
            })

    # 6. Notes
    note_rows = cur.execute("SELECT * FROM note").fetchall()
    print(f"[Migration] Found {len(note_rows)} notes in SQLite.")
    for n in note_rows:
        user_oid = user_map.get(n["user_id"])
        if not user_oid:
            continue
        subj_oid = subject_map.get(n["subject_id"]) if n["subject_id"] else None
        existing = db.notes.find_one({"user_id": user_oid, "title": n["title"]})
        if not existing:
            updated_at = parse_date(n["updated_at"]) or datetime.utcnow()
            db.notes.insert_one({
                "user_id": user_oid,
                "subject_id": subj_oid,
                "title": n["title"],
                "content": n["content"] or "",
                "tags": [],
                "created_at": updated_at,
                "updated_at": updated_at
            })

    # 7. Quiz Attempts
    quiz_rows = cur.execute("SELECT * FROM quiz_attempt").fetchall()
    print(f"[Migration] Found {len(quiz_rows)} quiz attempts in SQLite.")
    for qa in quiz_rows:
        user_oid = user_map.get(qa["user_id"])
        if not user_oid:
            continue
        created_at = parse_date(qa["created_at"]) or datetime.utcnow()
        existing = db.quiz_attempts.find_one({
            "user_id": user_oid,
            "topic": qa["topic"],
            "score": int(qa["score"])
        })
        if not existing:
            db.quiz_attempts.insert_one({
                "user_id": user_oid,
                "topic": qa["topic"],
                "score": int(qa["score"]),
                "total": int(qa["total"]),
                "time_taken_seconds": 120,
                "created_at": created_at
            })

    con.close()
    seed_questions(db)
    validate_migration(db)

def seed_questions(db):
    count = db.quiz_questions.count_documents({})
    if count == 0:
        db.quiz_questions.insert_many(INITIAL_QUIZ_BANK)
        print(f"[Migration] Seeded {len(INITIAL_QUIZ_BANK)} initial quiz questions.")
    else:
        print(f"[Migration] Quiz questions collection already has {count} documents.")

def validate_migration(db):
    print("\n--- Migration Validation Summary ---")
    for col_name in [
        "users", "subjects", "topics", "study_sessions", "tasks",
        "notes", "quiz_questions", "quiz_attempts", "career_profiles",
        "career_recommendations", "chat_conversations", "chat_messages"
    ]:
        cnt = db[col_name].count_documents({})
        print(f"Collection '{col_name}': {cnt} documents")
    print("------------------------------------\n")

if __name__ == "__main__":
    migrate()

