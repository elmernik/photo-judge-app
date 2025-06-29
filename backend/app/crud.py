# app/crud.py

import os
from pathlib import Path
from typing import List

from sqlalchemy.orm import Session

from . import models, schemas

IMAGE_DIR = Path("uploaded_photos")


# --- Judgement CRUD ---

def get_judgement(db: Session, judgement_id: int) -> models.Judgement:
    """Retrieve a single judgement by ID."""
    return db.query(models.Judgement).filter(models.Judgement.id == judgement_id).first()


def get_judgements(db: Session, skip: int = 0, limit: int = 20) -> List[models.Judgement]:
    """Retrieve a list of judgements with pagination."""
    return db.query(models.Judgement).offset(skip).limit(limit).all()


def get_judgements_by_competition(db: Session, competition_id: int, skip: int = 0, limit: int = 100) -> List[models.Judgement]:
    """Retrieve judgements associated with a specific competition."""
    return db.query(models.Judgement).filter(
        models.Judgement.competition_id == competition_id
    ).offset(skip).limit(limit).all()


def create_judgement(db: Session, judgement_data: dict, stored_filename: str, competition_id: int) -> models.Judgement:
    """Create a new judgement record."""
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


def delete_judgement(db: Session, judgement_id: int) -> models.Judgement:
    """Delete a judgement and its associated image file."""
    db_judgement = get_judgement(db, judgement_id=judgement_id)
    if db_judgement:
        image_path = IMAGE_DIR / db_judgement.stored_filename
        if os.path.exists(image_path):
            os.remove(image_path)
        db.delete(db_judgement)
        db.commit()
    return db_judgement


# --- Competition CRUD ---

def get_competition(db: Session, competition_id: int) -> models.Competition:
    """Retrieve a single competition by ID."""
    return db.query(models.Competition).filter(models.Competition.id == competition_id).first()


def get_competitions(db: Session, skip: int = 0, limit: int = 20) -> List[models.Competition]:
    """Retrieve a list of competitions with pagination."""
    return db.query(models.Competition).offset(skip).limit(limit).all()


def create_competition(db: Session, competition: schemas.CompetitionCreate) -> models.Competition:
    """Create a new competition."""
    db_competition = models.Competition(**competition.model_dump())
    db.add(db_competition)
    db.commit()
    db.refresh(db_competition)
    return db_competition


def delete_competition(db: Session, competition_id: int) -> models.Competition:
    """Delete a competition and all associated judgements and image files."""
    db_competition = get_competition(db, competition_id=competition_id)
    if db_competition:
        judgements_to_delete = db.query(models.Judgement).filter(
            models.Judgement.competition_id == competition_id
        ).all()

        for judgement in judgements_to_delete:
            if judgement.stored_filename:
                image_path = IMAGE_DIR / judgement.stored_filename
                if os.path.exists(image_path):
                    try:
                        os.remove(image_path)
                    except OSError as e:
                        print(f"Error deleting file {image_path}: {e}")

        for judgement in judgements_to_delete:
            db.delete(judgement)

        db.delete(db_competition)
        db.commit()
    return db_competition


def update_competition(db: Session, competition_id: int, competition_update: schemas.CompetitionUpdate) -> models.Competition:
    """Update the details of a competition."""
    db_competition = get_competition(db, competition_id=competition_id)
    if db_competition:
        update_data = competition_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_competition, key, value)
        db.commit()
        db.refresh(db_competition)
    return db_competition


# --- Criterion CRUD ---

def get_criterion(db: Session, criterion_id: int) -> models.Criterion:
    """Retrieve a single criterion by ID."""
    return db.query(models.Criterion).filter(models.Criterion.id == criterion_id).first()


def get_criteria(db: Session) -> List[models.Criterion]:
    """Retrieve all criteria."""
    return db.query(models.Criterion).all()


def get_enabled_criteria(db: Session) -> List[models.Criterion]:
    """Retrieve only enabled criteria."""
    return db.query(models.Criterion).filter(models.Criterion.enabled.is_(True)).all()


def create_criterion(db: Session, criterion: schemas.CriterionCreate) -> models.Criterion:
    """Create a new criterion."""
    db_criterion = models.Criterion(**criterion.model_dump())
    db.add(db_criterion)
    db.commit()
    db.refresh(db_criterion)
    return db_criterion


def update_criterion(db: Session, criterion_id: int, criterion_update: schemas.CriterionUpdate) -> models.Criterion:
    """Update an existing criterion."""
    db_criterion = get_criterion(db, criterion_id)
    if db_criterion:
        update_data = criterion_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_criterion, key, value)
        db.commit()
        db.refresh(db_criterion)
    return db_criterion


def delete_criterion(db: Session, criterion_id: int) -> models.Criterion:
    """Delete a criterion."""
    db_criterion = get_criterion(db, criterion_id)
    if db_criterion:
        db.delete(db_criterion)
        db.commit()
    return db_criterion


# --- Prompt CRUD ---

def get_enabled_prompt_by_type(db: Session, prompt_type: schemas.PromptType) -> models.Prompt | None:
    """Gets the single enabled prompt for a given type."""
    return db.query(models.Prompt).filter(
        models.Prompt.type == prompt_type,
        models.Prompt.enabled == True
    ).first()


def get_prompts_by_type(db: Session, prompt_type: schemas.PromptType) -> List[models.Prompt]:
    """Gets all prompts of a specific type, regardless of enabled status."""
    return db.query(models.Prompt).filter(models.Prompt.type == prompt_type).all()


def get_prompts(db: Session) -> List[models.Prompt]:
    "Gets all prompts."
    return db.query(models.Prompt).all()


def create_prompt(db: Session, prompt: schemas.PromptCreate) -> models.Prompt:
    """
    Creates a new prompt.
    If the new prompt is enabled, it disables other prompts of the same type.
    """
    # If the new prompt is set to be enabled, disable others of the same type first.
    if prompt.enabled:
        db.query(models.Prompt).filter(
            models.Prompt.type == prompt.type,
            models.Prompt.enabled == True
        ).update({"enabled": False})

    db_prompt = models.Prompt(**prompt.dict())
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

def update_prompt(db: Session, prompt_id: int, prompt_data: schemas.PromptUpdate) -> models.Prompt | None:
    "Updates a prompt and handles enabled status."
    db_prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()
    if not db_prompt:
        return None

    # If this prompt is being enabled, disable others of the same type
    if prompt_data.enabled:
        prompt_type_to_update = db_prompt.type
        if prompt_data.type:
             prompt_type_to_update = prompt_data.type
        
        db.query(models.Prompt).filter(
            models.Prompt.type == prompt_type_to_update,
            models.Prompt.id != prompt_id
        ).update({"enabled": False})

    update_data = prompt_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prompt, key, value)

    db.commit()
    db.refresh(db_prompt)
    return db_prompt

def delete_prompt(db: Session, prompt_id: int) -> models.Prompt | None:
    """Deletes a prompt from the database by its ID."""
    db_prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()
    if db_prompt:
        db.delete(db_prompt)
        db.commit()
    return db_prompt