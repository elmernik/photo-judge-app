# app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from typing import List

def get_judgement(db: Session, judgement_id: int):
    return db.query(models.Judgement).filter(models.Judgement.id == judgement_id).first()

def get_judgements(db: Session, skip: int = 0, limit: int = 20):
    return db.query(models.Judgement).offset(skip).limit(limit).all()

def create_judgement(db: Session, judgement_data: dict, stored_filename: str) -> models.Judgement:
    db_judgement = models.Judgement(
        original_filename=judgement_data['filename'],
        stored_filename=stored_filename,
        overall_score=judgement_data['overall_score'],
        judgement_details=judgement_data # Store the full dictionary
    )
    db.add(db_judgement)
    db.commit()
    db.refresh(db_judgement)
    return db_judgement

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