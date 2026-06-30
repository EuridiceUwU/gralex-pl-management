import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/api.service';
import { SupplierWithBalance } from '../../../core/models';
import { PhoneMaskDirective } from '../../../core/phone-mask.directive';
import { FieldErrorComponent } from '../../../shared/field-error.component';

@Component({
  selector: 'app-suppliers',
  imports: [FormsModule, DecimalPipe, PhoneMaskDirective, FieldErrorComponent],
  templateUrl: './suppliers.component.html',
})
export class SuppliersComponent implements OnInit {
  readonly items = signal<SupplierWithBalance[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly search = signal('');
  readonly confirmTarget = signal<SupplierWithBalance | null>(null);

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    if (!q) return this.items();
    return this.items().filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        (s.rfc || '').toLowerCase().includes(q),
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
    this.api.suppliers().subscribe({
      next: (r) => {
        this.items.set(r.suppliers);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startEdit(s: SupplierWithBalance): void {
    this.editingId.set(s.supplier_id);
    this.form = {
      name: s.name,
      email: s.email || '',
      phone: s.phone || '',
      rfc: s.rfc || '',
      creditAmount: s.credit_amount ? Number(s.credit_amount) : null,
    };
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form = this.empty();
  }

  save(): void {
    this.saving.set(true);
    const obs = this.editingId()
      ? this.api.updateSupplier(this.editingId()!, this.form)
      : this.api.createSupplier(this.form);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.reload();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDeactivate(s: SupplierWithBalance): void {
    this.confirmTarget.set(s);
  }

  cancelConfirm(): void {
    this.confirmTarget.set(null);
  }

  deactivate(): void {
    const s = this.confirmTarget();
    if (!s) return;
    this.confirmTarget.set(null);
    this.api.deleteSupplier(s.supplier_id).subscribe({
      next: () => this.reload(),
    });
  }

  activate(s: SupplierWithBalance): void {
    this.api.updateSupplier(s.supplier_id, { status: true }).subscribe({
      next: () => this.reload(),
    });
  }

  viewDetail(id: number): void {
    this.router.navigate(['/admin/suppliers', id]);
  }

  asNumber(v: string | null | undefined): number {
    return Number(v) || 0;
  }

  private empty() {
    return { name: '', email: '', phone: '', rfc: '', creditAmount: null as number | null };
  }
}
