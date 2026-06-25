# Gralex OCR Service

Microservicio en Python (FastAPI) que lee guías en PDF o imagen y devuelve el
texto crudo. La extracción de campos estructurados **todavía no está
implementada**: queda lista para completarse en `parser.py`.

## Endpoints

| Método | Ruta           | Descripción                                  |
| ------ | -------------- | -------------------------------------------- |
| GET    | `/health`      | Liveness check.                              |
| POST   | `/ocr/extract` | Recibe `file` (multipart) → `{ raw_text, fields }` |

`fields` regresa vacío por ahora (ver `parser.py`, `TODO`).

## Stack OCR

- **Tesseract** (`pytesseract`) por defecto, ligero y empaquetado en la imagen.
- **OpenCV** para preprocesar (escala de grises + binarización Otsu).
- **pdf2image / poppler** para rasterizar PDFs.
- Se puede cambiar a **PaddleOCR / docTR** o a un servicio cloud (Google Vision,
  AWS Textract) editando únicamente `ocr_engine.py`.

## Correr en local (sin Docker)

```bash
cd ocr
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# requiere tesseract-ocr, tesseract-ocr-spa y poppler-utils instalados en el SO
uvicorn main:app --reload --port 8000
```

## Docker

Se construye y levanta automáticamente con `docker compose up --build` (servicio
`ocr`). El backend lo consume vía la variable `OCR_SERVICE_URL`.
