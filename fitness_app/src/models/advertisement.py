from src.extensions import db
from sqlalchemy.sql import func

class Advertisement(db.Model):
    __tablename__ = "advertisements"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=True)  # Could be HTML content, or description
    image_url = db.Column(db.String(500), nullable=True) # URL for the ad image
    target_url = db.Column(db.String(500), nullable=True) # URL to redirect on click
    placement_area = db.Column(db.String(100), nullable=False) # e.g., "sidebar", "banner_top", "footer_ad"
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    clicks = db.Column(db.Integer, default=0)
    views = db.Column(db.Integer, default=0) # If tracking views is needed
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True) # Admin who created it
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())

    creator = db.relationship("User") # Relationship to the User model

    def __repr__(self):
        return f"<Advertisement {self.id} - {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "image_url": self.image_url,
            "target_url": self.target_url,
            "placement_area": self.placement_area,
            "is_active": self.is_active,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "clicks": self.clicks,
            "views": self.views,
            "created_by_id": self.created_by_id,
            "creator_username": self.creator.username if self.creator else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

