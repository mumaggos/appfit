from functools import wraps
from flask import Blueprint, jsonify, session, current_app, request
from src.models import User, UserProfile, DietPlan, WorkoutPlan # Import all necessary models
from src.extensions import db
from src.routes.profile import login_required # Reuse login_required decorator

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# --- Admin Decorator ---
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Acesso não autorizado. Faça login primeiro."}), 401
        
        user = User.query.get(session["user_id"])
        if not user or not user.is_admin:
            return jsonify({"error": "Acesso negado. Esta funcionalidade é restrita a administradores."}), 403
        return f(*args, **kwargs)
    return decorated_function

# --- Admin Routes ---

@admin_bp.route("/users", methods=["GET"])
@login_required
@admin_required
def list_users():
    """Lista todos os utilizadores (apenas para administradores)."""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        
        users_pagination = User.query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        users_data = [user.to_dict() for user in users_pagination.items]
        
        return jsonify({
            "users": users_data,
            "total_users": users_pagination.total,
            "current_page": users_pagination.page,
            "total_pages": users_pagination.pages
        }), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao listar utilizadores: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao listar os utilizadores."}), 500

@admin_bp.route("/users/<int:user_id>/toggle_admin", methods=["POST"])
@login_required
@admin_required
def toggle_admin_status(user_id):
    """Alterna o estado de administrador de um utilizador (apenas para administradores)."""
    if user_id == session["user_id"]:
        return jsonify({"error": "Não pode alterar o seu próprio estado de administrador."}), 400
        
    user_to_modify = User.query.get(user_id)
    if not user_to_modify:
        return jsonify({"error": "Utilizador não encontrado."}), 404
    
    try:
        user_to_modify.is_admin = not user_to_modify.is_admin
        db.session.commit()
        current_app.logger.info(f"Estado de admin do utilizador {user_id} alterado para {user_to_modify.is_admin} pelo admin {session['user_id']}.")
        return jsonify({"message": f"Estado de administrador do utilizador {user_to_modify.username} atualizado com sucesso.", "user": user_to_modify.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao alternar estado de admin para o utilizador {user_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao atualizar o estado de administrador."}), 500

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@login_required
@admin_required
def delete_user_by_admin(user_id):
    """Elimina um utilizador (apenas para administradores)."""
    if user_id == session["user_id"]:
        return jsonify({"error": "Não pode eliminar a sua própria conta de administrador por esta via."}), 400

    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        return jsonify({"error": "Utilizador não encontrado."}), 404

    try:
        # Cascading deletes should handle related profile, plans, preferences if configured correctly in models
        db.session.delete(user_to_delete)
        db.session.commit()
        current_app.logger.info(f"Utilizador {user_id} ({user_to_delete.username}) eliminado pelo admin {session['user_id']}.")
        return jsonify({"message": f"Utilizador {user_to_delete.username} eliminado com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao eliminar o utilizador {user_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao eliminar o utilizador."}), 500

# Poderíamos adicionar mais rotas aqui para ver detalhes de um utilizador específico, etc.
@admin_bp.route("/users/<int:user_id>/details", methods=["GET"])
@login_required
@admin_required
def get_user_details_by_admin(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Utilizador não encontrado"}), 404
    
    profile = UserProfile.query.filter_by(user_id=user.id).first()
    diet_plans = DietPlan.query.filter_by(user_id=user.id).order_by(DietPlan.start_date.desc()).all()
    workout_plans = WorkoutPlan.query.filter_by(user_id=user.id).order_by(WorkoutPlan.start_date.desc()).all()
    
    user_data = user.to_dict()
    user_data["profile"] = profile.to_dict() if profile else None
    user_data["diet_plans_count"] = len(diet_plans)
    user_data["workout_plans_count"] = len(workout_plans)
    # Add more details as needed

    return jsonify(user_data), 200

