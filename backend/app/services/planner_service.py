from datetime import datetime, date, timedelta
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id

DIFFICULTY_WEIGHTS = {
    "Easy": 1.0,
    "Medium": 2.0,
    "Hard": 3.0
}

class PlannerService:
    @staticmethod
    def calculate_topic_priority(topic, subject, today=None):
        if today is None:
            today = date.today()

        diff_weight = DIFFICULTY_WEIGHTS.get(topic.get("difficulty", "Medium"), 2.0)
        importance = float(topic.get("importance", 3))

        exam_multiplier = 1.0
        exam_date_str = subject.get("exam_date") if subject else None
        if exam_date_str:
            try:
                exam_date = date.fromisoformat(str(exam_date_str).split("T")[0])
                days_left = (exam_date - today).days
                if days_left <= 3:
                    exam_multiplier = 3.5
                elif days_left <= 7:
                    exam_multiplier = 2.5
                elif days_left <= 14:
                    exam_multiplier = 1.8
                elif days_left <= 30:
                    exam_multiplier = 1.3
            except Exception:
                pass

        score = (importance * 1.5 + diff_weight * 2.0) * exam_multiplier
        return round(score, 2)

    @classmethod
    def generate_plan(cls, user_id, start_date_str=None, days=7, hours_per_day=3, session_duration=45, replace_existing=True):
        today = date.today()
        start = date.fromisoformat(start_date_str) if start_date_str else today
        days = max(1, min(30, int(days)))
        hours_per_day = max(1, min(14, int(hours_per_day)))
        session_duration = max(25, min(90, int(session_duration)))
        max_daily_minutes = hours_per_day * 60

        # Fetch subjects and build lookup
        subjects_cursor = mongo.subjects.find({"user_id": user_id})
        subjects_by_id = {s["_id"]: s for s in subjects_cursor}

        # Fetch incomplete topics
        topics_cursor = mongo.topics.find({"user_id": user_id, "completed": False})
        topics = list(topics_cursor)

        if not topics:
            return {"created_sessions": 0, "sessions": [], "message": "No incomplete topics found to schedule."}

        # Score and rank topics
        scored_topics = []
        for t in topics:
            subj = subjects_by_id.get(t.get("subject_id"))
            p_score = cls.calculate_topic_priority(t, subj, today)
            scored_topics.append({
                "topic": t,
                "subject": subj,
                "priority_score": p_score
            })

        scored_topics.sort(key=lambda x: x["priority_score"], reverse=True)

        if replace_existing:
            # Delete pending sessions starting from start date
            mongo.study_sessions.delete_many({
                "user_id": user_id,
                "session_date": {"$gte": start.isoformat()},
                "completed": False
            })

        new_sessions = []
        topic_queue = list(scored_topics)
        queue_idx = 0

        for day_offset in range(days):
            current_day = start + timedelta(days=day_offset)
            daily_used_minutes = 0
            start_hour = 9
            start_minute = 0

            while daily_used_minutes + session_duration <= max_daily_minutes:
                if queue_idx >= len(topic_queue):
                    # Wrap around or stop if all topics covered
                    break

                item = topic_queue[queue_idx]
                topic_data = item["topic"]
                subj_data = item["subject"]

                time_str = f"{start_hour:02d}:{start_minute:02d}"

                session_doc = {
                    "user_id": user_id,
                    "subject_id": topic_data.get("subject_id"),
                    "topic_id": topic_data["_id"],
                    "title": f"{subj_data.get('name', 'Subject')}: {topic_data['title']}",
                    "session_date": current_day.isoformat(),
                    "start_time": time_str,
                    "duration_minutes": session_duration,
                    "status": "pending",
                    "completed": False,
                    "priority_score": item["priority_score"],
                    "created_at": datetime.utcnow()
                }

                new_sessions.append(session_doc)
                daily_used_minutes += session_duration
                queue_idx += 1

                # Calculate next slot time with 15-minute buffer
                total_min = start_hour * 60 + start_minute + session_duration + 15
                start_hour = (total_min // 60) % 24
                start_minute = total_min % 60

        if new_sessions:
            mongo.study_sessions.insert_many(new_sessions)

        return {
            "created_sessions": len(new_sessions),
            "days_planned": days,
            "sessions": serialize_doc(new_sessions),
            "message": f"Successfully created {len(new_sessions)} sessions across {days} days."
        }

    @classmethod
    def recalculate_missed_sessions(cls, user_id, hours_per_day=3):
        today = date.today().isoformat()
        
        # Mark past pending sessions as missed
        missed = mongo.study_sessions.find({
            "user_id": user_id,
            "session_date": {"$lt": today},
            "completed": False,
            "status": "pending"
        })
        missed_count = 0
        for m in missed:
            mongo.study_sessions.update_one({"_id": m["_id"]}, {"$set": {"status": "missed"}})
            missed_count += 1

        # Reschedule from today onwards
        res = cls.generate_plan(user_id=user_id, start_date_str=today, days=7, hours_per_day=hours_per_day, replace_existing=True)
        res["missed_marked"] = missed_count
        return res

