# app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Competition(Base):
    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False, unique=True)
    description = Column(String)
    # The 'rules' can still be useful for the reasoning prompt, so we keep it.
    rules = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    judgements = relationship("Judgement", back_populates="competition")

class Judgement(Base):
    __tablename__ = "judgements"

    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String, index=True)
    stored_filename = Column(String, unique=True)
    overall_score = Column(Float, index=True)
    judgement_details = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    competition_id = Column(Integer, ForeignKey("competitions.id"))
    competition = relationship("Competition", back_populates="judgements")

# New Model for Prompts
class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    # A unique name to identify the prompt, e.g., 'EVALUATION_PROMPT'
    name = Column(String, unique=True, index=True, nullable=False)
    # The prompt template text itself, with placeholders like {criterion_name}
    template = Column(Text, nullable=False)
    description = Column(String) # Optional description of what the prompt is for

# The Criterion model is now standalone again
class Criterion(Base):
    __tablename__ = "criteria"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=False) # Description of the criterion itself
    weight = Column(Float, default=1.0)
    enabled = Column(Boolean, default=True)