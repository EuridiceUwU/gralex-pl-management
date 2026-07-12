import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/api.service';
import { Customer, OcrFields, Supplier } from '../../../core/models';
import { PdfPreviewService } from '../../../core/pdf-preview.service';
import { FieldErrorComponent } from '../../../shared/field-error.component';

interface GuideForm {
  ssId: number | null;
  supplierId: number | null;
  customerId: number | null;
  trackingNum: string;
  creationDate: string;
  senderName: string;
  receiverName: string;
  senderCp: string;
  receiverCp: string;
  weight: string;
  carrier: string | null;
  carrierOther: string;
  service: string | null;
  cost: number | null;
  price: number | null;
}

interface BatchGuide {
  file: File;
  previewUrl: string;
  form: GuideForm;
  save: 'pending' | 'saving' | 'saved' | 'error';
  errorMsg: string | null;
}

interface LensState {
  visible: boolean;
  x: number;
  y: number;
  bgX: number;
  bgY: number;
  bgW: number;
  bgH: number;
}

const MAX_BATCH = 10;
const LENS_SIZE = 180; // px, diameter of the magnifier
const LENS_ZOOM = 2.5; // magnification factor

@Component({
  selector: 'app-upload-guide',
  imports: [FormsModule, FieldErrorComponent],
  templateUrl: './upload-guide.component.html',
})
export class UploadGuideComponent implements OnInit {
  readonly step = signal<'select' | 'review' | 'done'>('select');
  readonly files = signal<File[]>([]);
  readonly ocrLoading = signal(false);
  readonly ocrProgress = signal<{ done: number; total: number }>({ done: 0, total: 0 });
  readonly sending = signal(false);
  readonly sendProgress = signal<{ done: number; total: number }>({ done: 0, total: 0 });
  readonly message = signal<string | null>(null);
  readonly isDragging = signal(false);

  readonly guides = signal<BatchGuide[]>([]);
  readonly currentIndex = signal(0);
  readonly current = computed<BatchGuide | undefined>(() => this.guides()[this.currentIndex()]);
  readonly savedCount = signal(0);

  readonly lens = signal<LensState>({ visible: false, x: 0, y: 0, bgX: 0, bgY: 0, bgW: 0, bgH: 0 });
  readonly lensSize = LENS_SIZE;

  readonly customers = signal<Customer[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly statuses = signal<{ ss_id: number; ss_name: string }[]>([]);

  readonly carrierOptions = ['Fedex', 'DHL', 'Estafeta', 'Paquetexpress', 'Otro'];
  readonly serviceOptions = ['Express', 'Terrestre', 'Internacional'];
  readonly maxBatch = MAX_BATCH;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly pdf: PdfPreviewService,
  ) {}

  ngOnInit(): void {
    this.api.customers().subscribe((r) => this.customers.set(r.customers));
    this.api.suppliers().subscribe((r) => this.suppliers.set(r.suppliers));
    this.api.shipmentStatuses().subscribe((r) => this.statuses.set(r.statuses));
  }

  // --- file selection --------------------------------------------------------

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFiles(Array.from(input.files ?? []));
    input.value = ''; // allow re-selecting the same file(s)
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    this.setFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  private setFiles(list: File[]): void {
    this.message.set(null);
    if (list.length === 0) return;

    let picked = list;
    if (list.length > MAX_BATCH) {
      picked = list.slice(0, MAX_BATCH);
      this.message.set(`Máximo ${MAX_BATCH} guías por lote; se tomaron las primeras ${MAX_BATCH}.`);
    }
    this.files.set(picked);
  }

  removeSelected(index: number): void {
    this.files.update((list) => list.filter((_, i) => i !== index));
  }

  // --- OCR extraction --------------------------------------------------------

  async extract(): Promise<void> {
    const files = this.files();
    if (files.length === 0) return;

    this.ocrLoading.set(true);
    this.message.set(null);
    this.ocrProgress.set({ done: 0, total: files.length });

    const batch: BatchGuide[] = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);

        const [ocr, previewUrl] = await Promise.all([
          this.runOcr(fd),
          this.pdf.renderFirstPage(file).catch(() => ''),
        ]);

