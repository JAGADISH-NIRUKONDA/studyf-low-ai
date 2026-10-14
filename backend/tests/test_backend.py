import os
import sys
import pytest

# Ensure backend folder is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.database import mongo

@pytest.fixture(scope="session")
def app():
    os.environ["MONGODB_DATABASE"] = "studyflow_test_db"
    test_app = create_app()
    test_app.config["TESTING"] = True
    # Clean test db before and after
    if mongo.client:
        mongo.client.drop_database("studyflow_test_db")
    yield test_app
    if mongo.client:
        mongo.client.drop_database("studyflow_test_db")

@pytest.fixture(scope="session")
def client(app):
    return app.test_client()

@pytest.fixture(scope="session")
def auth_headers(client):
    # Ensure test user exists
    reg_resp = client.post("/api/auth/register", json={
        "name": "Integration Tester",
        "email": "tester@studyflow.ai",
        "password": "Password123!"
    })
    if reg_resp.status_code == 201:
        token = reg_resp.get_json()["data"]["token"]
    else:
        login_resp = client.post("/api/auth/login", json={
            "email": "tester@studyflow.ai",
            "password": "Password123!"
        })
        token = login_resp.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "ok"

def test_auth_flow(client, auth_headers):
    # Duplicate email rejection
    dup = client.post("/api/auth/register", json={
        "name": "Duplicate Tester",
        "email": "tester@studyflow.ai",
        "password": "Password123!"
    })
    assert dup.status_code == 409

    # Bad password login
    bad = client.post("/api/auth/login", json={
        "email": "tester@studyflow.ai",
        "password": "WrongPassword!"
    })
    assert bad.status_code == 401

    # Successful login
    ok = client.post("/api/auth/login", json={
        "email": "tester@studyflow.ai",
        "password": "Password123!"
    })
    assert ok.status_code == 200
    assert "token" in ok.get_json()["data"]

def test_unauthorized_access(client):
    resp = client.get("/api/subjects")
    assert resp.status_code == 401

def test_subjects_and_topics_crud(client, auth_headers):
    # Create subject
    s_resp = client.post("/api/subjects", headers=auth_headers, json={
        "name": "Distributed Systems",
        "color": "#10b981",
        "target_hours": 6.0,
        "exam_date": "2026-11-20"
    })
    assert s_resp.status_code == 201
    subject_id = s_resp.get_json()["data"]["subject"]["id"]

    # Create topic
    t_resp = client.post("/api/topics", headers=auth_headers, json={
        "subject_id": subject_id,
        "title": "Raft Consensus Algorithm",
        "difficulty": "Hard",
        "estimated_minutes": 60,
        "importance": 5
    })
    assert t_resp.status_code == 201
    topic_id = t_resp.get_json()["data"]["topic"]["id"]

    # Toggle topic
    tog_resp = client.patch(f"/api/topics/{topic_id}/toggle", headers=auth_headers)
    assert tog_resp.status_code == 200
    assert tog_resp.get_json()["data"]["topic"]["completed"] is True

    # Untoggle
    tog_resp2 = client.patch(f"/api/topics/{topic_id}/toggle", headers=auth_headers)
    assert tog_resp2.status_code == 200
    assert tog_resp2.get_json()["data"]["topic"]["completed"] is False

    # Get subjects list
    list_resp = client.get("/api/subjects", headers=auth_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.get_json()["data"]["subjects"]) >= 1

def test_tasks_crud(client, auth_headers):
    t_resp = client.post("/api/tasks", headers=auth_headers, json={
        "title": "Complete Chapter 4 Exercises",
        "priority": "High",
        "due_date": "2026-10-30"
    })
    assert t_resp.status_code == 201
    task_id = t_resp.get_json()["data"]["task"]["id"]

    tog = client.patch(f"/api/tasks/{task_id}/toggle", headers=auth_headers)
    assert tog.status_code == 200
    assert tog.get_json()["data"]["task"]["completed"] is True

