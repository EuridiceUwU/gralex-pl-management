import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/api.service';
import { Customer, Shipment, Supplier } from '../../../core/models';
import { FieldErrorComponent } from '../../../shared/field-error.component';

@Component({
  selector: 'app-shipments',
  imports: [DecimalPipe, FormsModule, FieldErrorComponent],
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

  form = this.emptyForm();

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

  save(): void {
    this.saving.set(true);
    this.api.createShipment(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.form = this.emptyForm();
        this.reload();
      },
      error: () => this.saving.set(false),
    });
  }

  private emptyForm() {
    return {
      ssId: null as number | null,
      supplierId: null as number | null,
      customerId: null as number | null,
      trackingNum: '',
      receiverName: '',
      receiverCp: '',
      weight: '',
      service: '',
      cost: null as number | null,
      price: null as number | null,
    };
  }
}
