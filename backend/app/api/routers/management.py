# app/api/routers/management.py

import asyncio
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse

from ...db import schemas
from ...api import deps
from ...services import guideline_service
from ...crud import crud

router = APIRouter()


# --- Competition Management ---
@router.post("/competitions/", response_model=schemas.Competition, tags=["Management"])
def create_competition(competition: schemas.CompetitionCreate, db: Session = Depends(deps.get_db)):
    return crud.create_competition(db, competition)


@router.get("/competitions/", response_model=List[schemas.Competition], tags=["Management"])
def read_competitions(skip: int = 0, limit: int = 10, db: Session = Depends(deps.get_db)):
    return crud.get_competitions(db, skip=skip, limit=limit)


@router.get("/competitions/{competition_id}/judgements", response_model=List[schemas.Judgement], tags=["Retrieval"])
def get_judgements_for_competition(competition_id: int, db: Session = Depends(deps.get_db)):
    """Get all judgements for a competition."""
    return crud.get_judgements_by_competition(db, competition_id)


@router.put("/competitions/{competition_id}", response_model=schemas.Competition, tags=["Management"])
def update_competition(
    competition_id: int,
    competition: schemas.CompetitionUpdate,
    db: Session = Depends(deps.get_db)
):
    updated = crud.update_competition(db, competition_id, competition)
    if not updated:
        raise HTTPException(status_code=404, detail="Competition not found")
    return updated


@router.delete("/competitions/{competition_id}", tags=["Management"])
def delete_competition(competition_id: int, db: Session = Depends(deps.get_db)):
    deleted = crud.delete_competition(db, competition_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Competition not found")
    return JSONResponse(
        content={"message": f"Competition '{deleted.name}' and all its data deleted successfully."}
    )

@router.post("/competitions/generate-guidelines", tags=["Management"])
async def generate_ai_guidelines(
    request: schemas.GenerateGuidelinesRequest, 
    db: Session = Depends(deps.get_db)
):
    """
    Generates competition guidelines by searching the web for past winners
    and synthesizing the results with an AI model.
    """
    if not request.competition_name:
        raise HTTPException(status_code=400, detail="Competition name cannot be empty.")
    
    # Delegate the complex logic to the service layer
    return await guideline_service.generate_guidelines_from_search(
        competition_name=request.competition_name, 
        db=db
    )


# --- Prompt Management ---
@router.get("/prompts/", response_model=List[schemas.Prompt], tags=["Management"])
def read_prompts(db: Session = Depends(deps.get_db)):
    """Get a list of all available prompts."""
    return crud.get_prompts(db)


@router.post("/prompts/", response_model=schemas.Prompt, tags=["Management"])
def create_prompt(prompt: schemas.PromptCreate, db: Session = Depends(deps.get_db)):
    """Create a new prompt. If 'enabled' is true, any other prompts of the same type will be disabled."""
    return crud.create_prompt(db=db, prompt=prompt)


@router.put("/prompts/{prompt_id}", response_model=schemas.Prompt, tags=["Management"])
def update_prompt(prompt_id: int, prompt: schemas.PromptUpdate, db: Session = Depends(deps.get_db)):
    """Update an existing prompt. If 'enabled' is true, any other prompts of the same type will be disabled."""
    updated = crud.update_prompt(db, prompt_id, prompt)
    if not updated:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return updated


@router.delete("/prompts/{prompt_id}", tags=["Management"])
def delete_prompt(prompt_id: int, db: Session = Depends(deps.get_db)):
    """Delete a prompt by its ID."""
    deleted_prompt = crud.delete_prompt(db, prompt_id)
    if not deleted_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return JSONResponse(content={"message": f"Prompt {prompt_id} deleted successfully."})


# --- Criteria Management ---
@router.get("/criteria/", response_model=List[schemas.Criterion], tags=["Criteria Management"])
def read_criteria(db: Session = Depends(deps.get_db)):
    return crud.get_criteria(db)


@router.post("/criteria/", response_model=schemas.Criterion, tags=["Criteria Management"])
def create_criterion(criterion: schemas.CriterionCreate, db: Session = Depends(deps.get_db)):
    return crud.create_criterion(db=db, criterion=criterion)


@router.put("/criteria/{criterion_id}", response_model=schemas.Criterion, tags=["Criteria Management"])
def update_criterion(criterion_id: int, criterion: schemas.CriterionUpdate, db: Session = Depends(deps.get_db)):
    updated = crud.update_criterion(db, criterion_id, criterion)
    if not updated:
        raise HTTPException(status_code=404, detail="Criterion not found")
    return updated


@router.delete("/criteria/{criterion_id}", response_model=schemas.Criterion, tags=["Criteria Management"])
def delete_criterion(criterion_id: int, db: Session = Depends(deps.get_db)):
    deleted = crud.delete_criterion(db, criterion_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Criterion not found")
    return deleted