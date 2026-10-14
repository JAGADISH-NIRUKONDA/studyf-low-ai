from datetime import datetime
from flask import Blueprint, request
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.utils.helpers import api_response, api_error, auth_required

topics_bp = Blueprint("topics", __name__)

@topics_bp.route("", methods=["GET"])
@auth_required()
def get_topics(user_oid):
    subject_id = request.args.get("subject_id")
    query = {"user_id": user_oid}
    if subject_id:
        s_oid = to_object_id(subject_id)
        if s_oid:
            query["subject_id"] = s_oid

    topics = list(mongo.topics.find(query).sort("created_at", 1))
    return api_response(data={"topics": serialize_doc(topics)})

@topics_bp.route("", methods=["POST"])
@auth_required()
def create_topic(user_oid):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    subject_id = data.get("subject_id")

    if not title:
        return api_error("Topic title is required.", 400)
    s_oid = to_object_id(subject_id)
    if not s_oid:
        return api_error("Valid subject_id is required.", 400)

    # Verify subject ownership
    subject = mongo.subjects.find_one({"_id": s_oid, "user_id": user_oid})
    if not subject:
        return api_error("Subject not found or unauthorized.", 404)

    topic_doc = {
        "user_id": user_oid,
        "subject_id": s_oid,
        "title": title,
        "difficulty": data.get("difficulty", "Medium"),
        "estimated_minutes": int(data.get("estimated_minutes", 45)),
        "importance": int(data.get("importance", 3)),
        "completed": False,
        "completed_at": None,
        "created_at": datetime.utcnow()
    }
    res = mongo.topics.insert_one(topic_doc)
    topic_doc["_id"] = res.inserted_id
    return api_response(message="Topic created.", data={"topic": serialize_doc(topic_doc)}, status_code=201)

@topics_bp.route("/<topic_id>", methods=["PATCH"])
@auth_required()
def update_topic(user_oid, topic_id):
    t_oid = to_object_id(topic_id)
    if not t_oid:
        return api_error("Invalid topic ID.", 400)

    data = request.get_json() or {}
    update_data = {}
    if "title" in data and data["title"].strip():
        update_data["title"] = data["title"].strip()
    if "difficulty" in data:
        update_data["difficulty"] = data["difficulty"]
    if "estimated_minutes" in data:
        update_data["estimated_minutes"] = int(data["estimated_minutes"])
    if "importance" in data:
        update_data["importance"] = int(data["importance"])
    if "completed" in data:
        update_data["completed"] = bool(data["completed"])
        update_data["completed_at"] = datetime.utcnow() if update_data["completed"] else None

    if not update_data:
        return api_error("No fields to update.", 400)

    res = mongo.topics.update_one({"_id": t_oid, "user_id": user_oid}, {"$set": update_data})
    if res.matched_count == 0:
        return api_error("Topic not found.", 404)

    updated = mongo.topics.find_one({"_id": t_oid})
    return api_response(message="Topic updated.", data={"topic": serialize_doc(updated)})

@topics_bp.route("/<topic_id>/toggle", methods=["PATCH"])
@auth_required()
def toggle_topic(user_oid, topic_id):
    t_oid = to_object_id(topic_id)
    if not t_oid:
        return api_error("Invalid topic ID.", 400)

    topic = mongo.topics.find_one({"_id": t_oid, "user_id": user_oid})
    if not topic:
        return api_error("Topic not found.", 404)

    new_state = not topic.get("completed", False)
    mongo.topics.update_one(
        {"_id": t_oid},
        {"$set": {"completed": new_state, "completed_at": datetime.utcnow() if new_state else None}}
    )
    topic["completed"] = new_state
    return api_response(message=f"Topic marked as {'completed' if new_state else 'incomplete'}.", data={"topic": serialize_doc(topic)})

@topics_bp.route("/<topic_id>", methods=["DELETE"])
@auth_required()
def delete_topic(user_oid, topic_id):
    t_oid = to_object_id(topic_id)
    if not t_oid:
        return api_error("Invalid topic ID.", 400)

    res = mongo.topics.delete_one({"_id": t_oid, "user_id": user_oid})
    if res.deleted_count == 0:
        return api_error("Topic not found.", 404)

    return api_response(message="Topic deleted.")

