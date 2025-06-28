# app/schemas.py
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

# Base schema for a judgement's details
class JudgementBase(BaseModel):
    original_filename: str
    overall_score: float
    judgement_details: Dict[str, Any]

# Schema for creating a new judgement in the DB
class JudgementCreate(JudgementBase):
    stored_filename: str

# Schema for reading a judgement from the DB (will be returned by the API)
class Judgement(JudgementBase):
    id: int
    stored_filename: str
    created_at: datetime

    class Config:
        from_attributes = True # Replaces orm_mode=True in Pydantic v2

# --- Criterion Schemas ---
class CriterionBase(BaseModel):
    name: str
    description: str
    weight: float = 1.0
    enabled: bool = True

class CriterionCreate(CriterionBase):
    pass

class CriterionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    weight: Optional[float] = None
    enabled: Optional[bool] = None

class Criterion(CriterionBase):
    id: int

    class Config:
        from_attributes = True