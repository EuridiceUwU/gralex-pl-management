import { Component, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/api.service';
import { Customer, Shipment, Supplier } from '../../../core/models';
import { FieldErrorComponent } from '../../../shared/field-error.component';

@Component({
  selector: 'app-shipments',
  imports: [DecimalPipe, DatePipe, FormsModule, FieldErrorComponent],
  templateUrl: './shipments.component.html',
})
export class ShipmentsComponent implements OnInit {
  readonly shipments = signal<Shipment[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly statuses = signal<{ ss_id: number; ss_name: string }[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly search = signal('');
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly showAssign = signal(false);
  readonly assigning = signal(false);
  readonly cancelTarget = signal<Shipment | null>(null);

  readonly carrierOptions = ['Fedex', 'DHL', 'Estafeta', 'Paquetexpress', 'Otro'];
  readonly serviceOptions = ['Express', 'Terrestre', 'Internacional'];

  form = this.emptyForm();
  assignForm = this.emptyAssignForm();

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    if (!q) return this.shipments();
    return this.shipments().filter(
      (s) =>
        s.tracking_num.toLowerCase().includes(q) ||
        (s.customer_name || '').toLowerCase().includes(q) ||
        (s.supplier_name || '').toLowerCase().includes(q) ||
        (s.carrier || '').toLowerCase().includes(q) ||
        (s.service || '').toLowerCase().includes(q) ||
        (s.status_name || '').toLowerCase().includes(q),
    );
  });

  allFilteredSelected = computed(() => {
    const rows = this.filtered();
    return rows.length > 0 && rows.every((s) => this.selectedIds().has(s.shipment_id));
  });

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.reload();
    this.api.customers().subscribe((r) => this.customers.set(r.customers));
    this.api.suppliers().subscribe((r) => this.suppliers.set(r.suppliers));
    this.api.shipmentStatuses().subscribe((r) => this.statuses.set(r.statuses));
  }

  reload(): void {
    this.loading.set(true);
    this.api.shipments().subscribe({
      next: (r) => {
        this.shipments.set(r.shipments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startEdit(s: Shipment): void {
    this.editingId.set(s.shipment_id);
    this.form = {
      ssId: s.ss_id,
      supplierId: s.supplier_id,
      customerId: s.customer_id,
      trackingNum: s.tracking_num,
      creationDate: s.creation_date ? s.creation_date.slice(0, 10) : '',
      senderName: s.sender_name || '',
      receiverName: s.receiver_name || '',
      senderCp: s.sender_cp || '',
      receiverCp: s.receiver_cp || '',
      weight: s.weight || '',
      carrier: s.carrier,
      carrierOther: s.carrier_other || '',
      service: s.service,
      cost: s.cost != null ? Number(s.cost) : null,
      price: s.price != null ? Number(s.price) : null,
    };
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form = this.emptyForm();
  }

  save(): void {
    this.saving.set(true);
    const editingId = this.editingId();
    const obs = editingId ? this.api.updateShipment(editingId, this.form) : this.api.createShipment(this.form);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.reload();
      },
      error: () => this.saving.set(false),
    });
  }

  onCarrierChange(): void {
    if (this.form.carrier !== 'Otro') {
      this.form.carrierOther = '';
    }
  }

  confirmCancel(s: Shipment): void {
    this.cancelTarget.set(s);
  }

  dismissCancel(): void {
    this.cancelTarget.set(null);
  }

  executeCancel(): void {
    const s = this.cancelTarget();
    if (!s) return;
    const cancelStatus = this.statuses().find((st) => st.ss_name === 'Cancelado');
    if (!cancelStatus) return;
    this.cancelTarget.set(null);
    this.api.updateShipmentStatus(s.shipment_id, cancelStatus.ss_id).subscribe({
      next: () => this.reload(),
    });
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelect(id: number): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds.set(next);
  }

  toggleSelectAll(): void {
    if (this.allFilteredSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.filtered().map((s) => s.shipment_id)));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  openAssign(): void {
    this.assignForm = this.emptyAssignForm();
    this.showAssign.set(true);
  }

  cancelAssign(): void {
    this.showAssign.set(false);
  }

  confirmAssign(): void {
    if (!this.assignForm.customerId && !this.assignForm.supplierId) return;
    this.assigning.set(true);
    this.api
      .assignShipments([...this.selectedIds()], {
        customerId: this.assignForm.customerId,
        supplierId: this.assignForm.supplierId,
      })
      .subscribe({
        next: () => {
          this.assigning.set(false);
          this.showAssign.set(false);
          this.clearSelection();
          this.reload();
        },
        error: () => this.assigning.set(false),
      });
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

  private emptyAssignForm() {
    return { customerId: null as number | null, supplierId: null as number | null };
  }
}
