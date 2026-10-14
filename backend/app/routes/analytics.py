import io
import csv
from datetime import date, datetime, timedelta
from flask import Blueprint, Response
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.services.quiz_service import QuizService
from app.utils.helpers import api_response, auth_required

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("", methods=["GET"])
@auth_required()
def get_analytics(user_oid):
    today = date.today()

    # 1. Subject-wise Progress
    subjects = list(mongo.subjects.find({"user_id": user_oid}))
    subject_chart_data = []
    for s in subjects:
        total = mongo.topics.count_documents({"subject_id": s["_id"]})
        done = mongo.topics.count_documents({"subject_id": s["_id"], "completed": True})
        pct = round((done / total * 100), 1) if total > 0 else 0
        subject_chart_data.append({
            "name": s["name"],
            "color": s.get("color", "#6366f1"),
            "total_topics": total,
            "completed_topics": done,
            "percentage": pct
        })

    # 2. Daily Study Minutes (Last 7 Days)
    weekly_study_data = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        day_str = day.isoformat()
        sessions = list(mongo.study_sessions.find({
            "user_id": user_oid,
            "session_date": day_str,
            "completed": True
        }))
        minutes = sum(s.get("duration_minutes", 45) for s in sessions)
        weekly_study_data.append({
            "date": day.strftime("%a %d"),
            "full_date": day_str,
            "minutes": minutes,
            "hours": round(minutes / 60, 1)
        })

    # 3. Quiz Score Trends
    recent_attempts = list(mongo.quiz_attempts.find({"user_id": user_oid}).sort("created_at", 1).limit(10))
    quiz_trend_data = []
    for a in recent_attempts:
        quiz_trend_data.append({
            "topic": a.get("topic", "General"),
            "score": a.get("score", 0),
            "total": a.get("total", 5),
            "percentage": a.get("percentage", round((a.get("score", 0) / max(1, a.get("total", 5))) * 100, 1)),
            "date": a.get("created_at").strftime("%b %d") if hasattr(a.get("created_at"), "strftime") else ""
        })

    # 4. Overall Totals
    total_study_minutes = sum(
        s.get("duration_minutes", 45)
        for s in mongo.study_sessions.find({"user_id": user_oid, "completed": True})
    )
    total_tasks = mongo.tasks.count_documents({"user_id": user_oid})
    done_tasks = mongo.tasks.count_documents({"user_id": user_oid, "completed": True})
    
    # 5. Weak Topics Recommendations
    weak_topics = QuizService.get_weak_topics(user_oid)

    return api_response(data={
        "subject_progress": subject_chart_data,
        "weekly_study": weekly_study_data,
        "quiz_trends": quiz_trend_data,
        "total_study_minutes": total_study_minutes,
        "total_study_hours": round(total_study_minutes / 60, 1),
        "total_tasks": total_tasks,
        "completed_tasks": done_tasks,
        "task_completion_rate": round((done_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0,
        "weak_topics": weak_topics
    })

@analytics_bp.route("/export", methods=["GET"])
@auth_required()
def export_csv(user_oid):
    output = io.StringIO()
    writer = csv.writer(output)

    # 1. Write Header & Subjects
    writer.writerow(["--- StudyFlow AI - Student Academic Report ---"])
    writer.writerow(["Generated At", datetime.utcnow().isoformat()])
    writer.writerow([])

    writer.writerow(["SUBJECTS & PROGRESS"])
    writer.writerow(["Subject Name", "Color", "Target Hours", "Exam Date", "Total Topics", "Completed Topics", "Progress %"])
    for s in mongo.subjects.find({"user_id": user_oid}):
        total = mongo.topics.count_documents({"subject_id": s["_id"]})
        done = mongo.topics.count_documents({"subject_id": s["_id"], "completed": True})
        pct = round((done / total * 100), 1) if total > 0 else 0
        writer.writerow([s.get("name"), s.get("color"), s.get("target_hours"), s.get("exam_date", "None"), total, done, f"{pct}%"])
    writer.writerow([])

    # 2. Write Tasks
    writer.writerow(["TASKS"])
    writer.writerow(["Title", "Priority", "Due Date", "Status"])
    for t in mongo.tasks.find({"user_id": user_oid}):
        writer.writerow([t.get("title"), t.get("priority"), t.get("due_date", "None"), "Completed" if t.get("completed") else "Pending"])
    writer.writerow([])

    # 3. Write Completed Study Sessions
    writer.writerow(["STUDY SESSIONS"])
    writer.writerow(["Title", "Session Date", "Start Time", "Duration (mins)", "Status"])
    for ss in mongo.study_sessions.find({"user_id": user_oid}):
        writer.writerow([ss.get("title"), ss.get("session_date"), ss.get("start_time"), ss.get("duration_minutes"), ss.get("status")])
    writer.writerow([])

    # 4. Write Quiz Attempts
    writer.writerow(["QUIZ ATTEMPTS"])
    writer.writerow(["Topic", "Score", "Total", "Percentage %", "Date"])
    for qa in mongo.quiz_attempts.find({"user_id": user_oid}):
        pct = qa.get("percentage", round(qa.get("score", 0) / max(1, qa.get("total", 1)) * 100, 1))
        writer.writerow([qa.get("topic"), qa.get("score"), qa.get("total"), f"{pct}%", str(qa.get("created_at"))])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=studyflow_progress_report.csv"}
    )

