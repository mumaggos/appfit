from src.extensions import db
from sqlalchemy.sql import func

class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(220), unique=True, nullable=False) # SEO-friendly URL
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False) # Store price as Numeric for precision
    stock_quantity = db.Column(db.Integer, default=0)
    sku = db.Column(db.String(100), unique=True, nullable=True) # Stock Keeping Unit
    image_url = db.Column(db.String(500), nullable=True)
    # Additional images could be a separate model or a JSONB field if using PostgreSQL
    # For SQLite, a simple comma-separated string or a related table is an option for multiple images.
    # For now, one main image_url.
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False) # To feature products on homepage, etc.
    
    category_id = db.Column(db.Integer, db.ForeignKey("product_categories.id"), nullable=False)
    # category = db.relationship("ProductCategory", backref="products") # Defined in ProductCategory

    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())

    # Potential future fields: weight, dimensions, brand_id, ratings, discount_price, etc.

    def __repr__(self):
        return f"<Product {self.name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "price": str(self.price), # Convert Decimal to string for JSON serialization
            "stock_quantity": self.stock_quantity,
            "sku": self.sku,
            "image_url": self.image_url,
            "is_active": self.is_active,
            "is_featured": self.is_featured,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

