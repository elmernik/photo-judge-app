# app/main.py
import base64
import uuid
import aiofiles
import asyncio
from pathlib import Path
from typing import List, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
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

# --- Seed Default Criteria and prompts if they don't exist ---
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

    if not crud.get_prompt_by_name(db, "EVALUATION_PROMPT"):
        print("Seeding EVALUATION_PROMPT...")
        crud.create_prompt(db, schemas.PromptCreate(
                            name="EVALUATION_PROMPT",
                            template="""You are an expert photography judge. Evaluate this photograph for {criterion_name}.

                                        {criterion_description}

                                        Provide:
                                        1. A score from 0.0 to 10.0
                                        2. A brief rationale (2-3 sentences)

                                        Format your response as:
                                        SCORE: [number]
                                        RATIONALE: [explanation]""",
                                                    description="The prompt used for evaluating a single criterion."
                                                ))
    if not crud.get_prompt_by_name(db, "REASONING_PROMPT"):
        print("Seeding REASONING_PROMPT...")
        crud.create_prompt(db, schemas.PromptCreate(
                            name="REASONING_PROMPT",
                            template="""You are the head judge of a photography competition. You have received feedback from your panel of judges on a photograph. Your task is to synthesize this feedback into a final, coherent summary for the photographer.

                                        The photograph received an overall score of {overall_score}/10.
                                        The competition rules emphasize: {rules}

                                        Here is the detailed feedback from the panel:
                                        {feedback_summary}

                                        Based on all of this, please provide a final summary. Explain what is good about the photo, how it could be improved, and how well it fits the competition's specific rules. Address the photographer directly in a helpful and encouraging tone.""",
                                                    description="The prompt for generating the final overall reasoning."
                                                ))
    db.close()

# --- Helper Function ---
async def process_and_store_image(file: UploadFile, competition_id: int, db: Session) -> schemas.Judgement:
    competition = crud.get_competition(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    # Fetch global enabled criteria
    db_criteria = crud.get_enabled_criteria(db)
    if not db_criteria:
        raise HTTPException(status_code=400, detail="No enabled judging criteria found.")
    
    # Fetch prompt templates
    eval_prompt = crud.get_prompt_by_name(db, "EVALUATION_PROMPT")
    reasoning_prompt = crud.get_prompt_by_name(db, "REASONING_PROMPT")
    if not eval_prompt or not reasoning_prompt:
        raise HTTPException(status_code=500, detail="Core prompt templates not found in DB.")

    judging_criteria = [JudgingCriterion(name=c.name, description=c.description, weight=c.weight) for c in db_criteria]
    
    contents = await file.read()
    image_data = base64.b64encode(contents).decode("utf-8")

    result_dict = await photo_judge_app.judge_photo(
        photo_filename=file.filename,
        image_data=image_data,
        criteria=judging_criteria,
        competition_rules=competition.rules,
        evaluation_prompt_template=eval_prompt.template,
        reasoning_prompt_template=reasoning_prompt.template
    )

    stored_filename = f"{uuid.uuid4()}{Path(file.filename).suffix}"
    async with aiofiles.open(IMAGE_DIR / stored_filename, "wb") as out_file:
        await out_file.write(contents)

    return crud.create_judgement(db, result_dict, stored_filename, competition_id)


# --- API Endpoints ---
@app.post("/judge/", response_model=schemas.Judgement, tags=["Judging"])
async def judge_single_photo(
    file: UploadFile = File(...),
    competition_id: int = Form(...), # <-- Add this
    db: Session = Depends(get_db)
):
    """
    Judges a single image for a specific competition, saves it, 
    stores the grading in the database, and returns the complete judgement record.
    """
    # Pass all three required arguments
    return await process_and_store_image(file, competition_id, db)


@app.post("/judge-batch/", response_model=List[schemas.Judgement], tags=["Judging"])
async def judge_multiple_photos(
    files: List[UploadFile] = File(...),
    competition_id: int = Form(...), # <-- Add this
    db: Session = Depends(get_db)
):
    """
    Judges multiple images concurrently for a specific competition, saves them, 
    stores the gradings, and returns a list of judgement records.
    """
    # Pass all three required arguments to the helper function for each file
    tasks = [process_and_store_image(file, competition_id, db) for file in files]
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

@app.delete("/judgements/{judgement_id}", tags=["Judging"])
def delete_single_judgement(judgement_id: int, db: Session = Depends(get_db)):
    """
    Deletes a specific judgement and its associated image file.
    """
    db_judgement = crud.delete_judgement(db, judgement_id=judgement_id)
    if db_judgement is None:
        raise HTTPException(status_code=404, detail="Judgement not found")
    return JSONResponse(
        status_code=200,
        content={"message": f"Judgement {judgement_id} deleted successfully."}
    )

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

@app.get("/competitions/{competition_id}/judgements", response_model=List[schemas.Judgement], tags=["Retrieval"])
def get_judgements_for_competition(competition_id: int, db: Session = Depends(get_db)):
    return crud.get_judgements_by_competition(db, competition_id=competition_id)

# --- Management Endpoints ---
@app.post("/competitions/", response_model=schemas.Competition, tags=["Management"])
def create_competition(competition: schemas.CompetitionCreate, db: Session = Depends(get_db)):
    return crud.create_competition(db, competition)

@app.get("/competitions/", response_model=List[schemas.Competition], tags=["Management"])
def read_competitions(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_competitions(db, skip=skip, limit=limit)

@app.delete("/competitions/{competition_id}", tags=["Management"])
def delete_competition_endpoint(competition_id: int, db: Session = Depends(get_db)):
    """
    Deletes a competition and all of its associated data, including judgements
    and stored images.
    """
    deleted_comp = crud.delete_competition(db, competition_id=competition_id)
    if deleted_comp is None:
        raise HTTPException(status_code=404, detail="Competition not found")
    return JSONResponse(
        status_code=200,
        content={"message": f"Competition '{deleted_comp.name}' and all its data deleted successfully."}
    )

@app.put("/competitions/{competition_id}", response_model=schemas.Competition, tags=["Management"])
def update_competition(
    competition_id: int, 
    competition: schemas.CompetitionUpdate, 
    db: Session = Depends(get_db)
):
    """
    Updates the details of an existing competition.
    """
    updated_competition = crud.update_competition(
        db, 
        competition_id=competition_id, 
        competition_update=competition
    )
    if updated_competition is None:
        raise HTTPException(status_code=404, detail="Competition not found")
    return updated_competition

@app.get("/prompts/", response_model=List[schemas.Prompt], tags=["Management"])
def read_prompts(db: Session = Depends(get_db)):
    return crud.get_prompts(db)

@app.put("/prompts/{prompt_id}", response_model=schemas.Prompt, tags=["Management"])
def update_prompt(prompt_id: int, prompt: schemas.PromptUpdate, db: Session = Depends(get_db)):
    db_prompt = crud.update_prompt(db, prompt_id, prompt)
    if db_prompt is None:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return db_prompt

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