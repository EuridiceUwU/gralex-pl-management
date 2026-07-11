"""wrapper del motor de ocr"""

from __future__ import annotations

import io
import shutil
import subprocess

import cv2
import numpy as np
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes

# Configuracion de idioma tesseract
_LANGS = "spa+eng"


# escaneo de imagen rasterizar + Tesseract.
_MIN_EMBEDDED_CHARS = 20


def _pdf_embedded_text(content: bytes) -> str:
    """Extrae la capa de texto de un PDF usando pdftotext de poppler"""
    if shutil.which("pdftotext") is None:
        return ""

    try:
        proc = subprocess.run(
            ["pdftotext", "-f", "1", "-l", "1", "-layout", "-enc", "UTF-8", "-", "-"],
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
    """Escala de grises + umbral para que el texto quede más nítido"""
    rgb = np.array(image.convert("RGB"))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    # La binarización de Otsu ayuda con la iluminación despareja de las fotos tomadas con el celular.
    _, binarized = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binarized


def _image_to_text(image: Image.Image) -> str:
    processed = _preprocess(image)
    return pytesseract.image_to_string(processed, lang=_LANGS)


def extract_text(content: bytes, content_type: str) -> str:
    #extrae el texto crudo del archivo
    if content_type == "application/pdf" or content_type.endswith("pdf"):
        embedded = _pdf_embedded_text(content)
        if len(embedded) >= _MIN_EMBEDDED_CHARS:
            return embedded
        # Solo se toma la primera página del pdf y el resto no
        pages = convert_from_bytes(content, dpi=300, first_page=1, last_page=1)
        return "\n\n".join(_image_to_text(page) for page in pages).strip()

    image = Image.open(io.BytesIO(content))
    return _image_to_text(image).strip()
