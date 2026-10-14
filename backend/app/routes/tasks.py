from datetime import datetime
from flask import Blueprint, request
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.utils.helpers import api_response, api_error, auth_required

tasks_bp = Blueprint("tasks", __name__)

@tasks_bp.route("", methods=["GET"])
@auth_required()
def get_tasks(user_oid):
    subject_id = request.args.get("subject_id")
    query = {"user_id": user_oid}
    if subject_id:
        s_oid = to_object_id(subject_id)
        if s_oid:
            query["subject_id"] = s_oid

    tasks = list(mongo.tasks.find(query).sort([("completed", 1), ("due_date", 1)]))
    
    # Enrich with subject name & color
    subjects = {s["_id"]: s for s in mongo.subjects.find({"user_id": user_oid})}
    result = []
    for t in tasks:
        tdoc = serialize_doc(t)
        subj = subjects.get(t.get("subject_id"))
        tdoc["subject_name"] = subj.get("name") if subj else "General"
        tdoc["subject_color"] = subj.get("color") if subj else "#85899f"
        result.append(tdoc)

    return api_response(data={"tasks": result})

@tasks_bp.route("", methods=["POST"])
@auth_required()
def create_task(user_oid):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return api_error("Task title is required.", 400)

    subject_id = to_object_id(data.get("subject_id"))
    due_date = data.get("due_date") or None
    priority = data.get("priority", "Medium")

    task_doc = {
        "user_id": user_oid,
        "subject_id": subject_id,
        "title": title,
        "due_date": due_date,
        "priority": priority,
        "completed": False,
        "created_at": datetime.utcnow()
    }
    res = mongo.tasks.insert_one(task_doc)
    task_doc["_id"] = res.inserted_id

    tdoc = serialize_doc(task_doc)
    if subject_id:
        subj = mongo.subjects.find_one({"_id": subject_id})
        tdoc["subject_name"] = subj.get("name") if subj else "General"
        tdoc["subject_color"] = subj.get("color") if subj else "#85899f"
    else:
        tdoc["subject_name"] = "General"
        tdoc["subject_color"] = "#85899f"

    return api_response(message="Task created.", data={"task": tdoc}, status_code=201)

@tasks_bp.route("/<task_id>", methods=["PATCH"])
@auth_required()
def update_task(user_oid, task_id):
    t_oid = to_object_id(task_id)
    if not t_oid:
        return api_error("Invalid task ID.", 400)

    data = request.get_json() or {}
    update_data = {}
    if "title" in data and data["title"].strip():
        update_data["title"] = data["title"].strip()
    if "due_date" in data:
        update_data["due_date"] = data["due_date"]
    if "priority" in data:
        update_data["priority"] = data["priority"]
    if "subject_id" in data:
        update_data["subject_id"] = to_object_id(data["subject_id"])
    if "completed" in data:
        update_data["completed"] = bool(data["completed"])

    if not update_data:
        return api_error("No fields to update.", 400)

    res = mongo.tasks.update_one({"_id": t_oid, "user_id": user_oid}, {"$set": update_data})
    if res.matched_count == 0:
        return api_error("Task not found.", 404)

    updated = mongo.tasks.find_one({"_id": t_oid})
    return api_response(message="Task updated.", data={"task": serialize_doc(updated)})

@tasks_bp.route("/<task_id>/toggle", methods=["PATCH"])
@auth_required()
def toggle_task(user_oid, task_id):
    t_oid = to_object_id(task_id)
    if not t_oid:
        return api_error("Invalid task ID.", 400)

    task = mongo.tasks.find_one({"_id": t_oid, "user_id": user_oid})
    if not task:
        return api_error("Task not found.", 404)

    new_state = not task.get("completed", False)
    mongo.tasks.update_one({"_id": t_oid}, {"$set": {"completed": new_state}})
    task["completed"] = new_state
    return api_response(message=f"Task marked as {'completed' if new_state else 'pending'}.", data={"task": serialize_doc(task)})

@tasks_bp.route("/<task_id>", methods=["DELETE"])
@auth_required()
def delete_task(user_oid, task_id):
    t_oid = to_object_id(task_id)
    if not t_oid:
        return api_error("Invalid task ID.", 400)

    res = mongo.tasks.delete_one({"_id": t_oid, "user_id": user_oid})
    if res.deleted_count == 0:
        return api_error("Task not found.", 404)

    return api_response(message="Task deleted.")