def test_planner_generation(client, auth_headers):
    gen_resp = client.post("/api/planner/generate", headers=auth_headers, json={
        "days": 7,
        "hours_per_day": 2,
        "session_duration": 45
    })
    assert gen_resp.status_code == 200
    data = gen_resp.get_json()["data"]
    assert "created_sessions" in data

    plan_resp = client.get("/api/planner", headers=auth_headers)
    assert plan_resp.status_code == 200
    assert "sessions" in plan_resp.get_json()["data"]

def test_quiz_security_and_scoring(client, auth_headers):
    # Questions endpoint should not reveal correct_option
    q_resp = client.get("/api/quizzes/questions?topic=Python&count=3", headers=auth_headers)
    assert q_resp.status_code == 200
    questions = q_resp.get_json()["data"]["questions"]
    assert len(questions) > 0
    for q in questions:
        assert "correct_option" not in q, "Security error: correct_option was exposed to client!"
        assert "explanation" not in q, "Security error: explanation was exposed to client!"

    # Submit quiz
    sub_payload = {
        "topic": "Python",
        "submissions": [{"question_id": questions[0]["id"], "selected_option": 0}],
        "time_taken_seconds": 45
    }
    eval_resp = client.post("/api/quizzes/submit", headers=auth_headers, json=sub_payload)
    assert eval_resp.status_code == 200
    eval_data = eval_resp.get_json()["data"]
    assert "score" in eval_data
    assert "percentage" in eval_data
    assert "breakdown" in eval_data
    assert "correct_option" in eval_data["breakdown"][0]

def test_ai_doubt_assistant(client, auth_headers):
    # Create conversation
    conv_resp = client.post("/api/chat/conversations", headers=auth_headers, json={
        "title": "Machine Learning Doubts"
    })
    assert conv_resp.status_code == 201
    conv_id = conv_resp.get_json()["data"]["conversation"]["id"]

    # Send message
    msg_resp = client.post(f"/api/chat/conversations/{conv_id}/messages", headers=auth_headers, json={
        "content": "Can you explain overfitting and how to avoid it?"
    })
    assert msg_resp.status_code == 201
    msg_data = msg_resp.get_json()["data"]
    assert "user_message" in msg_data
    assert "assistant_message" in msg_data
    assert len(msg_data["assistant_message"]["content"]) > 20

    # Convert to note
    note_resp = client.post("/api/chat/convert-to-note", headers=auth_headers, json={
        "title": "Overfitting Summary",
        "content": msg_data["assistant_message"]["content"]
    })
    assert note_resp.status_code == 200

def test_career_recommendation(client, auth_headers):
    rec_resp = client.post("/api/career/recommend", headers=auth_headers, json={
        "academic_interests": ["Web Architecture", "Database Systems"],
        "technical_skills": [{"skill": "React.js", "level": "Intermediate"}, {"skill": "Python", "level": "Beginner"}],
        "career_goal": "Full Stack Web Developer"
    })
    assert rec_resp.status_code == 200
    recs = rec_resp.get_json()["data"]["recommendations"]
    assert len(recs) > 0
    top_rec = recs[0]
    assert "role_title" in top_rec
    assert "match_percentage" in top_rec
    assert "learning_roadmap" in top_rec
    assert "skill_gaps" in top_rec

def test_dashboard_and_analytics(client, auth_headers):
    dash_resp = client.get("/api/dashboard", headers=auth_headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.get_json()["data"]
    assert "total_subjects" in dash_data
    assert "streak_days" in dash_data

    ana_resp = client.get("/api/analytics", headers=auth_headers)
    assert ana_resp.status_code == 200
    ana_data = ana_resp.get_json()["data"]
    assert "subject_progress" in ana_data
    assert "weekly_study" in ana_data
    assert "quiz_trends" in ana_data

    # CSV Export
    csv_resp = client.get("/api/analytics/export", headers=auth_headers)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.content_type

