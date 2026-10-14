from datetime import datetime
from flask import Blueprint, request
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.utils.helpers import api_response, api_error, auth_required

notes_bp = Blueprint("notes", __name__)

@notes_bp.route("", methods=["GET"])
@auth_required()
def get_notes(user_oid):
    subject_id = request.args.get("subject_id")
    search_q = request.args.get("search", "").strip()

    query = {"user_id": user_oid}
    if subject_id:
        s_oid = to_object_id(subject_id)
        if s_oid:
            query["subject_id"] = s_oid

    if search_q:
        query["$or"] = [
            {"title": {"$regex": search_q, "$options": "i"}},
            {"content": {"$regex": search_q, "$options": "i"}},
            {"tags": {"$in": [search_q]}}
        ]

    notes = list(mongo.notes.find(query).sort("updated_at", -1))
    
    subjects = {s["_id"]: s for s in mongo.subjects.find({"user_id": user_oid})}
    result = []
    for n in notes:
        ndoc = serialize_doc(n)
        subj = subjects.get(n.get("subject_id"))
        ndoc["subject_name"] = subj.get("name") if subj else "General"
        ndoc["subject_color"] = subj.get("color") if subj else "#85899f"
        result.append(ndoc)

    return api_response(data={"notes": result})

@notes_bp.route("", methods=["POST"])
@auth_required()
def create_note(user_oid):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return api_error("Note title is required.", 400)

    subject_id = to_object_id(data.get("subject_id"))
    content = data.get("content") or ""
    tags = data.get("tags") or []
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]

    now = datetime.utcnow()
    note_doc = {
        "user_id": user_oid,
        "subject_id": subject_id,
        "title": title,
        "content": content,
        "tags": tags,
        "created_at": now,
        "updated_at": now
    }
    res = mongo.notes.insert_one(note_doc)
    note_doc["_id"] = res.inserted_id

    ndoc = serialize_doc(note_doc)
    if subject_id:
        subj = mongo.subjects.find_one({"_id": subject_id})
        ndoc["subject_name"] = subj.get("name") if subj else "General"
        ndoc["subject_color"] = subj.get("color") if subj else "#85899f"
    else:
        ndoc["subject_name"] = "General"
        ndoc["subject_color"] = "#85899f"

    return api_response(message="Note saved.", data={"note": ndoc}, status_code=201)

@notes_bp.route("/<note_id>", methods=["GET"])
@auth_required()
def get_note(user_oid, note_id):
    n_oid = to_object_id(note_id)
    if not n_oid:
        return api_error("Invalid note ID.", 400)

    note = mongo.notes.find_one({"_id": n_oid, "user_id": user_oid})
    if not note:
        return api_error("Note not found.", 404)

    return api_response(data={"note": serialize_doc(note)})

@notes_bp.route("/<note_id>", methods=["PATCH"])
@auth_required()
def update_note(user_oid, note_id):
    n_oid = to_object_id(note_id)
    if not n_oid:
        return api_error("Invalid note ID.", 400)

    data = request.get_json() or {}
    update_data = {"updated_at": datetime.utcnow()}
    if "title" in data and data["title"].strip():
        update_data["title"] = data["title"].strip()
    if "content" in data:
        update_data["content"] = data["content"]
    if "subject_id" in data:
        update_data["subject_id"] = to_object_id(data["subject_id"])
    if "tags" in data:
        tags = data["tags"]
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]
        update_data["tags"] = tags

    res = mongo.notes.update_one({"_id": n_oid, "user_id": user_oid}, {"$set": update_data})
    if res.matched_count == 0:
        return api_error("Note not found.", 404)

    updated = mongo.notes.find_one({"_id": n_oid})
    return api_response(message="Note updated.", data={"note": serialize_doc(updated)})

@notes_bp.route("/<note_id>", methods=["DELETE"])
@auth_required()
def delete_note(user_oid, note_id):
    n_oid = to_object_id(note_id)
    if not n_oid:
        return api_error("Invalid note ID.", 400)

    res = mongo.notes.delete_one({"_id": n_oid, "user_id": user_oid})
    if res.deleted_count == 0:
        return api_error("Note not found.", 404)

    return api_response(message="Note deleted.")

