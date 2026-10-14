import os
import tempfile
import pytest
from app import app, db, User, Subject, Task

@pytest.fixture()
def client():
    fd, path = tempfile.mkstemp(suffix=".db")
    app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI="sqlite:///" + path, WTF_CSRF_ENABLED=False)
    with app.app_context():
        db.drop_all()
        db.create_all()
    with app.test_client() as client:
        yield client
    with app.app_context():
        db.session.remove()
        db.drop_all()
    os.close(fd)
    os.unlink(path)

def test_homepage(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"StudyFlow AI" in response.data

def test_register_and_dashboard(client):
    response = client.post("/register", data={"name":"Test Student","email":"test@example.com","password":"password123"}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Your dashboard" in response.data

def test_login_rejects_bad_password(client):
    client.post("/register", data={"name":"Test Student","email":"test@example.com","password":"password123"})
    client.get("/logout")
    response = client.post("/login", data={"email":"test@example.com","password":"wrongpass"}, follow_redirects=True)
    assert b"Invalid email or password" in response.data

def test_subject_requires_login(client):
    response = client.get("/subjects")
    assert response.status_code in (302, 401)
