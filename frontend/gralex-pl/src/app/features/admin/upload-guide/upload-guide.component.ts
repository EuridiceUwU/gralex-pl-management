import { Component, signal } from '@angular/core';

import { ApiService } from '../../../core/api.service';
import { OcrResult } from '../../../core/models';

@Component({
  selector: 'app-upload-guide',
  templateUrl: './upload-guide.component.html',
})
export class UploadGuideComponent {
  readonly file = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly ocrLoading = signal(false);
  readonly uploadOk = signal(false);
  readonly ocr = signal<OcrResult | null>(null);
  readonly message = signal<string | null>(null);

  constructor(private readonly api: ApiService) {}

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
    this.uploadOk.set(false);
    this.ocr.set(null);
    this.message.set(null);
  }

  upload(): void {
    const f = this.file();
    if (!f) return;

    this.uploading.set(true);
    this.message.set(null);
    const form = new FormData();
    form.append('file', f);
    form.append('documentType', 'Guía');

    this.api.uploadDocument(form).subscribe({
      next: () => {
        this.uploading.set(false);
        this.uploadOk.set(true);
      },
      error: () => {
        this.uploading.set(false);
        this.message.set('No se pudo subir el documento.');
      },
    });
  }

  readOcr(): void {
    const f = this.file();
    if (!f) return;

    this.ocrLoading.set(true);
    this.message.set(null);
    const form = new FormData();
    form.append('file', f);

    this.api.runOcr(form).subscribe({
      next: (res) => {
        this.ocrLoading.set(false);
        this.ocr.set(res);
      },
      error: () => {
        this.ocrLoading.set(false);
        this.message.set('El servicio de OCR no respondió.');
      },
    });
  }

  fieldEntries(): { key: string; value: string }[] {
    const fields = this.ocr()?.fields ?? {};
    return Object.entries(fields).map(([key, value]) => ({ key, value: value ?? '—' }));
  }
}
