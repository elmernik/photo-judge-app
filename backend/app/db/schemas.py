# app/db/schemas.py

from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel


# --- Prompt Schemas ---
class PromptType(str, Enum):
    EVALUATION_PROMPT = "EVALUATION_PROMPT"
    REASONING_PROMPT = "REASONING_PROMPT"
    RULES_SYNTHESIS_PROMPT = "RULES_SYNTHESIS_PROMPT"


class PromptBase(BaseModel):
    type: PromptType
    template: str
    description: Optional[str] = None
    enabled: bool = True


class PromptCreate(PromptBase):
    pass


class PromptUpdate(BaseModel):
    type: Optional[PromptType] = None
    template: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None


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
    rules: Optional[str] = None


class CompetitionCreate(CompetitionBase):
    pass


class CompetitionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[str] = None


class Competition(CompetitionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class GenerateGuidelinesRequest(BaseModel):
    competition_name: str


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