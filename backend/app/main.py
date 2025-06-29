# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.startup import seed_initial_data
from .db.database import SessionLocal, engine
from .db import models
from .api.routers import judging, management, images

# --- Initialize Database ---
models.Base.metadata.create_all(bind=engine)

# --- App Setup ---
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="An API to judge entries to photography competitions, store results, and retrieve them.",
    version="2.0.0"
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Startup Event ---
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

# --- Include Routers ---
app.include_router(judging.router)
app.include_router(management.router)
app.include_router(images.router)

# --- Root Endpoint ---
@app.get("/", tags=["General"])
def read_root():
    """Health check endpoint."""
    return {"message": f"Welcome to {settings.PROJECT_NAME} V2"}