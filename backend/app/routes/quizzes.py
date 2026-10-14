from flask import Blueprint, request
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.services.quiz_service import QuizService
from app.utils.helpers import api_response, api_error, auth_required

quizzes_bp = Blueprint("quizzes", __name__)

@quizzes_bp.route("/questions", methods=["GET"])
@auth_required()
def get_questions(user_oid):
    topic = request.args.get("topic", "Python")
    count = int(request.args.get("count", 5))
    difficulty = request.args.get("difficulty", "Medium")
    subject_id = request.args.get("subject_id")

    questions = QuizService.get_or_generate_questions(
        topic=topic,
        count=count,
        difficulty=difficulty,
        subject_id=subject_id
    )
    return api_response(data={"questions": questions, "topic": topic})

@quizzes_bp.route("/submit", methods=["POST"])
@auth_required()
def submit_quiz(user_oid):
    data = request.get_json() or {}
    topic = data.get("topic", "General")
    submissions = data.get("submissions") or []
    time_taken_seconds = data.get("time_taken_seconds", 0)
    subject_id = data.get("subject_id")

    if not submissions:
        return api_error("No quiz answers submitted.", 400)

    result = QuizService.evaluate_quiz_submission(
        user_id=user_oid,
        topic=topic,
        submissions=submissions,
        time_taken_seconds=time_taken_seconds,
        subject_id=subject_id
    )
    return api_response(message="Quiz evaluated successfully.", data=result)

@quizzes_bp.route("/attempts", methods=["GET"])
@auth_required()
def get_attempts(user_oid):
    limit = int(request.args.get("limit", 20))
    attempts = list(mongo.quiz_attempts.find({"user_id": user_oid}).sort("created_at", -1).limit(limit))
    return api_response(data={"attempts": serialize_doc(attempts)})

@quizzes_bp.route("/weak-topics", methods=["GET"])
@auth_required()
def get_weak_topics(user_oid):
    weak = QuizService.get_weak_topics(user_oid=user_oid)
    return api_response(data={"weak_topics": weak})

