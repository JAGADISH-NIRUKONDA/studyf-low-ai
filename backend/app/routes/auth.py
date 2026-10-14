from datetime import datetime
from flask import Blueprint, request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app.database import mongo, serialize_doc, to_object_id
from app.utils.helpers import api_response, api_error, auth_required
from app.utils.validators import validate_registration, validate_login

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    errors = validate_registration(data)
    if errors:
        return api_error("Validation failed", 422, errors)

    email = data["email"].strip().lower()
    if mongo.users.find_one({"email": email}):
        return api_error("An account with this email already exists.", 409)

    user_doc = {
        "name": data["name"].strip(),
        "email": email,
        "password_hash": generate_password_hash(data["password"]),
        "preferences": {
            "theme": data.get("theme", "light"),
            "notifications_enabled": True
        },
        "created_at": datetime.utcnow()
    }
    res = mongo.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    access_token = create_access_token(identity=user_id)
    safe_user = {
        "id": user_id,
        "name": user_doc["name"],
        "email": user_doc["email"],
        "preferences": user_doc["preferences"]
    }
    return api_response(
        success=True,
        message="Registration successful.",
        data={"user": safe_user, "token": access_token},
        status_code=201
    )

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    errors = validate_login(data)
    if errors:
        return api_error("Validation failed", 422, errors)

    email = data["email"].strip().lower()
    user = mongo.users.find_one({"email": email})
    if not user or not check_password_hash(user["password_hash"], data["password"]):
        return api_error("Invalid email or password.", 401)

    user_id = str(user["_id"])
    access_token = create_access_token(identity=user_id)
    safe_user = {
        "id": user_id,
        "name": user.get("name"),
        "email": user.get("email"),
        "preferences": user.get("preferences", {"theme": "light"})
    }
    return api_response(
        success=True,
        message="Login successful.",
        data={"user": safe_user, "token": access_token}
    )

@auth_bp.route("/me", methods=["GET"])
@auth_required()
def get_current_user(user_oid):
    user = mongo.users.find_one({"_id": user_oid})
    if not user:
        return api_error("User not found", 404)

    safe_user = {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "preferences": user.get("preferences", {"theme": "light"}),
        "created_at": user.get("created_at")
    }
    return api_response(data={"user": serialize_doc(safe_user)})

@auth_bp.route("/profile", methods=["PATCH"])
@auth_required()
def update_profile(user_oid):
    data = request.get_json() or {}
    update_fields = {}
    if "name" in data and data["name"].strip():
        update_fields["name"] = data["name"].strip()
    if "preferences" in data and isinstance(data["preferences"], dict):
        for k, v in data["preferences"].items():
            update_fields[f"preferences.{k}"] = v

    if not update_fields:
        return api_error("No valid fields provided for update", 400)

    mongo.users.update_one({"_id": user_oid}, {"$set": update_fields})
    updated = mongo.users.find_one({"_id": user_oid})
    safe_user = {
        "id": str(updated["_id"]),
        "name": updated.get("name"),
        "email": updated.get("email"),
        "preferences": updated.get("preferences", {})
    }
    return api_response(message="Profile updated successfully.", data={"user": safe_user})

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return api_response(message="Logged out successfully.")