        batch.push({
          file,
          previewUrl,
          form: this.prefill(ocr),
          save: 'pending',
          errorMsg: null,
        });
        this.ocrProgress.update((p) => ({ ...p, done: p.done + 1 }));
      }
    } catch {
      this.ocrLoading.set(false);
      this.message.set('El servicio de OCR no respondió.');
      return;
    }

    this.ocrLoading.set(false);
    this.guides.set(batch);
    this.currentIndex.set(0);
    this.savedCount.set(0);
    this.step.set('review');
  }

  private runOcr(fd: FormData): Promise<OcrFields> {
    return new Promise((resolve, reject) => {
      this.api.runOcr(fd).subscribe({
        next: (res) => resolve(res.fields),
        error: (err) => reject(err),
      });
    });
  }

  private prefill(fields: OcrFields): GuideForm {
    const carrier = fields.carrier && this.carrierOptions.includes(fields.carrier) ? fields.carrier : null;
    const service = fields.service && this.serviceOptions.includes(fields.service) ? fields.service : null;
    const createdStatus = this.statuses().find((s) => s.ss_name === 'Etiqueta creada');

    return {
      ssId: createdStatus?.ss_id ?? this.statuses()[0]?.ss_id ?? null,
      supplierId: null,
      customerId: null,
      trackingNum: fields.tracking_num ?? '',
      // Default to today's date when the guide has none.
      creationDate: fields.creation_date ?? new Date().toISOString().slice(0, 10),
      senderName: fields.sender_name ?? '',
      receiverName: fields.receiver_name ?? '',
      senderCp: fields.sender_cp ?? '',
      receiverCp: fields.receiver_cp ?? '',
      weight: fields.weight ?? '',
      carrier,
      carrierOther: '',
      service,
      cost: null,
      price: null,
    };
  }

  onCarrierChange(): void {
    const guide = this.current();
    if (guide && guide.form.carrier !== 'Otro') {
      guide.form.carrierOther = '';
    }
  }

  // --- carousel navigation ---------------------------------------------------

  go(index: number): void {
    if (index < 0 || index >= this.guides().length) return;
    this.currentIndex.set(index);
    this.hideLens();
  }

  prev(): void {
    this.go(this.currentIndex() - 1);
  }

  next(): void {
    this.go(this.currentIndex() + 1);
  }

  // --- magnifier lens --------------------------------------------------------

  onPreviewMove(event: MouseEvent, img: HTMLImageElement): void {
    const rect = img.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      this.hideLens();
      return;
    }

    const bgW = rect.width * LENS_ZOOM;
    const bgH = rect.height * LENS_ZOOM;
    // Center the zoomed background on the cursor position within the lens.
    const bgX = -(x * LENS_ZOOM - LENS_SIZE / 2);
    const bgY = -(y * LENS_ZOOM - LENS_SIZE / 2);

    this.lens.set({
      visible: true,
      x: x - LENS_SIZE / 2,
      y: y - LENS_SIZE / 2,
      bgX,
      bgY,
      bgW,
      bgH,
    });
  }

  hideLens(): void {
    this.lens.update((l) => (l.visible ? { ...l, visible: false } : l));
  }

  // --- send / save -----------------------------------------------------------

  async send(): Promise<void> {
    const pending = this.guides().filter((g) => g.save !== 'saved');
    if (pending.length === 0) return;

    this.sending.set(true);
    this.message.set(null);
    this.sendProgress.set({ done: 0, total: pending.length });

    let ok = 0;
    for (const guide of pending) {
      guide.save = 'saving';
      guide.errorMsg = null;
      try {
        await this.saveGuide(guide);
        guide.save = 'saved';
        ok += 1;
      } catch (err) {
        guide.save = 'error';
        guide.errorMsg = this.errorMessage(err);
      }
      this.sendProgress.update((p) => ({ ...p, done: p.done + 1 }));
    }

    this.sending.set(false);
    this.savedCount.update((c) => c + ok);

    const remaining = this.guides().filter((g) => g.save !== 'saved');
    if (remaining.length === 0) {
      this.step.set('done');
    } else {
      // Keep only the failed ones so they can be fixed and retried.
      this.guides.set(remaining);
      this.currentIndex.set(0);
      this.message.set(
        `${ok} guía(s) guardada(s), ${remaining.length} con error. Corrige y vuelve a enviar.`,
      );
    }
  }

  private saveGuide(guide: BatchGuide): Promise<void> {
    const fd = new FormData();
    fd.append('file', guide.file);
    for (const [key, value] of Object.entries(guide.form)) {
      if (value !== null && value !== '') {
        fd.append(key, String(value));
      }
    }
    return new Promise((resolve, reject) => {
      this.api.confirmShipmentFromGuide(fd).subscribe({
        next: () => resolve(),
        error: (err) => reject(err),
      });
    });
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string }; message?: string };
    return e?.error?.message ?? e?.message ?? 'No se pudo guardar la guía.';
  }

  // --- teardown --------------------------------------------------------------

  cancelReview(): void {
    this.guides.set([]);
    this.files.set([]);
    this.currentIndex.set(0);
    this.hideLens();
    this.message.set(null);
    this.step.set('select');
  }

  goToShipments(): void {
    this.router.navigate(['/admin/shipments']);
  }

  reset(): void {
    this.files.set([]);
    this.guides.set([]);
    this.currentIndex.set(0);
    this.savedCount.set(0);
    this.message.set(null);
    this.step.set('select');
  }
}
