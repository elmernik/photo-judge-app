# app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas

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