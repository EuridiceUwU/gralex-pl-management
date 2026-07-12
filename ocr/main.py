"""API OCR de Gralex PL"""

from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from ocr_engine import extract_text
from parser import parse_fields

app = FastAPI(
    title="Gralex OCR Service",
    version="0.1.0",
    description="Lectura OCR de guías (PDF/imagen) para Gralex.",
)

_ALLOWED_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/tiff",
}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "gralex-ocr"}


@app.post("/ocr/extract")
async def ocr_extract(file: UploadFile = File(...)) -> JSONResponse:
    content_type = file.content_type or ""

    if content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipo de archivo no soportado: {content_type or 'desconocido'}",
        )

    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Archivo vacío")

    try:
        raw_text = extract_text(content, content_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de OCR: {exc}") from exc

    return JSONResponse(
        {
            "filename": file.filename,
            "content_type": content_type,
            "raw_text": raw_text,
            "fields": parse_fields(raw_text),
        }
    )
