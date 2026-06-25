"""OCR engine wrapper.

This module turns an uploaded PDF or image into raw text. It uses Tesseract by
default (lightweight, ships in the Docker image) with an OpenCV preprocessing
pass to improve accuracy. PaddleOCR / docTR or a cloud OCR (Google Vision, AWS
Textract) can be swapped in here later without touching the API layer.
"""

from __future__ import annotations

import io

import cv2
import numpy as np
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes

# Tesseract language packs to use. Spanish + English covers most guías.
_LANGS = "spa+eng"


def _preprocess(image: Image.Image) -> np.ndarray:
    """Grayscale + adaptive threshold to make text crisper for the OCR pass."""
    rgb = np.array(image.convert("RGB"))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    # Otsu binarization handles uneven lighting on phone photos of guías.
    _, binarized = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binarized


def _image_to_text(image: Image.Image) -> str:
    processed = _preprocess(image)
    return pytesseract.image_to_string(processed, lang=_LANGS)


def extract_text(content: bytes, content_type: str) -> str:
    """Extract raw text from an uploaded file (PDF or image)."""
    if content_type == "application/pdf" or content_type.endswith("pdf"):
        pages = convert_from_bytes(content, dpi=300)
        return "\n\n".join(_image_to_text(page) for page in pages).strip()

    image = Image.open(io.BytesIO(content))
    return _image_to_text(image).strip()
