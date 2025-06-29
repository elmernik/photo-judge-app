# app/api/routers/images.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import  FileResponse

from ...core.config import settings

router = APIRouter()


@router.get("/images/{filename}", tags=["Retrieval"])
async def get_image(filename: str):
    """Serve a stored image file."""
    path = settings.IMAGE_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path)