import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/api.service';
import { Customer } from '../../../core/models';
import { PhoneMaskDirective } from '../../../core/phone-mask.directive';
import { FieldErrorComponent } from '../../../shared/field-error.component';

@Component({
  selector: 'app-customers',
  imports: [FormsModule, PhoneMaskDirective, FieldErrorComponent],
  templateUrl: './customers.component.html',
})
export class CustomersComponent implements OnInit {
  readonly items = signal<Customer[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly search = signal('');
  readonly confirmTarget = signal<Customer | null>(null);

  // Constancia file chosen in the create form (optional).
  constancyFile: File | null = null;

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    if (!q) return this.items();
    return this.items().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.rfc || '').toLowerCase().includes(q),
    );
  });

  form = this.empty();

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.customers().subscribe({
      next: (r) => {
        this.items.set(r.customers);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startEdit(c: Customer): void {
    this.editingId.set(c.customer_id);
    this.form = {
      name: c.name,
      companyName: c.company_name || '',
      email: c.email || '',
      phone: c.phone || '',
      rfc: c.rfc || '',
      cp: c.cp || '',
      cfdi: c.cfdi || '',
    };
    this.constancyFile = null;
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form = this.empty();
    this.constancyFile = null;
  }

  onConstancyFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.constancyFile = input.files?.[0] ?? null;
  }

  save(): void {
    this.saving.set(true);
    // When a constancia file is attached, upload it first to obtain its
    // minio_id, then send it as constancyDocumentId with the customer payload.
    if (this.constancyFile) {
      const fd = new FormData();
      fd.append('file', this.constancyFile);
      fd.append('documentType', 'Constancia SAT');
      this.api.uploadDocument(fd).subscribe({
        next: (r) => this.persist(r.document.minio_id),
        error: () => this.saving.set(false),
      });
    } else {
      this.persist(null);
    }
  }

  private persist(constancyDocumentId: number | null): void {
    const payload = { ...this.form, constancyDocumentId };
    const obs = this.editingId()
      ? this.api.updateCustomer(this.editingId()!, payload)
      : this.api.createCustomer(payload);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.reload();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDeactivate(c: Customer): void {
    this.confirmTarget.set(c);
  }

  cancelConfirm(): void {
    this.confirmTarget.set(null);
  }

  deactivate(): void {
    const c = this.confirmTarget();
    if (!c) return;
    this.confirmTarget.set(null);
    this.api.deleteCustomer(c.customer_id).subscribe({
      next: () => this.reload(),
    });
  }

  activate(c: Customer): void {
    this.api.updateCustomer(c.customer_id, { status: true }).subscribe({
      next: () => this.reload(),
    });
  }

  viewDetail(id: number): void {
    this.router.navigate(['/admin/customers', id]);
  }

  private empty() {
    return { name: '', companyName: '', email: '', phone: '', rfc: '', cp: '', cfdi: '' };
  }
}
