from datetime import datetime
from flask import Blueprint, request
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.services.ai_service import AIService
from app.utils.helpers import api_response, api_error, auth_required

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/provider-info", methods=["GET"])
@auth_required()
def provider_info(user_oid):
    info = AIService.get_provider_info()
    return api_response(data={"ai_provider": info})

@chat_bp.route("/conversations", methods=["GET"])
@auth_required()
def get_conversations(user_oid):
    convs = list(mongo.chat_conversations.find({"user_id": user_oid}).sort("updated_at", -1))
    return api_response(data={"conversations": serialize_doc(convs)})

@chat_bp.route("/conversations", methods=["POST"])
@auth_required()
def create_conversation(user_oid):
    data = request.get_json() or {}
    title = (data.get("title") or "New Doubt Clarification").strip()
    now = datetime.utcnow()

    conv_doc = {
        "user_id": user_oid,
        "title": title,
        "created_at": now,
        "updated_at": now
    }
    res = mongo.chat_conversations.insert_one(conv_doc)
    conv_doc["_id"] = res.inserted_id
    return api_response(message="Conversation started.", data={"conversation": serialize_doc(conv_doc)}, status_code=201)

@chat_bp.route("/conversations/<conversation_id>", methods=["GET"])
@auth_required()
def get_conversation_messages(user_oid, conversation_id):
    c_oid = to_object_id(conversation_id)
    if not c_oid:
        return api_error("Invalid conversation ID.", 400)

    conv = mongo.chat_conversations.find_one({"_id": c_oid, "user_id": user_oid})
    if not conv:
        return api_error("Conversation not found.", 404)

    messages = list(mongo.chat_messages.find({"conversation_id": c_oid}).sort("timestamp", 1))
    return api_response(data={
        "conversation": serialize_doc(conv),
        "messages": serialize_doc(messages)
    })

@chat_bp.route("/conversations/<conversation_id>", methods=["PATCH"])
@auth_required()
def rename_conversation(user_oid, conversation_id):
    c_oid = to_object_id(conversation_id)
    if not c_oid:
        return api_error("Invalid conversation ID.", 400)

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return api_error("Title is required.", 400)

    res = mongo.chat_conversations.update_one(
        {"_id": c_oid, "user_id": user_oid},
        {"$set": {"title": title, "updated_at": datetime.utcnow()}}
    )
    if res.matched_count == 0:
        return api_error("Conversation not found.", 404)

    return api_response(message="Conversation renamed.")

@chat_bp.route("/conversations/<conversation_id>", methods=["DELETE"])
@auth_required()
def delete_conversation(user_oid, conversation_id):
    c_oid = to_object_id(conversation_id)
    if not c_oid:
        return api_error("Invalid conversation ID.", 400)

    res = mongo.chat_conversations.delete_one({"_id": c_oid, "user_id": user_oid})
    if res.deleted_count == 0:
        return api_error("Conversation not found.", 404)

    mongo.chat_messages.delete_many({"conversation_id": c_oid})
    return api_response(message="Conversation and its messages deleted.")

@chat_bp.route("/conversations/<conversation_id>/messages", methods=["POST"])
@auth_required()
def send_message(user_oid, conversation_id):
    c_oid = to_object_id(conversation_id)
    if not c_oid:
        return api_error("Invalid conversation ID.", 400)

    conv = mongo.chat_conversations.find_one({"_id": c_oid, "user_id": user_oid})
    if not conv:
        return api_error("Conversation not found.", 404)

    data = request.get_json() or {}
    content = (data.get("content") or "").strip()
    subject_context = data.get("subject_context") or ""

    if not content:
        return api_error("Message content is required.", 400)

    now = datetime.utcnow()
    # 1. Save user message
    user_msg_doc = {
        "conversation_id": c_oid,
        "user_id": user_oid,
        "role": "user",
        "content": content,
        "timestamp": now
    }
    mongo.chat_messages.insert_one(user_msg_doc)

    # 2. Fetch past context for model
    past_messages = list(mongo.chat_messages.find({"conversation_id": c_oid}).sort("timestamp", 1).limit(10))
    formatted_past = [{"role": m["role"], "content": m["content"]} for m in past_messages]

    # 3. Generate AI or Fallback response
    ai_result = AIService.generate_chat_response(formatted_past, subject_context=subject_context)

    # 4. Save assistant response
    assistant_msg_doc = {
        "conversation_id": c_oid,
        "user_id": user_oid,
        "role": "assistant",
        "content": ai_result["content"],
        "source": ai_result.get("source"),
        "model": ai_result.get("model"),
        "timestamp": datetime.utcnow()
    }
    res_assistant = mongo.chat_messages.insert_one(assistant_msg_doc)
    assistant_msg_doc["_id"] = res_assistant.inserted_id

    # Update conversation's updated_at and auto-generate title if default
    update_fields = {"updated_at": datetime.utcnow()}
    if conv.get("title") == "New Doubt Clarification":
        # First 5-6 words of user question
        snippet = " ".join(content.split()[:5])
        update_fields["title"] = snippet.capitalize() if snippet else "Study Question"

    mongo.chat_conversations.update_one({"_id": c_oid}, {"$set": update_fields})

    return api_response(data={
        "user_message": serialize_doc(user_msg_doc),
        "assistant_message": serialize_doc(assistant_msg_doc)
    }, status_code=201)

@chat_bp.route("/convert-to-note", methods=["POST"])
@auth_required()
def convert_to_note(user_oid):
    data = request.get_json() or {}
    title = (data.get("title") or "Study Doubt Explanation").strip()
    content = data.get("content") or ""
    subject_id = to_object_id(data.get("subject_id"))

    if not content:
        return api_error("Content is required to create a note.", 400)

    now = datetime.utcnow()
    note_doc = {
        "user_id": user_oid,
        "subject_id": subject_id,
        "title": title,
        "content": content,
        "tags": ["AI Doubt Assistant", "Revision"],
        "created_at": now,
        "updated_at": now
    }
    res = mongo.notes.insert_one(note_doc)
    note_doc["_id"] = res.inserted_id

    return api_response(message="Explanation saved directly to your Notes!", data={"note": serialize_doc(note_doc)})

