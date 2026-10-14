import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "studyflow-default-secret-key-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "studyflow-default-jwt-secret-key-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_DAYS", "7")))
    
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
    MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "studyflow_ai")
    
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    AI_PROVIDER = os.getenv("AI_PROVIDER", "")
    AI_API_KEY = os.getenv("AI_API_KEY", "")
    AI_MODEL = os.getenv("AI_MODEL", "gemini-1.5-flash")
    
    PORT = int(os.getenv("PORT", 5000))

