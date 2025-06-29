# app/main.py

import base64
import uuid
import asyncio
from pathlib import Path
from typing import List

import aiofiles
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import SessionLocal, engine
from .graph import PhotoJudgeApp, JudgingCriterion

# --- Initialize Database ---
models.Base.metadata.create_all(bind=engine)

# --- App Setup ---
app = FastAPI(
    title="Nature Photography Competition Judge API",
    description="An API to judge nature photography, store results, and retrieve them.",
    version="2.0.0"
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Application State ---
photo_judge_app = PhotoJudgeApp()
IMAGE_DIR = Path("uploaded_photos")
IMAGE_DIR.mkdir(exist_ok=True)


# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Startup Event ---
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        if not crud.get_criteria(db):
            default_criteria = [
                schemas.CriterionCreate(
                    name="Composition",
                    description="Evaluate the rule of thirds, framing, balance, and leading lines.",
                    weight=1.0,
                    enabled=True
                ),
                schemas.CriterionCreate(
                    name="Technical_Quality",
                    description="Assess focus, exposure, sharpness, and noise levels.",
                    weight=1.2,
                    enabled=True
                ),
                schemas.CriterionCreate(
                    name="Creativity",
                    description="Judge the unique perspective, artistic vision, and originality.",
                    weight=0.9,
                    enabled=True
                ),
                schemas.CriterionCreate(
                    name="Nature_Relevance",
                    description="Consider the connection to nature, authenticity, and storytelling.",
                    weight=1.1,
                    enabled=True
                ),
            ]
            for c in default_criteria:
                crud.create_criterion(db, c)

        # Default EVALUATION_PROMPT seeding
        if not crud.get_prompts_by_type(db, "EVALUATION_PROMPT"):
            crud.create_prompt(
                db,
                schemas.PromptCreate(
                    type="EVALUATION_PROMPT",
                    enabled=True,
                    template="""You are an expert photography judge. Evaluate this photograph for {criterion_name}.

                                {criterion_description}

                                Provide:
                                1. A score from 0.0 to 10.0
                                2. A brief rationale (2-3 sentences)

                                Format your response as:
                                SCORE: [number]
                                RATIONALE: [explanation]""",
                    description="The default prompt used for evaluating a single criterion."
                )
            )

        # Default REASONING_PROMPT seeding
        if not crud.get_prompts_by_type(db, "REASONING_PROMPT"):
            crud.create_prompt(
                db,
                schemas.PromptCreate(
                    type="REASONING_PROMPT",
                    enabled=True,
                    template="""You are the head judge of a photography competition. You have received feedback from your panel of judges on a photograph. Your task is to synthesize this feedback into a final, coherent summary for the photographer.

                                The photograph received an overall score of {overall_score}/10.
                                The competition rules emphasize: {rules}

                                Here is the detailed feedback from the panel:
                                {feedback_summary}

                                Based on all of this, please provide a final summary. Explain what is good about the photo, how it could be improved, and how well it fits the competition's specific rules. Address the photographer directly in a helpful and encouraging tone.""",
                    description="The default prompt for generating the final overall reasoning."
                )
            )
    finally:
        db.close()


# --- Image Processing Helper ---
async def process_and_store_image(file: UploadFile, competition_id: int, db: Session) -> schemas.Judgement:
    competition = crud.get_competition(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    criteria = crud.get_enabled_criteria(db)
    if not criteria:
        raise HTTPException(status_code=400, detail="No enabled judging criteria found")

    # Fetch the currently *enabled* prompts by their type
    eval_prompt = crud.get_enabled_prompt_by_type(db, "EVALUATION_PROMPT")
    reasoning_prompt = crud.get_enabled_prompt_by_type(db, "REASONING_PROMPT")

    if not eval_prompt:
        raise HTTPException(status_code=500, detail="No enabled EVALUATION_PROMPT found. Please enable one in the settings.")
    if not reasoning_prompt:
        raise HTTPException(status_code=500, detail="No enabled REASONING_PROMPT found. Please enable one in the settings.")

    judging_criteria = [
        JudgingCriterion(name=c.name, description=c.description, weight=c.weight)
        for c in criteria
    ]

    contents = await file.read()
    image_data = base64.b64encode(contents).decode("utf-8")

    result = await photo_judge_app.judge_photo(
        photo_filename=file.filename,
        image_data=image_data,
        criteria=judging_criteria,
        competition_rules=competition.rules,
        evaluation_prompt_template=eval_prompt.template,
        reasoning_prompt_template=reasoning_prompt.template
    )

    filename = f"{uuid.uuid4()}{Path(file.filename).suffix}"
    async with aiofiles.open(IMAGE_DIR / filename, "wb") as out_file:
        await out_file.write(contents)

    return crud.create_judgement(db, result, filename, competition_id)


# --- Judging Endpoints ---
@app.post("/judge/", response_model=schemas.Judgement, tags=["Judging"])
async def judge_single_photo(
    file: UploadFile = File(...),
    competition_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """Judge and store a single photo."""
    return await process_and_store_image(file, competition_id, db)


@app.post("/judge-batch/", response_model=List[schemas.Judgement], tags=["Judging"])
async def judge_multiple_photos(
    files: List[UploadFile] = File(...),
    competition_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """Judge and store multiple photos concurrently."""
    tasks = [process_and_store_image(f, competition_id, db) for f in files]
    return await asyncio.gather(*tasks)


# --- Judgement Retrieval ---
@app.get("/judgements/", response_model=List[schemas.Judgement], tags=["Retrieval"])
def get_all_judgements(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """Retrieve all judgements (paginated)."""
    return crud.get_judgements(db, skip=skip, limit=limit)


@app.get("/judgements/{judgement_id}", response_model=schemas.Judgement, tags=["Retrieval"])
def get_single_judgement(judgement_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific judgement by ID."""
    judgement = crud.get_judgement(db, judgement_id)
    if not judgement:
        raise HTTPException(status_code=404, detail="Judgement not found")
    return judgement


@app.delete("/judgements/{judgement_id}", tags=["Judging"])
def delete_judgement(judgement_id: int, db: Session = Depends(get_db)):
    """Delete a judgement and its associated image."""
    result = crud.delete_judgement(db, judgement_id)
    if not result:
        raise HTTPException(status_code=404, detail="Judgement not found")
    return JSONResponse(content={"message": f"Judgement {judgement_id} deleted successfully."})


@app.get("/competitions/{competition_id}/judgements", response_model=List[schemas.Judgement], tags=["Retrieval"])
def get_judgements_for_competition(competition_id: int, db: Session = Depends(get_db)):
    """Get all judgements for a competition."""
    return crud.get_judgements_by_competition(db, competition_id)


# --- Image Endpoint ---
@app.get("/images/{filename}", tags=["Retrieval"])
async def get_image(filename: str):
    """Serve a stored image file."""
    path = IMAGE_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path)


# --- Competition Management ---
@app.post("/competitions/", response_model=schemas.Competition, tags=["Management"])
def create_competition(competition: schemas.CompetitionCreate, db: Session = Depends(get_db)):
    return crud.create_competition(db, competition)


@app.get("/competitions/", response_model=List[schemas.Competition], tags=["Management"])
def read_competitions(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_competitions(db, skip=skip, limit=limit)


@app.put("/competitions/{competition_id}", response_model=schemas.Competition, tags=["Management"])
def update_competition(
    competition_id: int,
    competition: schemas.CompetitionUpdate,
    db: Session = Depends(get_db)
):
    updated = crud.update_competition(db, competition_id, competition)
    if not updated:
        raise HTTPException(status_code=404, detail="Competition not found")
    return updated


@app.delete("/competitions/{competition_id}", tags=["Management"])
def delete_competition(competition_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_competition(db, competition_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Competition not found")
    return JSONResponse(
        content={"message": f"Competition '{deleted.name}' and all its data deleted successfully."}
    )


# --- Prompt Management ---
@app.get("/prompts/", response_model=List[schemas.Prompt], tags=["Management"])
def read_prompts(db: Session = Depends(get_db)):
    """Get a list of all available prompts."""
    return crud.get_prompts(db)


@app.post("/prompts/", response_model=schemas.Prompt, tags=["Management"])
def create_prompt(prompt: schemas.PromptCreate, db: Session = Depends(get_db)):
    """Create a new prompt. If 'enabled' is true, any other prompts of the same type will be disabled."""
    return crud.create_prompt(db=db, prompt=prompt)


@app.put("/prompts/{prompt_id}", response_model=schemas.Prompt, tags=["Management"])
def update_prompt(prompt_id: int, prompt: schemas.PromptUpdate, db: Session = Depends(get_db)):
    """Update an existing prompt. If 'enabled' is true, any other prompts of the same type will be disabled."""
    updated = crud.update_prompt(db, prompt_id, prompt)
    if not updated:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return updated


@app.delete("/prompts/{prompt_id}", tags=["Management"])
def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """Delete a prompt by its ID."""
    deleted_prompt = crud.delete_prompt(db, prompt_id)
    if not deleted_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return JSONResponse(content={"message": f"Prompt {prompt_id} deleted successfully."})


# --- Criteria Management ---
@app.get("/criteria/", response_model=List[schemas.Criterion], tags=["Criteria Management"])
def read_criteria(db: Session = Depends(get_db)):
    return crud.get_criteria(db)


@app.post("/criteria/", response_model=schemas.Criterion, tags=["Criteria Management"])
def create_criterion(criterion: schemas.CriterionCreate, db: Session = Depends(get_db)):
    return crud.create_criterion(db=db, criterion=criterion)


@app.put("/criteria/{criterion_id}", response_model=schemas.Criterion, tags=["Criteria Management"])
def update_criterion(criterion_id: int, criterion: schemas.CriterionUpdate, db: Session = Depends(get_db)):
    updated = crud.update_criterion(db, criterion_id, criterion)
    if not updated:
        raise HTTPException(status_code=404, detail="Criterion not found")
    return updated


@app.delete("/criteria/{criterion_id}", response_model=schemas.Criterion, tags=["Criteria Management"])
def delete_criterion(criterion_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_criterion(db, criterion_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Criterion not found")
    return deleted


# --- Root Endpoint ---
@app.get("/", tags=["General"])
def read_root():
    """Health check endpoint."""
    return {"message": "Welcome to the Photo Judge API V2"}
