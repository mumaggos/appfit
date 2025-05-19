from flask import Blueprint, request, jsonify, session, current_app
from src.models import Advertisement, User # Import Advertisement model
from src.extensions import db
from src.routes.admin import admin_required # Reuse admin_required decorator
from datetime import datetime

ads_bp = Blueprint("advertisements", __name__, url_prefix="/api/admin/advertisements")
public_ads_bp = Blueprint("public_advertisements", __name__, url_prefix="/api/advertisements")

@ads_bp.route("/", methods=["POST"])
@admin_required
def create_advertisement():
    data = request.get_json()
    required_fields = ["title", "placement_area"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Campos obrigatórios em falta (title, placement_area)."}), 400

    new_ad = Advertisement(
        title=data["title"],
        content=data.get("content"),
        image_url=data.get("image_url"),
        target_url=data.get("target_url"),
        placement_area=data["placement_area"],
        is_active=data.get("is_active", True),
        start_date=datetime.fromisoformat(data["start_date"]) if data.get("start_date") else None,
        end_date=datetime.fromisoformat(data["end_date"]) if data.get("end_date") else None,
        created_by_id=session["user_id"]
    )
    try:
        db.session.add(new_ad)
        db.session.commit()
        current_app.logger.info(f"Advertisement 	{new_ad.id}	 created by admin 	{session['user_id']}	.")
        return jsonify(new_ad.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating advertisement: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao criar o anúncio."}), 500

@ads_bp.route("/", methods=["GET"])
@admin_required
def list_advertisements():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        ads_pagination = Advertisement.query.order_by(Advertisement.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        ads_data = [ad.to_dict() for ad in ads_pagination.items]
        return jsonify({
            "advertisements": ads_data,
            "total_advertisements": ads_pagination.total,
            "current_page": ads_pagination.page,
            "total_pages": ads_pagination.pages
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error listing advertisements: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao listar os anúncios."}), 500

@ads_bp.route("/<int:ad_id>", methods=["GET"])
@admin_required
def get_advertisement(ad_id):
    ad = Advertisement.query.get(ad_id)
    if not ad:
        return jsonify({"error": "Anúncio não encontrado."}), 404
    return jsonify(ad.to_dict()), 200

@ads_bp.route("/<int:ad_id>", methods=["PUT"])
@admin_required
def update_advertisement(ad_id):
    ad = Advertisement.query.get(ad_id)
    if not ad:
        return jsonify({"error": "Anúncio não encontrado."}), 404
    
    data = request.get_json()
    ad.title = data.get("title", ad.title)
    ad.content = data.get("content", ad.content)
    ad.image_url = data.get("image_url", ad.image_url)
    ad.target_url = data.get("target_url", ad.target_url)
    ad.placement_area = data.get("placement_area", ad.placement_area)
    ad.is_active = data.get("is_active", ad.is_active)
    ad.start_date = datetime.fromisoformat(data["start_date"]) if data.get("start_date") else ad.start_date
    ad.end_date = datetime.fromisoformat(data["end_date"]) if data.get("end_date") else ad.end_date
    
    try:
        db.session.commit()
        current_app.logger.info(f"Advertisement 	{ad_id}	 updated by admin 	{session['user_id']}	.")
        return jsonify(ad.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating advertisement 	{ad_id}	: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao atualizar o anúncio."}), 500

@ads_bp.route("/<int:ad_id>", methods=["DELETE"])
@admin_required
def delete_advertisement(ad_id):
    ad = Advertisement.query.get(ad_id)
    if not ad:
        return jsonify({"error": "Anúncio não encontrado."}), 404
    
    try:
        db.session.delete(ad)
        db.session.commit()
        current_app.logger.info(f"Advertisement 	{ad_id}	 deleted by admin 	{session['user_id']}	.")
        return jsonify({"message": "Anúncio eliminado com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting advertisement 	{ad_id}	: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao eliminar o anúncio."}), 500

# --- Public Routes for Advertisements ---
@public_ads_bp.route("/<string:placement_area>", methods=["GET"])
def get_active_ads_by_placement(placement_area):
    try:
        now = datetime.utcnow()
        ads = Advertisement.query.filter(
            Advertisement.placement_area == placement_area,
            Advertisement.is_active == True,
            (Advertisement.start_date == None) | (Advertisement.start_date <= now),
            (Advertisement.end_date == None) | (Advertisement.end_date >= now)
        ).order_by(func.random()).limit(5).all() # Get up to 5 random active ads for the placement
        
        ads_data = [ad.to_dict() for ad in ads]
        # Increment views count (basic implementation)
        for ad_obj in ads:
            ad_obj.views = (ad_obj.views or 0) + 1
        db.session.commit()

        return jsonify(ads_data), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching public ads for placement {placement_area}: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao carregar anúncios."}), 500

@public_ads_bp.route("/<int:ad_id>/click", methods=["POST"])
def track_ad_click(ad_id):
    ad = Advertisement.query.get(ad_id)
    if not ad:
        return jsonify({"error": "Anúncio não encontrado."}), 404
    
    try:
        ad.clicks = (ad.clicks or 0) + 1
        db.session.commit()
        current_app.logger.info(f"Ad 	{ad_id}	 clicked. Target: {ad.target_url}")
        return jsonify({"message": "Click registado.", "target_url": ad.target_url}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error tracking click for ad 	{ad_id}	: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao registar o click."}), 500

