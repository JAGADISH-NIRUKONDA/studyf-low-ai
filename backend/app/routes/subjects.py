from datetime import datetime
from flask import Blueprint, request
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.utils.helpers import api_response, api_error, auth_required

subjects_bp = Blueprint("subjects", __name__)

@subjects_bp.route("", methods=["GET"])
@auth_required()
def get_subjects(user_oid):
    subjects = list(mongo.subjects.find({"user_id": user_oid}).sort("created_at", -1))
    
    # Enrich with topic counts and completion percentages
    result = []
    for s in subjects:
        s_id = s["_id"]
        total_topics = mongo.topics.count_documents({"subject_id": s_id})
        completed_topics = mongo.topics.count_documents({"subject_id": s_id, "completed": True})
        pct = round((completed_topics / total_topics * 100), 1) if total_topics > 0 else 0
        
        doc = serialize_doc(s)
        doc["total_topics"] = total_topics
        doc["completed_topics"] = completed_topics
        doc["progress_percentage"] = pct
        result.append(doc)

    return api_response(data={"subjects": result})

@subjects_bp.route("", methods=["POST"])
@auth_required()
def create_subject(user_oid):
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return api_error("Subject name is required.", 400)

    color = data.get("color") or "#6366f1"
    target_hours = float(data.get("target_hours") or 5.0)
    exam_date = data.get("exam_date") or None

    new_doc = {
        "user_id": user_oid,
        "name": name,
        "color": color,
        "target_hours": target_hours,
        "exam_date": exam_date,
        "created_at": datetime.utcnow()
    }
    res = mongo.subjects.insert_one(new_doc)
    new_doc["_id"] = res.inserted_id

    serialized = serialize_doc(new_doc)
    serialized["total_topics"] = 0
    serialized["completed_topics"] = 0
    serialized["progress_percentage"] = 0
    return api_response(message="Subject created.", data={"subject": serialized}, status_code=201)

@subjects_bp.route("/<subject_id>", methods=["GET"])
@auth_required()
def get_subject_detail(user_oid, subject_id):
    s_oid = to_object_id(subject_id)
    if not s_oid:
        return api_error("Invalid subject ID.", 400)

    subject = mongo.subjects.find_one({"_id": s_oid, "user_id": user_oid})
    if not subject:
        return api_error("Subject not found.", 404)

    topics = list(mongo.topics.find({"subject_id": s_oid}).sort("created_at", 1))
    tasks = list(mongo.tasks.find({"subject_id": s_oid, "user_id": user_oid}).sort("due_date", 1))

    resp_data = serialize_doc(subject)
    resp_data["topics"] = serialize_doc(topics)
    resp_data["tasks"] = serialize_doc(tasks)
    return api_response(data={"subject": resp_data})

@subjects_bp.route("/<subject_id>", methods=["PATCH"])
@auth_required()
def update_subject(user_oid, subject_id):
    s_oid = to_object_id(subject_id)
    if not s_oid:
        return api_error("Invalid subject ID.", 400)

    data = request.get_json() or {}
    update_data = {}
    if "name" in data and data["name"].strip():
        update_data["name"] = data["name"].strip()
    if "color" in data:
        update_data["color"] = data["color"]
    if "target_hours" in data:
        update_data["target_hours"] = float(data["target_hours"])
    if "exam_date" in data:
        update_data["exam_date"] = data["exam_date"]

    if not update_data:
        return api_error("No fields to update.", 400)

    res = mongo.subjects.update_one({"_id": s_oid, "user_id": user_oid}, {"$set": update_data})
    if res.matched_count == 0:
        return api_error("Subject not found.", 404)

    updated = mongo.subjects.find_one({"_id": s_oid})
    return api_response(message="Subject updated.", data={"subject": serialize_doc(updated)})

@subjects_bp.route("/<subject_id>", methods=["DELETE"])
@auth_required()
def delete_subject(user_oid, subject_id):
    s_oid = to_object_id(subject_id)
    if not s_oid:
        return api_error("Invalid subject ID.", 400)

    res = mongo.subjects.delete_one({"_id": s_oid, "user_id": user_oid})
    if res.deleted_count == 0:
        return api_error("Subject not found.", 404)

    # Cascade deletion of related topics, tasks, study sessions, and notes
    mongo.topics.delete_many({"subject_id": s_oid})
    mongo.tasks.delete_many({"subject_id": s_oid, "user_id": user_oid})
    mongo.study_sessions.delete_many({"subject_id": s_oid, "user_id": user_oid})
    mongo.notes.delete_many({"subject_id": s_oid, "user_id": user_oid})

    return api_response(message="Subject and associated resources deleted.")

