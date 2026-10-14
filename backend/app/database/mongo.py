import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None

    def init_app(self, app):
        uri = app.config.get("MONGODB_URI", "mongodb://127.0.0.1:27017")
        db_name = app.config.get("MONGODB_DATABASE", "studyflow_ai")
        self.client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        self.db = self.client[db_name]
        self._create_indexes()

    def _create_indexes(self):
        try:
            # Users
            self.db.users.create_index([("email", ASCENDING)], unique=True)
            
            # Subjects & Topics
            self.db.subjects.create_index([("user_id", ASCENDING)])
            self.db.topics.create_index([("user_id", ASCENDING), ("subject_id", ASCENDING)])
            
            # Study Sessions & Tasks
            self.db.study_sessions.create_index([("user_id", ASCENDING), ("session_date", ASCENDING)])
            self.db.tasks.create_index([("user_id", ASCENDING), ("completed", ASCENDING), ("due_date", ASCENDING)])
            
            # Notes
            self.db.notes.create_index([("user_id", ASCENDING), ("updated_at", DESCENDING)])
            
            # Quizzes
            self.db.quiz_questions.create_index([("subject_id", ASCENDING), ("topic", ASCENDING)])
            self.db.quiz_attempts.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
            
            # Career
            self.db.career_profiles.create_index([("user_id", ASCENDING)], unique=True)
            self.db.career_recommendations.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
            
            # Chat
            self.db.chat_conversations.create_index([("user_id", ASCENDING), ("updated_at", DESCENDING)])
            self.db.chat_messages.create_index([("conversation_id", ASCENDING), ("timestamp", ASCENDING)])
        except Exception as e:
            print(f"[MongoDB Warning] Index creation notice: {e}")

    @property
    def users(self):
        return self.db.users

    @property
    def subjects(self):
        return self.db.subjects

    @property
    def topics(self):
        return self.db.topics

    @property
    def study_sessions(self):
        return self.db.study_sessions

    @property
    def tasks(self):
        return self.db.tasks

    @property
    def notes(self):
        return self.db.notes

    @property
    def quiz_questions(self):
        return self.db.quiz_questions

    @property
    def quiz_attempts(self):
        return self.db.quiz_attempts

    @property
    def career_profiles(self):
        return self.db.career_profiles

    @property
    def career_recommendations(self):
        return self.db.career_recommendations

    @property
    def chat_conversations(self):
        return self.db.chat_conversations

    @property
    def chat_messages(self):
        return self.db.chat_messages

mongo = MongoDB()

def serialize_doc(doc):
    """Recursively converts MongoDB doc ObjectId and dates to JSON-serializable types."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if not isinstance(doc, dict):
        return doc

    result = {}
    for k, v in doc.items():
        if k == "_id":
            result["id"] = str(v)
        elif isinstance(v, ObjectId):
            result[k] = str(v)
        elif hasattr(v, "isoformat"):
            result[k] = v.isoformat()
        elif isinstance(v, dict):
            result[k] = serialize_doc(v)
        elif isinstance(v, list):
            result[k] = [serialize_doc(i) for i in v]
        else:
            result[k] = v
    return result

def to_object_id(val):
    if not val:
        return None
    if isinstance(val, ObjectId):
        return val
    try:
        return ObjectId(str(val))
    except Exception:
        return None

