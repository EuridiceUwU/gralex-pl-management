"""OCR engine wrapper.

This module turns an uploaded PDF or image into raw text. It uses Tesseract by
default (lightweight, ships in the Docker image) with an OpenCV preprocessing
pass to improve accuracy. PaddleOCR / docTR or a cloud OCR (Google Vision, AWS
Textract) can be swapped in here later without touching the API layer.
"""

from __future__ import annotations

import io
import shutil
import subprocess

import cv2
import numpy as np
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes

# Tesseract language packs to use. Spanish + English covers most guías.
_LANGS = "spa+eng"

# Below this many characters we assume the PDF has no usable text layer
# (image-only scan) and fall back to rasterizing + Tesseract.
_MIN_EMBEDDED_CHARS = 20


def _pdf_embedded_text(content: bytes) -> str:
    """Extract a PDF's embedded text layer via poppler's pdftotext.

    Returns "" when poppler is unavailable or the PDF has no text layer.
    Using ``- -`` streams stdin→stdout so no temp files touch the disk, and
    ``-layout`` keeps the spatial arrangement the parser regexes rely on.
    """
    if shutil.which("pdftotext") is None:
        return ""

    try:
        proc = subprocess.run(
            ["pdftotext", "-layout", "-enc", "UTF-8", "-", "-"],
            input=content,
            capture_output=True,
            timeout=30,
        )
    except (subprocess.SubprocessError, OSError):
        return ""

    if proc.returncode != 0:
        return ""

    return proc.stdout.decode("utf-8", errors="replace").strip()


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
    """Extract raw text from an uploaded file (PDF or image).

    For PDFs we prefer the embedded text layer (fast and accurate); only when
    it is missing (image-only scan) do we rasterize and run Tesseract.
    """
    if content_type == "application/pdf" or content_type.endswith("pdf"):
        embedded = _pdf_embedded_text(content)
        if len(embedded) >= _MIN_EMBEDDED_CHARS:
            return embedded

        pages = convert_from_bytes(content, dpi=300)
        return "\n\n".join(_image_to_text(page) for page in pages).strip()

    image = Image.open(io.BytesIO(content))
    return _image_to_text(image).strip()
