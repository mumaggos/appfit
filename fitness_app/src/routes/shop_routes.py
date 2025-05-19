from flask import Blueprint, request, jsonify, current_app, session
from src.models import Product, ProductCategory
from src.extensions import db
from src.routes.admin import admin_required # For admin-only routes
from sqlalchemy.exc import IntegrityError
from slugify import slugify # Using python-slugify for generating slugs

# Blueprint for admin-only product and category management
admin_shop_bp = Blueprint("admin_shop", __name__, url_prefix="/api/admin/shop")

# Blueprint for public-facing product and category listing
public_shop_bp = Blueprint("public_shop", __name__, url_prefix="/api/shop")

# --- Product Category Management (Admin) ---
@admin_shop_bp.route("/categories", methods=["POST"])
@admin_required
def create_product_category():
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "O nome da categoria é obrigatório."}), 400

    name = data["name"]
    slug = slugify(name)
    if ProductCategory.query.filter_by(slug=slug).first():
        return jsonify({"error": f"Uma categoria com o slug 	{slug}	 já existe."}), 409 # Conflict

    new_category = ProductCategory(
        name=name,
        slug=slug,
        description=data.get("description")
    )
    try:
        db.session.add(new_category)
        db.session.commit()
        current_app.logger.info(f"Product category 	{new_category.id}	 (	{new_category.name}	) created by admin 	{session["user_id"]}	.")
        return jsonify(new_category.to_dict()), 201
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Integrity error creating category: {str(e)}", exc_info=True)
        if "UNIQUE constraint failed: product_categories.name" in str(e):
             return jsonify({"error": f"Uma categoria com o nome 	{name}	 já existe."}), 409
        if "UNIQUE constraint failed: product_categories.slug" in str(e):
             return jsonify({"error": f"Uma categoria com o slug gerado 	{slug}	 já existe. Tente um nome ligeiramente diferente."}), 409
        return jsonify({"error": "Erro de integridade ao criar a categoria."}), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating product category: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao criar a categoria."}), 500

@admin_shop_bp.route("/categories", methods=["GET"])
@admin_required
def list_product_categories_admin():
    try:
        categories = ProductCategory.query.order_by(ProductCategory.name).all()
        return jsonify([category.to_dict() for category in categories]), 200
    except Exception as e:
        current_app.logger.error(f"Error listing product categories for admin: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao listar as categorias."}), 500

