import random
from datetime import datetime
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.services.ai_service import AIService

class QuizService:
    @classmethod
    def get_or_generate_questions(cls, topic, count=5, difficulty="Medium", subject_id=None):
        count = max(1, min(20, int(count)))
        query = {"topic": {"$regex": f"^{topic}$", "$options": "i"}}
        if difficulty and difficulty != "All":
            query["difficulty"] = difficulty

        existing = list(mongo.quiz_questions.find(query))
        
        # If not enough questions, try AI generation if configured
        if len(existing) < count and AIService.is_ai_configured():
            ai_generated = AIService.generate_quiz_questions(topic, count=count - len(existing), difficulty=difficulty)
            if ai_generated:
                for q in ai_generated:
                    q["created_at"] = datetime.utcnow()
                    res = mongo.quiz_questions.insert_one(q)
                    q["_id"] = res.inserted_id
                    existing.append(q)

        # Fallback to general questions if still empty
        if not existing:
            existing = list(mongo.quiz_questions.find({"topic": "Computer Science"}))
            if not existing:
                existing = list(mongo.quiz_questions.find({}))

        # Sample and shuffle
        selected = random.sample(existing, min(len(existing), count))

        # IMPORTANT SECURITY REQUIREMENT: Never expose correct answers or explanations before submission
        sanitized_questions = []
        for q in selected:
            sanitized_questions.append({
                "id": str(q["_id"]),
                "topic": q.get("topic", topic),
                "difficulty": q.get("difficulty", "Medium"),
                "question": q.get("question"),
                "options": q.get("options", []),
            })

        return sanitized_questions

    @classmethod
    def evaluate_quiz_submission(cls, user_id, topic, submissions, time_taken_seconds=0, subject_id=None):
        """
        Calculates score securely on the backend.
        submissions: list of {"question_id": str, "selected_option": int}
        """
        score = 0
        total = len(submissions)
        breakdown = []

        for sub in submissions:
            q_id = to_object_id(sub.get("question_id"))
            selected = sub.get("selected_option")

            q_doc = mongo.quiz_questions.find_one({"_id": q_id})
            if not q_doc:
                continue

            correct_opt = q_doc.get("correct_option")
            is_correct = (selected is not None and int(selected) == int(correct_opt))
            if is_correct:
                score += 1

            breakdown.append({
                "question_id": str(q_doc["_id"]),
                "question": q_doc.get("question"),
                "options": q_doc.get("options", []),
                "selected_option": selected,
                "correct_option": correct_opt,
                "is_correct": is_correct,
                "explanation": q_doc.get("explanation", "")
            })

        pct = round((score / total * 100), 1) if total > 0 else 0
        is_weak = pct < 70

        # Save attempt in MongoDB
        attempt_doc = {
            "user_id": user_id,
            "subject_id": to_object_id(subject_id),
            "topic": topic,
            "score": score,
            "total": total,
            "percentage": pct,
            "time_taken_seconds": max(0, int(time_taken_seconds)),
            "created_at": datetime.utcnow()
        }
        res = mongo.quiz_attempts.insert_one(attempt_doc)
        attempt_doc["_id"] = res.inserted_id

        return {
            "attempt_id": str(res.inserted_id),
            "topic": topic,
            "score": score,
            "total": total,
            "percentage": pct,
            "is_weak": is_weak,
            "revision_recommended": is_weak,
            "breakdown": breakdown,
            "time_taken_seconds": time_taken_seconds
        }

    @classmethod
    def get_weak_topics(cls, user_id):
        """Identifies topics where average score < 70%."""
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$topic",
                "avg_pct": {"$avg": "$percentage"},
                "attempts": {"$sum": 1},
                "last_attempt": {"$max": "$created_at"}
            }},
            {"$match": {"avg_pct": {"$lt": 70}}},
            {"$sort": {"avg_pct": 1}}
        ]
        results = list(mongo.quiz_attempts.aggregate(pipeline))
        return [
            {
                "topic": r["_id"],
                "average_percentage": round(r["avg_pct"], 1),
                "attempts": r["attempts"],
                "last_attempt": r["last_attempt"].isoformat() if hasattr(r["last_attempt"], "isoformat") else str(r["last_attempt"])
            }
            for r in results
        ]

