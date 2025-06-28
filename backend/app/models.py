# app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from .database import Base

class Judgement(Base):
    __tablename__ = "judgements"

    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String, index=True)
    stored_filename = Column(String, unique=True)
    overall_score = Column(Float, index=True)
    judgement_details = Column(JSON) # Stores scores, rationales, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())