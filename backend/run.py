import os
import sys

# Ensure backend directory is in python module search path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[*] StudyFlow AI Backend API starting on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)

