# app/db/models.py

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, JSON, Boolean,
    ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Competition(Base):
    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(String)
    rules = Column(String)  # Used for reasoning prompt
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    judgements = relationship("Judgement", back_populates="competition")


class Judgement(Base):
    __tablename__ = "judgements"

    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String, index=True)
    stored_filename = Column(String, unique=True)
    overall_score = Column(Float, index=True)
    judgement_details = Column(JSON) # Stores entire Photo state JSON expect image data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    competition_id = Column(Integer, ForeignKey("competitions.id"))
    competition = relationship("Competition", back_populates="judgements")


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False, index=True)  # e.g., 'EVALUATION_PROMPT' or 'REASONING_PROMPT'
    enabled = Column(Boolean, default=True) # To enable/disable the prompt
    template = Column(Text, nullable=False)  # Contains placeholders like {criterion_name}
    description = Column(String)  # Optional description


class Criterion(Base):
    __tablename__ = "criteria"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(String, nullable=False)  # Explains the judging criterion
    weight = Column(Float, default=1.0)
    enabled = Column(Boolean, default=True)