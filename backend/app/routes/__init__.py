from .auth import auth_bp
from .subjects import subjects_bp
from .topics import topics_bp
from .tasks import tasks_bp
from .notes import notes_bp
from .planner import planner_bp
from .quizzes import quizzes_bp
from .career import career_bp
from .chat import chat_bp
from .dashboard import dashboard_bp
from .analytics import analytics_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(subjects_bp, url_prefix="/api/subjects")
    app.register_blueprint(topics_bp, url_prefix="/api/topics")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(notes_bp, url_prefix="/api/notes")
    app.register_blueprint(planner_bp, url_prefix="/api/planner")
    app.register_blueprint(quizzes_bp, url_prefix="/api/quizzes")
    app.register_blueprint(career_bp, url_prefix="/api/career")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

