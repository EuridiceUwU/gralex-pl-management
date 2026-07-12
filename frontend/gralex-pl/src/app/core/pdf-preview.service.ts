import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

// The worker is copied to the app root as a build asset (see angular.json),
// so it's served at /pdf.worker.min.mjs. A bare `new URL(..., import.meta.url)`
// on a package specifier is NOT emitted as an asset by esbuild and would 404.
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * Renders the first page of an uploaded guide to a PNG data URL. PDFs are
 * rasterized with pdf.js (only page 1 — later pages are terms/extra copies);
 * plain images are read straight through. Used for the batch review preview,
 * the hover magnifier and the carousel thumbnails, all client-side.
 */
@Injectable({ providedIn: 'root' })
export class PdfPreviewService {
  async renderFirstPage(file: File): Promise<string> {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return this.renderPdfFirstPage(file);
    }
    return this.readImage(file);
  }

  private async renderPdfFirstPage(file: File): Promise<string> {
    const data = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data });
    const doc = await loadingTask.promise;
    try {
      const page = await doc.getPage(1);
      // Scale ~2x gives a crisp preview that the magnifier can zoom into.
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No 2D canvas context available');

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      return canvas.toDataURL('image/png');
    } finally {
      await loadingTask.destroy();
    }
  }

  private readImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
