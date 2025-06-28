# app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from typing import List
import os
from pathlib import Path

IMAGE_DIR = Path("uploaded_photos")

def get_judgement(db: Session, judgement_id: int):
    return db.query(models.Judgement).filter(models.Judgement.id == judgement_id).first()

def get_judgements(db: Session, skip: int = 0, limit: int = 20):
    return db.query(models.Judgement).offset(skip).limit(limit).all()

def get_judgements_by_competition(db: Session, competition_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Judgement).filter(models.Judgement.competition_id == competition_id).offset(skip).limit(limit).all()

def create_judgement(db: Session, judgement_data: dict, stored_filename: str, competition_id: int) -> models.Judgement:
    db_judgement = models.Judgement(
        original_filename=judgement_data['filename'],
        stored_filename=stored_filename,
        overall_score=judgement_data['overall_score'],
        judgement_details=judgement_data,
        competition_id=competition_id
    )
    db.add(db_judgement)
    db.commit()
    db.refresh(db_judgement)
    return db_judgement

def delete_judgement(db: Session, judgement_id: int):
    """
    Deletes a judgement and its associated image file.
    """
    db_judgement = get_judgement(db, judgement_id=judgement_id)
    if db_judgement:
        # Construct the full path to the image file
        image_path = IMAGE_DIR / db_judgement.stored_filename

        # Delete the image file from the filesystem if it exists
        if os.path.exists(image_path):
            os.remove(image_path)
            
        # Delete the judgement record from the database
        db.delete(db_judgement)
        db.commit()
    return db_judgement

# --- Competition CRUD ---
def get_competition(db: Session, competition_id: int):
    return db.query(models.Competition).filter(models.Competition.id == competition_id).first()

def get_competitions(db: Session, skip: int = 0, limit: int = 20):
    return db.query(models.Competition).offset(skip).limit(limit).all()

def create_competition(db: Session, competition: schemas.CompetitionCreate) -> models.Competition:
    db_competition = models.Competition(**competition.model_dump())
    db.add(db_competition)
    db.commit()
    db.refresh(db_competition)
    return db_competition

# --- Criterion CRUD ---
def get_criterion(db: Session, criterion_id: int):
    return db.query(models.Criterion).filter(models.Criterion.id == criterion_id).first()

def get_criteria(db: Session) -> List[models.Criterion]:
    return db.query(models.Criterion).all()

def get_enabled_criteria(db: Session) -> List[models.Criterion]:
    return db.query(models.Criterion).filter(models.Criterion.enabled == True).all()

def create_criterion(db: Session, criterion: schemas.CriterionCreate) -> models.Criterion:
    db_criterion = models.Criterion(**criterion.model_dump())
    db.add(db_criterion)
    db.commit()
    db.refresh(db_criterion)
    return db_criterion

def update_criterion(db: Session, criterion_id: int, criterion_update: schemas.CriterionUpdate) -> models.Criterion:
    db_criterion = get_criterion(db, criterion_id)
    if db_criterion:
        update_data = criterion_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_criterion, key, value)
        db.commit()
        db.refresh(db_criterion)
    return db_criterion

def delete_criterion(db: Session, criterion_id: int):
    db_criterion = get_criterion(db, criterion_id)
    if db_criterion:
        db.delete(db_criterion)
        db.commit()
    return db_criterion

# --- Prompt CRUD ---
def get_prompt_by_name(db: Session, name: str) -> models.Prompt:
    return db.query(models.Prompt).filter(models.Prompt.name == name).first()

def get_prompts(db: Session) -> List[models.Prompt]:
    return db.query(models.Prompt).all()

def create_prompt(db: Session, prompt: schemas.PromptCreate) -> models.Prompt:
    db_prompt = models.Prompt(**prompt.model_dump())
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

def update_prompt(db: Session, prompt_id: int, prompt_update: schemas.PromptUpdate) -> models.Prompt:
    db_prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()
    if db_prompt:
        update_data = prompt_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_prompt, key, value)
        db.commit()
        db.refresh(db_prompt)
    return db_prompt