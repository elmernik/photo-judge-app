# app/schemas.py
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime

# --- Prompt Schemas ---
class PromptBase(BaseModel):
    name: str
    template: str
    description: Optional[str] = None

class PromptCreate(PromptBase):
    pass

class PromptUpdate(BaseModel):
    template: Optional[str] = None
    description: Optional[str] = None

class Prompt(PromptBase):
    id: int

    class Config:
        from_attributes = True

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

# --- Competition Schemas ---
class CompetitionBase(BaseModel):
    name: str
    description: Optional[str] = None
    rules: Optional[Dict[str, Any]] = None

class CompetitionCreate(CompetitionBase):
    pass

class Competition(CompetitionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Judgement Schemas ---
class JudgementBase(BaseModel):
    original_filename: str
    overall_score: float
    judgement_details: Dict[str, Any]

class JudgementCreate(JudgementBase):
    stored_filename: str
    competition_id: int

class Judgement(JudgementBase):
    id: int
    stored_filename: str
    created_at: datetime
    competition_id: int

    class Config:
        from_attributes = True