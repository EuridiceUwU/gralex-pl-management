# syntax=docker/dockerfile:1.7

FROM python:3.12-slim

WORKDIR /app

# System deps: tesseract (+ Spanish pack) for OCR and poppler for PDF rasterizing.
# libgl/libglib are required by opencv-python-headless.
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-spa \
        poppler-utils \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0) if urllib.request.urlopen('http://127.0.0.1:8000/health').status==200 else sys.exit(1)" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--root-path", "/ocr"]
