import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/api.service';
import { SupplierWithBalance, Shipment } from '../../../core/models';

@Component({
  selector: 'app-supplier-detail',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './supplier-detail.component.html',
})
export class SupplierDetailComponent implements OnInit {
  readonly supplier = signal<SupplierWithBalance | null>(null);
  readonly shipments = signal<Shipment[]>([]);
  readonly statuses = signal<{ ss_id: number; ss_name: string }[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly cancelTarget = signal<Shipment | null>(null);
  readonly removeTarget = signal<Shipment | null>(null);

  filteredShipments = computed(() => {
    const q = this.search().toLowerCase();
    if (!q) return this.shipments();
    return this.shipments().filter(
      (sh) =>
        sh.tracking_num.toLowerCase().includes(q) ||
        (sh.customer_name || '').toLowerCase().includes(q) ||
        (sh.status_name || '').toLowerCase().includes(q),
    );
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: ApiService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
    this.api.shipmentStatuses().subscribe((r) => this.statuses.set(r.statuses));
  }

  private load(id: number): void {
    this.loading.set(true);
    this.api.getSupplier(id).subscribe({
      next: (r) => {
        this.supplier.set(r.supplier);
        this.api.supplierShipments(id).subscribe((s) => {
          this.shipments.set(s.shipments);
          this.loading.set(false);
        });
      },
      error: () => this.router.navigate(['/admin/suppliers']),
    });
  }

  asNumber(v: string | null | undefined): number {
    return Number(v) || 0;
  }

  confirmCancel(sh: Shipment): void {
    this.cancelTarget.set(sh);
  }

  confirmRemove(sh: Shipment): void {
    this.removeTarget.set(sh);
  }

  dismissModals(): void {
    this.cancelTarget.set(null);
    this.removeTarget.set(null);
  }

  executeCancel(): void {
    const sh = this.cancelTarget();
    if (!sh) return;
    const cancelStatus = this.statuses().find((s) => s.ss_name === 'Cancelado');
    if (!cancelStatus) return;
    this.cancelTarget.set(null);
    this.api.updateShipmentStatus(sh.shipment_id, cancelStatus.ss_id).subscribe({
      next: () => this.reloadAll(),
    });
  }

  executeRemove(): void {
    const sh = this.removeTarget();
    if (!sh) return;
    this.removeTarget.set(null);
    this.api.removeShipmentSupplier(sh.shipment_id).subscribe({
      next: () => this.reloadAll(),
      error: () => this.reloadAll(),
    });
  }

  private reloadAll(): void {
    const id = this.supplier()?.supplier_id;
    if (!id) return;
    this.api.getSupplier(id).subscribe((r) => this.supplier.set(r.supplier));
    this.api.supplierShipments(id).subscribe((s) => this.shipments.set(s.shipments));
  }

  goBack(): void {
    this.router.navigate(['/admin/suppliers']);
  }
}
