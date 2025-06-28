from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import base64
from typing import Dict, Any

from app.graph import PhotoJudgeApp

app = FastAPI(
    title="Nature Photography Competition Judge API",
    description="An API to judge nature photography using a LangGraph workflow.",
    version="1.0.0"
)

# Allow CORS for the React+Vite frontend
# Default Vite port is 5173, default CRA port is 3000
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

photo_judge_app = PhotoJudgeApp()

@app.post("/judge/", response_model=Dict[str, Any])
async def judge_photo_endpoint(file: UploadFile = File(...)):
    """
    Accepts an image file, and returns a JSON object with the judging results.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        contents = await file.read()
        image_data = base64.b64encode(contents).decode("utf-8")
        result = await photo_judge_app.judge_photo(
            photo_filename=file.filename,
            image_data=image_data
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Welcome to the Photo Judge API"}