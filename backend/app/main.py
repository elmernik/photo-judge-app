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
from .graph import PhotoJudgeApp

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

# --- Helper Function ---
async def process_and_store_image(file: UploadFile, db: Session) -> schemas.Judgement:
    """Helper to process a single image, judge it, and store the result."""
    if not file.content_type.startswith("image/"):
        # This check is now per-file, useful for batch processing
        raise HTTPException(status_code=400, detail=f"File '{file.filename}' is not an image.")

    try:
        contents = await file.read()
        image_data = base64.b64encode(contents).decode("utf-8")

        # Judge the photo
        result_dict = await photo_judge_app.judge_photo(
            photo_filename=file.filename,
            image_data=image_data
        )

        # Save the physical image file with a unique name
        stored_filename = f"{uuid.uuid4()}{Path(file.filename).suffix}"
        file_path = IMAGE_DIR / stored_filename
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(contents)

        # Store the judgement in the database
        db_judgement = crud.create_judgement(
            db=db,
            judgement_data=result_dict,
            stored_filename=stored_filename
        )
        return db_judgement

    except Exception as e:
        # In a batch process, we might want to return an error object instead of raising
        # For simplicity here, we re-raise, which will stop the whole batch request.
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


@app.get("/", tags=["General"])
def read_root():
    """Welcome endpoint."""
    return {"message": "Welcome to the Photo Judge API V2"}