@admin_shop_bp.route("/categories/<int:category_id>", methods=["PUT"])
@admin_required
def update_product_category(category_id):
    category = ProductCategory.query.get(category_id)
    if not category:
        return jsonify({"error": "Categoria não encontrada."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Nenhum dado fornecido para atualização."}), 400

    if "name" in data:
        new_name = data["name"]
        new_slug = slugify(new_name)
        if new_name != category.name and ProductCategory.query.filter_by(name=new_name).first():
            return jsonify({"error": f"Uma categoria com o nome 	{new_name}	 já existe."}), 409
        if new_slug != category.slug and ProductCategory.query.filter_by(slug=new_slug).first():
            return jsonify({"error": f"Uma categoria com o slug gerado 	{new_slug}	 já existe. Tente um nome ligeiramente diferente."}), 409
        category.name = new_name
        category.slug = new_slug
        
    category.description = data.get("description", category.description)

    try:
        db.session.commit()
        current_app.logger.info(f"Product category 	{category_id}	 updated by admin 	{session["user_id"]}	.")
        return jsonify(category.to_dict()), 200
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Integrity error updating category 	{category_id}	: {str(e)}", exc_info=True)
        return jsonify({"error": "Erro de integridade ao atualizar a categoria. Verifique se o novo nome ou slug já existe."}), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating product category 	{category_id}	: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao atualizar a categoria."}), 500

@admin_shop_bp.route("/categories/<int:category_id>", methods=["DELETE"])
@admin_required
def delete_product_category(category_id):
    category = ProductCategory.query.get(category_id)
    if not category:
        return jsonify({"error": "Categoria não encontrada."}), 404
    
    if category.products.count() > 0:
        return jsonify({"error": "Não pode eliminar categorias que contêm produtos. Reatribua ou elimine os produtos primeiro."}), 400

    try:
        db.session.delete(category)
        db.session.commit()
        current_app.logger.info(f"Product category 	{category_id}	 (	{category.name}	) deleted by admin 	{session["user_id"]}	.")
        return jsonify({"message": "Categoria eliminada com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting product category 	{category_id}	: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao eliminar a categoria."}), 500

# --- Product Management (Admin) ---
@admin_shop_bp.route("/products", methods=["POST"])
@admin_required
def create_product():
    data = request.get_json()
    required_fields = ["name", "price", "category_id"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Campos obrigatórios em falta (name, price, category_id)."}), 400

    name = data["name"]
    slug = slugify(name)
    if Product.query.filter_by(slug=slug).first():
        return jsonify({"error": f"Um produto com o slug 	{slug}	 já existe."}), 409

    if not ProductCategory.query.get(data["category_id"]):
        return jsonify({"error": "Categoria inválida."}), 400

    new_product = Product(
        name=name,
        slug=slug,
        description=data.get("description"),
        price=data["price"],
        stock_quantity=data.get("stock_quantity", 0),
        sku=data.get("sku"),
        image_url=data.get("image_url"),
        is_active=data.get("is_active", True),
        is_featured=data.get("is_featured", False),
        category_id=data["category_id"]
    )
    try:
        db.session.add(new_product)
        db.session.commit()
        current_app.logger.info(f"Product 	{new_product.id}	 (	{new_product.name}	) created by admin 	{session["user_id"]}	.")
        return jsonify(new_product.to_dict()), 201
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Integrity error creating product: {str(e)}", exc_info=True)
        if "UNIQUE constraint failed: products.slug" in str(e):
            return jsonify({"error": f"Um produto com o slug gerado 	{slug}	 já existe. Tente um nome ligeiramente diferente."}), 409
        if "UNIQUE constraint failed: products.sku" in str(e) and data.get("sku"):
            return jsonify({"error": f"Um produto com o SKU 	{data.get('sku')}	 já existe."}), 409
        return jsonify({"error": "Erro de integridade ao criar o produto."}), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating product: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao criar o produto."}), 500

@admin_shop_bp.route("/products", methods=["GET"])
@admin_required
def list_products_admin():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        products_pagination = Product.query.order_by(Product.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        products_data = [product.to_dict() for product in products_pagination.items]
        return jsonify({
            "products": products_data,
            "total_products": products_pagination.total,
            "current_page": products_pagination.page,
            "total_pages": products_pagination.pages
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error listing products for admin: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao listar os produtos."}), 500

@admin_shop_bp.route("/products/<int:product_id>", methods=["PUT"])
@admin_required
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Produto não encontrado."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Nenhum dado fornecido para atualização."}), 400

    if "name" in data:
        new_name = data["name"]
        new_slug = slugify(new_name)
        if new_name != product.name and Product.query.filter_by(name=new_name).first(): # Check name uniqueness if changed
             return jsonify({"error": f"Um produto com o nome 	{new_name}	 já existe."}), 409
        if new_slug != product.slug and Product.query.filter_by(slug=new_slug).first():
            return jsonify({"error": f"Um produto com o slug gerado 	{new_slug}	 já existe. Tente um nome ligeiramente diferente."}), 409
        product.name = new_name
        product.slug = new_slug

    if "sku" in data and data["sku"] != product.sku:
        if Product.query.filter_by(sku=data["sku"]).first():
            return jsonify({"error": f"Um produto com o SKU 	{data['sku']}	 já existe."}), 409
        product.sku = data["sku"]

    if "category_id" in data and not ProductCategory.query.get(data["category_id"]):
        return jsonify({"error": "Categoria inválida."}), 400
    
    product.description = data.get("description", product.description)
    product.price = data.get("price", product.price)
    product.stock_quantity = data.get("stock_quantity", product.stock_quantity)
    product.image_url = data.get("image_url", product.image_url)
    product.is_active = data.get("is_active", product.is_active)
    product.is_featured = data.get("is_featured", product.is_featured)
    product.category_id = data.get("category_id", product.category_id)

    try:
        db.session.commit()
        current_app.logger.info(f"Product 	{product_id}	 updated by admin 	{session["user_id"]}	.")
        return jsonify(product.to_dict()), 200
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Integrity error updating product 	{product_id}	: {str(e)}", exc_info=True)
        return jsonify({"error": "Erro de integridade ao atualizar o produto. Verifique se o novo nome, slug ou SKU já existe."}), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating product 	{product_id}	: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao atualizar o produto."}), 500

@admin_shop_bp.route("/products/<int:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Produto não encontrado."}), 404

    try:
        db.session.delete(product)
        db.session.commit()
        current_app.logger.info(f"Product 	{product_id}	 (	{product.name}	) deleted by admin 	{session["user_id"]}	.")
        return jsonify({"message": "Produto eliminado com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting product 	{product_id}	: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao eliminar o produto."}), 500

# --- Public Shop Routes ---
@public_shop_bp.route("/categories", methods=["GET"])
def list_public_product_categories():
    try:
        categories = ProductCategory.query.order_by(ProductCategory.name).all()
        # Only return categories that have active products, or all categories if desired
        # For now, returning all categories. Could be filtered.
        return jsonify([category.to_dict() for category in categories]), 200
    except Exception as e:
        current_app.logger.error(f"Error listing public categories: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao carregar as categorias."}), 500

@public_shop_bp.route("/products", methods=["GET"])
def list_public_products():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 12, type=int)
        category_slug = request.args.get("category", None, type=str)
        featured = request.args.get("featured", None, type=bool)

        query = Product.query.filter_by(is_active=True)

        if category_slug:
            category = ProductCategory.query.filter_by(slug=category_slug).first()
            if category:
                query = query.filter_by(category_id=category.id)
            else:
                return jsonify({"products": [], "total_products": 0, "message": "Categoria não encontrada."}), 200 # Or 404
        
        if featured is not None:
            query = query.filter_by(is_featured=featured)

        products_pagination = query.order_by(Product.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        products_data = [product.to_dict() for product in products_pagination.items]
        
        return jsonify({
            "products": products_data,
            "total_products": products_pagination.total,
            "current_page": products_pagination.page,
            "total_pages": products_pagination.pages
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error listing public products: {str(e)}", exc_info=True)
        return jsonify({"error": "Ocorreu um erro ao carregar os produtos."}), 500

@public_shop_bp.route("/products/<string:slug>", methods=["GET"])
def get_public_product_by_slug(slug):
    product = Product.query.filter_by(slug=slug, is_active=True).first()
    if not product:
        return jsonify({"error": "Produto não encontrado ou indisponível."}), 404
    return jsonify(product.to_dict()), 200

