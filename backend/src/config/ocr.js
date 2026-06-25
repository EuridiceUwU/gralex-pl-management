export const ocrConfig = {
  // Base URL of the Python OCR microservice (see /ocr).
  baseUrl: process.env.OCR_SERVICE_URL ?? "http://ocr:8000",
};
