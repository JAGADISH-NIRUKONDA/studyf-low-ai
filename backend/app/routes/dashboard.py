from datetime import date, datetime, timedelta
from flask import Blueprint
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.utils.helpers import api_response, auth_required

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("", methods=["GET"])
@auth_required()
def get_dashboard_data(user_oid):
    today_str = date.today().isoformat()

    # 1. Subjects & Topics Progress
    subjects = list(mongo.subjects.find({"user_id": user_oid}))
    subjects_map = {s["_id"]: s for s in subjects}

    total_topics = mongo.topics.count_documents({"user_id": user_oid})
    completed_topics = mongo.topics.count_documents({"user_id": user_oid, "completed": True})
    overall_progress = round((completed_topics / total_topics * 100), 1) if total_topics > 0 else 0

    # 2. Today's sessions
    todays_sessions = list(mongo.study_sessions.find({
        "user_id": user_oid,
        "session_date": today_str
    }).sort("start_time", 1))

    enriched_sessions = []
    for ss in todays_sessions:
        sdoc = serialize_doc(ss)
        subj = subjects_map.get(ss.get("subject_id"))
        sdoc["subject_name"] = subj.get("name") if subj else "General"
        sdoc["subject_color"] = subj.get("color") if subj else "#6366f1"
        enriched_sessions.append(sdoc)

    # 3. Tasks (Pending high priority & due soon)
    tasks = list(mongo.tasks.find({
        "user_id": user_oid,
        "completed": False
    }).sort([("due_date", 1)]).limit(6))

    enriched_tasks = []
    for tk in tasks:
        tdoc = serialize_doc(tk)
        subj = subjects_map.get(tk.get("subject_id"))
        tdoc["subject_name"] = subj.get("name") if subj else "General"
        tdoc["subject_color"] = subj.get("color") if subj else "#85899f"
        enriched_tasks.append(tdoc)

    # 4. Total stats
    total_tasks = mongo.tasks.count_documents({"user_id": user_oid})
    completed_tasks = mongo.tasks.count_documents({"user_id": user_oid, "completed": True})
    total_notes = mongo.notes.count_documents({"user_id": user_oid})
    total_quiz_attempts = mongo.quiz_attempts.count_documents({"user_id": user_oid})

    # Total study minutes
    completed_sessions = list(mongo.study_sessions.find({"user_id": user_oid, "completed": True}))
    total_study_minutes = sum(s.get("duration_minutes", 45) for s in completed_sessions)

    # 5. Study streak calculation
    streak = 0
    check_day = date.today()
    while True:
        d_str = check_day.isoformat()
        has_done = mongo.study_sessions.count_documents({
            "user_id": user_oid,
            "session_date": d_str,
            "completed": True
        }) > 0
        if has_done:
            streak += 1
            check_day -= timedelta(days=1)
        else:
            # If today has not completed sessions yet, check yesterday
            if check_day == date.today():
                check_day -= timedelta(days=1)
                continue
            break

    # 6. Upcoming Exams
    upcoming_exams = []
    for s in subjects:
        if s.get("exam_date"):
            try:
                exam_d = date.fromisoformat(str(s["exam_date"]).split("T")[0])
                days_left = (exam_d - date.today()).days
                if days_left >= 0:
                    upcoming_exams.append({
                        "subject_name": s["name"],
                        "color": s.get("color", "#6366f1"),
                        "exam_date": s["exam_date"],
                        "days_remaining": days_left
                    })
            except Exception:
                pass
    upcoming_exams.sort(key=lambda x: x["days_remaining"])

    # 7. Recent Quiz Performance
    recent_quizzes = list(mongo.quiz_attempts.find({"user_id": user_oid}).sort("created_at", -1).limit(4))

    return api_response(data={
        "total_subjects": len(subjects),
        "total_topics": total_topics,
        "completed_topics": completed_topics,
        "overall_progress": overall_progress,
        "todays_sessions": enriched_sessions,
        "pending_tasks": enriched_tasks,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "total_notes": total_notes,
        "total_quiz_attempts": total_quiz_attempts,
        "total_study_minutes": total_study_minutes,
        "streak_days": streak,
        "upcoming_exams": upcoming_exams,
        "recent_quizzes": serialize_doc(recent_quizzes)
    })

