import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/api.service';
import { Customer, OcrFields, Supplier } from '../../../core/models';
import { FieldErrorComponent } from '../../../shared/field-error.component';

@Component({
  selector: 'app-upload-guide',
  imports: [FormsModule, FieldErrorComponent],
  templateUrl: './upload-guide.component.html',
})
export class UploadGuideComponent implements OnInit {
  readonly step = signal<'select' | 'review' | 'done'>('select');
  readonly file = signal<File | null>(null);
  readonly ocrLoading = signal(false);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly isDragging = signal(false);

  readonly customers = signal<Customer[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly statuses = signal<{ ss_id: number; ss_name: string }[]>([]);

  readonly carrierOptions = ['Fedex', 'DHL', 'Estafeta', 'Paquetexpress', 'Otro'];
  readonly serviceOptions = ['Express', 'Terrestre', 'Internacional'];

  form = this.emptyForm();

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.api.customers().subscribe((r) => this.customers.set(r.customers));
    this.api.suppliers().subscribe((r) => this.suppliers.set(r.suppliers));
    this.api.shipmentStatuses().subscribe((r) => this.statuses.set(r.statuses));
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.[0] ?? null);
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
    this.setFile(event.dataTransfer?.files?.[0] ?? null);
  }

  private setFile(file: File | null): void {
    this.file.set(file);
    this.message.set(null);
  }

  extract(): void {
    const f = this.file();
    if (!f) return;

    this.ocrLoading.set(true);
    this.message.set(null);
    const form = new FormData();
    form.append('file', f);

    this.api.runOcr(form).subscribe({
      next: (res) => {
        this.ocrLoading.set(false);
        this.prefill(res.fields);
        this.step.set('review');
      },
      error: () => {
        this.ocrLoading.set(false);
        this.message.set('El servicio de OCR no respondió.');
      },
    });
  }

  private prefill(fields: OcrFields): void {
    const carrier = fields.carrier && this.carrierOptions.includes(fields.carrier) ? fields.carrier : null;
    const service = fields.service && this.serviceOptions.includes(fields.service) ? fields.service : null;
    const createdStatus = this.statuses().find((s) => s.ss_name === 'Etiqueta creada');

    this.form = {
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
    if (this.form.carrier !== 'Otro') {
      this.form.carrierOther = '';
    }
  }

  back(): void {
    this.step.set('select');
  }

  confirm(): void {
    const f = this.file();
    if (!f) return;

    this.saving.set(true);
    this.message.set(null);
    const fd = new FormData();
    fd.append('file', f);
    for (const [key, value] of Object.entries(this.form)) {
      if (value !== null && value !== '') {
        fd.append(key, String(value));
      }
    }

    this.api.confirmShipmentFromGuide(fd).subscribe({
      next: () => {
        this.saving.set(false);
        this.step.set('done');
      },
      error: () => {
        this.saving.set(false);
        this.message.set('No se pudo guardar la guía.');
      },
    });
  }

  goToShipments(): void {
    this.router.navigate(['/admin/shipments']);
  }

  reset(): void {
    this.file.set(null);
    this.message.set(null);
    this.form = this.emptyForm();
    this.step.set('select');
  }

  private emptyForm() {
    return {
      ssId: null as number | null,
      supplierId: null as number | null,
      customerId: null as number | null,
      trackingNum: '',
      creationDate: '',
      senderName: '',
      receiverName: '',
      senderCp: '',
      receiverCp: '',
      weight: '',
      carrier: null as string | null,
      carrierOther: '',
      service: null as string | null,
      cost: null as number | null,
      price: null as number | null,
    };
  }
}
