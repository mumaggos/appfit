import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from src.extensions import db # Import db from extensions

# Import blueprints
from src.routes.auth import auth_bp
from src.routes.profile import profile_bp
from src.routes.plan import plan_bp 
from src.routes.preferences import preferences_bp
from src.routes.admin import admin_bp
from src.routes.advertisement_routes import ads_bp as admin_ads_bp
from src.routes.advertisement_routes import public_ads_bp
from src.routes.shop_routes import admin_shop_bp, public_shop_bp # Import shop blueprints

# Import all models by importing the models package
import src.models # This will execute src/models/__init__.py

# Define the base directory of the Flask app project
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
INSTANCE_FOLDER_PATH = os.path.join(BASE_DIR, 'instance')

def create_app():
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'), instance_path=INSTANCE_FOLDER_PATH)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_default_secret_key_for_dev_sqlite_v11') # Changed key for clarity

    # Ensure the instance folder exists
    if not os.path.exists(INSTANCE_FOLDER_PATH):
        os.makedirs(INSTANCE_FOLDER_PATH)

    # Enable CORS
    CORS(app, supports_credentials=True)

    # Database Configuration - SQLite
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(INSTANCE_FOLDER_PATH, 'fitness_app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(plan_bp, url_prefix='/api/plan')
    app.register_blueprint(preferences_bp, url_prefix='/api/preferences')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(admin_ads_bp) # Registered under /api/admin/advertisements (prefix in blueprint)
    app.register_blueprint(public_ads_bp) # Registered under /api/advertisements (prefix in blueprint)
    app.register_blueprint(admin_shop_bp) # Registered under /api/admin/shop (prefix in blueprint)
    app.register_blueprint(public_shop_bp) # Registered under /api/shop (prefix in blueprint)

    # Add a simple health check route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy'}), 200

    with app.app_context():
        db.create_all()

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        static_folder_path = app.static_folder
        if static_folder_path is None:
            return jsonify({"error": "Static folder not configured"}), 404

        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                return jsonify({"message": "Welcome to the Fitness App API. Frontend not found or not served from root. Please access API endpoints under /api."}), 200
    return app

if __name__ == '__main__':
    app = create_app()
    # For development, ensure the DB is recreated if models change significantly
    # This is a destructive operation, use with caution.
    # with app.app_context():
    #     db.drop_all() # Drop all tables
    #     db.create_all() # Create all tables
    #     print("Database reset and recreated.")
    app.run(host='0.0.0.0', port=5000, debug=True)
