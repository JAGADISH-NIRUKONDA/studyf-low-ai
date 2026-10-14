import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def validate_registration(data):
    errors = {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or len(name) < 2:
        errors["name"] = "Name must be at least 2 characters long."
    if not email or not EMAIL_REGEX.match(email):
        errors["email"] = "Please provide a valid email address."
    if not password or len(password) < 8:
        errors["password"] = "Password must be at least 8 characters long."

    return errors

def validate_login(data):
    errors = {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email:
        errors["email"] = "Email is required."
    if not password:
        errors["password"] = "Password is required."

    return errors

