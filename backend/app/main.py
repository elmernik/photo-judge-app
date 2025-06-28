# app/main.py
import base64
import uuid
import aiofiles
import asyncio
from pathlib import Path
from typing import List, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

# Local imports
from . import crud, models, schemas
from .database import SessionLocal, engine
from .graph import PhotoJudgeApp, JudgingCriterion

# Create all database tables
models.Base.metadata.create_all(bind=engine)

# --- App Setup ---
app = FastAPI(
    title="Nature Photography Competition Judge API",
    description="An API to judge nature photography, store results, and retrieve them.",
    version="2.0.0"
)

# --- CORS Middleware ---
origins = ["http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- App State and Dependencies ---
photo_judge_app = PhotoJudgeApp()
IMAGE_DIR = Path("uploaded_photos")
IMAGE_DIR.mkdir(exist_ok=True)

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Seed Default Criteria ---
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    if not crud.get_criteria(db):
        print("Seeding default criteria into the database...")
        default_criteria = [
            schemas.CriterionCreate(name='Composition', description='Evaluate the rule of thirds, framing, balance, and leading lines.', weight=1.0, enabled=True),
            schemas.CriterionCreate(name='Technical_Quality', description='Assess focus, exposure, sharpness, and noise levels.', weight=1.2, enabled=True),
            schemas.CriterionCreate(name='Creativity', description='Judge the unique perspective, artistic vision, and originality.', weight=0.9, enabled=True),
            schemas.CriterionCreate(name='Nature_Relevance', description='Consider the connection to nature, authenticity, and storytelling.', weight=1.1, enabled=True)
        ]
        for c in default_criteria:
            crud.create_criterion(db, c)
    db.close()

# --- Helper Function ---
async def process_and_store_image(file: UploadFile, db: Session) -> schemas.Judgement:
    """Helper to process a single image, judge it, and store the result."""
    if not file.content_type.startswith("image/"):
        # This check is now per-file, useful for batch processing
        raise HTTPException(status_code=400, detail=f"File '{file.filename}' is not an image.")

    try:
        # Fetch active criteria from the database for this run
        db_criteria = crud.get_enabled_criteria(db)
        if not db_criteria:
            raise HTTPException(status_code=400, detail="No enabled judging criteria found in the database.")

        # Convert SQLAlchemy models to JudgingCriterion dataclasses for the graph
        judging_criteria = [JudgingCriterion(name=c.name, description=c.description, weight=c.weight) for c in db_criteria]

        contents = await file.read()
        image_data = base64.b64encode(contents).decode("utf-8")

        result_dict = await photo_judge_app.judge_photo(
            photo_filename=file.filename,
            image_data=image_data,
            criteria=judging_criteria # Pass criteria to the judge
        )

        stored_filename = f"{uuid.uuid4()}{Path(file.filename).suffix}"
        file_path = IMAGE_DIR / stored_filename
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(contents)

        db_judgement = crud.create_judgement(
            db=db,
            judgement_data=result_dict,
            stored_filename=stored_filename
        )
        return db_judgement
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file {file.filename}: {str(e)}")


# --- API Endpoints ---
@app.post("/judge/", response_model=schemas.Judgement, tags=["Judging"])
async def judge_single_photo(
    file: UploadFile = File(...), db: Session = Depends(get_db)
):
    """
    Judges a single image, saves it, stores the grading in the database,
    and returns the complete judgement record.
    """
    return await process_and_store_image(file, db)


@app.post("/judge-batch/", response_model=List[schemas.Judgement], tags=["Judging"])
async def judge_multiple_photos(
    files: List[UploadFile] = File(...), db: Session = Depends(get_db)
):
    """
    Judges multiple images concurrently, saves them, stores the gradings,
    and returns a list of judgement records.
    """
    tasks = [process_and_store_image(file, db) for file in files]
    results = await asyncio.gather(*tasks)
    return results


@app.get("/judgements/", response_model=List[schemas.Judgement], tags=["Retrieval"])
def get_all_judgements(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """
    Retrieves a list of all stored judgements from the database.
    Supports pagination with `skip` and `limit`.
    """
    judgements = crud.get_judgements(db, skip=skip, limit=limit)
    return judgements


@app.get("/judgements/{judgement_id}", response_model=schemas.Judgement, tags=["Retrieval"])
def get_single_judgement(judgement_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a specific judgement by its unique ID.
    """
    db_judgement = crud.get_judgement(db, judgement_id=judgement_id)
    if db_judgement is None:
        raise HTTPException(status_code=404, detail="Judgement not found")
    return db_judgement


@app.get("/images/{filename}", tags=["Retrieval"])
async def get_image(filename: str):
    """
    Serves a stored image file. The frontend can use this endpoint
    to display the judged photos.
    """
    file_path = IMAGE_DIR / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)

# --- Criteria Endpoints ---
@app.get("/criteria/", response_model=List[schemas.Criterion], tags=["Criteria Management"])
def read_criteria(db: Session = Depends(get_db)):
    return crud.get_criteria(db)

@app.post("/criteria/", response_model=schemas.Criterion, tags=["Criteria Management"])
def create_new_criterion(criterion: schemas.CriterionCreate, db: Session = Depends(get_db)):
    return crud.create_criterion(db=db, criterion=criterion)

@app.put("/criteria/{criterion_id}", response_model=schemas.Criterion, tags=["Criteria Management"])
def update_existing_criterion(criterion_id: int, criterion: schemas.CriterionUpdate, db: Session = Depends(get_db)):
    db_criterion = crud.update_criterion(db, criterion_id, criterion)
    if db_criterion is None:
        raise HTTPException(status_code=404, detail="Criterion not found")
    return db_criterion

@app.delete("/criteria/{criterion_id}", response_model=schemas.Criterion, tags=["Criteria Management"])
def delete_existing_criterion(criterion_id: int, db: Session = Depends(get_db)):
    db_criterion = crud.delete_criterion(db, criterion_id)
    if db_criterion is None:
        raise HTTPException(status_code=404, detail="Criterion not found")
    return db_criterion

@app.get("/", tags=["General"])
def read_root():
    """Welcome endpoint."""
    return {"message": "Welcome to the Photo Judge API V2"}