import os
from datetime import datetime, timedelta

from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

from models import db

load_dotenv()


def create_app():
    app = Flask(__name__)

    # ---- Configuração principal ----
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["DATABASE_URL"]
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-troque-em-prod")

    # Sessão de cookie (httpOnly) usada para autenticação
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "None"
    app.config["SESSION_COOKIE_SECURE"] = os.environ.get("FLASK_DEBUG", "false").lower() != "true"
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)

    # ---- CORS por ambiente ----
    CORS(
        app,
        origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
        supports_credentials=True,
    )

    # ---- Banco de dados / Migrations ----
    db.init_app(app)
    Migrate(app, db)

    # ---- Blueprints ----
    from routes.auth import auth_bp
    from routes.financeiro import financeiro_bp
    from routes.pix import pix_bp
    from routes.bolsa import bolsa_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(financeiro_bp)
    app.register_blueprint(pix_bp)
    app.register_blueprint(bolsa_bp)

    @app.route("/")
    def health():
        return jsonify({"status": "ok", "service": "minerva-backend"})

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true")
