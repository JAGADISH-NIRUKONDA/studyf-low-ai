import os
import sys
import pytest
from pymongo import MongoClient

# Ensure backend folder is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app

def test_migrated_user_persistence():
    client = MongoClient("mongodb://127.0.0.1:27017")
    db = client["studyflow_ai"]
    
    user = db.users.find_one({"email": "jagadishnirukonda@gmail.com"})
    assert user is not None, "Migrated user was not found in MongoDB!"
    assert user["name"] == "jagadish"

    # Check relational integrity with subject
    subject = db.subjects.find_one({"user_id": user["_id"]})
    assert subject is not None
    assert subject["name"] == "Python Programming"

    # Check topics
    topics = list(db.topics.find({"subject_id": subject["_id"]}))
    assert len(topics) == 4

    # Check quiz questions bank
    questions = list(db.quiz_questions.find({}))
    assert len(questions) >= 9

