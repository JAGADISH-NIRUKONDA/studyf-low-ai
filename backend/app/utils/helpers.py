from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from bson import ObjectId
from app.database import to_object_id

def api_response(success=True, message="", data=None, status_code=200):
    payload = {
        "success": success,
        "message": message,
        "data": data
    }
    return jsonify(payload), status_code

def api_error(message="An error occurred", status_code=400, errors=None):
    payload = {
        "success": False,
        "message": message,
        "errors": errors
    }
    return jsonify(payload), status_code

def auth_required():
    """Custom decorator combining JWT verification with user_id extraction."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                identity = get_jwt_identity()
                user_oid = to_object_id(identity)
                if not user_oid:
                    return api_error("Invalid authentication credentials", 401)
                return fn(user_oid=user_oid, *args, **kwargs)
            except Exception as e:
                return api_error(f"Unauthorized: {str(e)}", 401)
        return wrapper
    return decorator

