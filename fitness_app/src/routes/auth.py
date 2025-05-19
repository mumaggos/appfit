from flask import Blueprint, request, jsonify, session
from src.models.user import User
from src.extensions import db # Changed import

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Missing username, email, or password"}), 400

    if User.query.filter_by(username=username).first() is not None:
        return jsonify({"error": "Username already exists"}), 409

    if User.query.filter_by(email=email).first() is not None:
        return jsonify({"error": "Email already exists"}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    user = User.query.filter_by(username=username).first()

    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    session["user_id"] = user.id
    session["username"] = user.username
    return jsonify({"message": "Login successful", "user_id": user.id, "username": user.username}), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    session.pop("username", None)
    return jsonify({"message": "Logout successful"}), 200

@auth_bp.route("/status", methods=["GET"])
def status():
    if "user_id" in session:
        return jsonify({"logged_in": True, "user_id": session["user_id"], "username": session.get("username")}), 200
    else:
        return jsonify({"logged_in": False}), 200

