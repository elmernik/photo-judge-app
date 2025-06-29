# app/api/routers/judging.py

import asyncio
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse

from ...db import schemas
from ...api import deps
from ...services import judging_service
from ...crud import crud

router = APIRouter()


@router.post("/judge/", response_model=schemas.Judgement, tags=["Judging"])
async def judge_single_photo(
    file: UploadFile = File(...),
    competition_id: int = Form(...),
    db: Session = Depends(deps.get_db)
):
    """Judge and store a single photo."""
    return await judging_service.process_and_store_image(file, competition_id, db)


@router.post("/judge-batch/", response_model=List[schemas.Judgement], tags=["Judging"])
async def judge_multiple_photos(
    files: List[UploadFile] = File(...),
    competition_id: int = Form(...),
    db: Session = Depends(deps.get_db)
):
    """Judge and store multiple photos concurrently."""
    tasks = [judging_service.process_and_store_image(f, competition_id, db) for f in files]
    return await asyncio.gather(*tasks)


@router.get("/judgements/", response_model=List[schemas.Judgement], tags=["Retrieval"])
def get_all_judgements(skip: int = 0, limit: int = 20, db: Session = Depends(deps.get_db)):
    """Retrieve all judgements (paginated)."""
    return crud.get_judgements(db, skip=skip, limit=limit)


@router.get("/judgements/{judgement_id}", response_model=schemas.Judgement, tags=["Retrieval"])
def get_single_judgement(judgement_id: int, db: Session = Depends(deps.get_db)):
    """Retrieve a specific judgement by ID."""
    judgement = crud.get_judgement(db, judgement_id)
    if not judgement:
        raise HTTPException(status_code=404, detail="Judgement not found")
    return judgement


@router.delete("/judgements/{judgement_id}", tags=["Judging"])
def delete_judgement(judgement_id: int, db: Session = Depends(deps.get_db)):
    """Delete a judgement and its associated image."""
    result = crud.delete_judgement(db, judgement_id)
    if not result:
        raise HTTPException(status_code=404, detail="Judgement not found")
    return JSONResponse(content={"message": f"Judgement {judgement_id} deleted successfully."})