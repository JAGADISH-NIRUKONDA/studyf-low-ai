from datetime import datetime, date
from flask import Blueprint, request
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.services.planner_service import PlannerService
from app.utils.helpers import api_response, api_error, auth_required

planner_bp = Blueprint("planner", __name__)

@planner_bp.route("", methods=["GET"])
@auth_required()
def get_study_sessions(user_oid):
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    status = request.args.get("status")

    query = {"user_id": user_oid}
    if start_date and end_date:
        query["session_date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["session_date"] = {"$gte": start_date}

    if status:
        query["status"] = status

    sessions = list(mongo.study_sessions.find(query).sort([("session_date", 1), ("start_time", 1)]))
    
    # Enrich with subject data
    subjects = {s["_id"]: s for s in mongo.subjects.find({"user_id": user_oid})}
    result = []
    for ss in sessions:
        doc = serialize_doc(ss)
        subj = subjects.get(ss.get("subject_id"))
        doc["subject_name"] = subj.get("name") if subj else "General"
        doc["subject_color"] = subj.get("color") if subj else "#6366f1"
        result.append(doc)

    return api_response(data={"sessions": result})

@planner_bp.route("/generate", methods=["POST"])
@auth_required()
def generate_plan(user_oid):
    data = request.get_json() or {}
    start_date = data.get("start_date") or date.today().isoformat()
    days = int(data.get("days") or 7)
    hours_per_day = int(data.get("hours_per_day") or 3)
    session_duration = int(data.get("session_duration") or 45)
    replace_existing = bool(data.get("replace_existing", True))

    result = PlannerService.generate_plan(
        user_id=user_oid,
        start_date_str=start_date,
        days=days,
        hours_per_day=hours_per_day,
        session_duration=session_duration,
        replace_existing=replace_existing
    )
    return api_response(message=result.get("message"), data=result)

@planner_bp.route("/recalculate", methods=["POST"])
@auth_required()
def recalculate_plan(user_oid):
    data = request.get_json() or {}
    hours_per_day = int(data.get("hours_per_day") or 3)

    result = PlannerService.recalculate_missed_sessions(user_id=user_oid, hours_per_day=hours_per_day)
    return api_response(
        message=f"Recalculated plan. Marked {result.get('missed_marked', 0)} missed sessions and rescheduled upcoming topics.",
        data=result
    )

@planner_bp.route("/study-sessions/<session_id>", methods=["PATCH"])
@auth_required()
def update_study_session(user_oid, session_id):
    s_oid = to_object_id(session_id)
    if not s_oid:
        return api_error("Invalid session ID.", 400)

    data = request.get_json() or {}
    update_data = {}

    if "completed" in data:
        is_comp = bool(data["completed"])
        update_data["completed"] = is_comp
        update_data["status"] = "completed" if is_comp else "pending"
    if "status" in data:
        update_data["status"] = data["status"]
        if data["status"] == "completed":
            update_data["completed"] = True
        elif data["status"] in ("pending", "missed", "rescheduled"):
            update_data["completed"] = False
    if "session_date" in data:
        update_data["session_date"] = data["session_date"]
    if "start_time" in data:
        update_data["start_time"] = data["start_time"]
    if "duration_minutes" in data:
        update_data["duration_minutes"] = int(data["duration_minutes"])

    if not update_data:
        return api_error("No fields to update.", 400)

    res = mongo.study_sessions.update_one({"_id": s_oid, "user_id": user_oid}, {"$set": update_data})
    if res.matched_count == 0:
        return api_error("Session not found.", 404)

    updated = mongo.study_sessions.find_one({"_id": s_oid})
    return api_response(message="Session updated.", data={"session": serialize_doc(updated)})

@planner_bp.route("/study-sessions/<session_id>", methods=["DELETE"])
@auth_required()
def delete_study_session(user_oid, session_id):
    s_oid = to_object_id(session_id)
    if not s_oid:
        return api_error("Invalid session ID.", 400)

    res = mongo.study_sessions.delete_one({"_id": s_oid, "user_id": user_oid})
    if res.deleted_count == 0:
        return api_error("Session not found.", 404)

    return api_response(message="Session deleted.")

