# app/api/routers/images.py

import asyncio
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse, FileResponse

from ...db import schemas
from ...api import deps
from ...services import judging_service
from ...crud import crud
from ...core.config import settings

router = APIRouter()


@router.get("/images/{filename}", tags=["Retrieval"])
async def get_image(filename: str):
    """Serve a stored image file."""
    path = settings.IMAGE_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path)