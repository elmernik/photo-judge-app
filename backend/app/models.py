# app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from .database import Base

class Judgement(Base):
    __tablename__ = "judgements"

    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String, index=True)
    stored_filename = Column(String, unique=True)
    overall_score = Column(Float, index=True)
    judgement_details = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# New Model for Judging Criteria
class Criterion(Base):
    __tablename__ = "criteria"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=False) # This is the prompt for the AI
    weight = Column(Float, default=1.0)
    enabled = Column(Boolean, default=True)