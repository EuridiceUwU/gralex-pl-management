import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/api.service';
import { Account, SupplierWithBalance, Shipment } from '../../../core/models';

@Component({
  selector: 'app-supplier-detail',
  imports: [DecimalPipe, DatePipe, FormsModule],
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

  // Inline cost/price editing (one row at a time).
  readonly editingRowId = signal<number | null>(null);
  readonly savingRow = signal(false);
  editForm: { cost: number | null; price: number | null } = { cost: null, price: null };

  // Estado de cuenta (statement) filters, preview summary, and history.
  readonly statementFrom = signal('');
  readonly statementTo = signal('');
  readonly statementSummary = signal<{ count: number; total: number } | null>(null);
  readonly statementLoading = signal(false);
  readonly downloadingFormat = signal<'pdf' | 'excel' | null>(null);
  readonly statements = signal<Account[]>([]);

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
        this.loadStatements();
      },
      error: () => this.router.navigate(['/admin/suppliers']),
    });
  }

  private loadStatements(): void {
    const id = this.supplier()?.supplier_id;
    if (!id) return;
    this.api.supplierStatements(id).subscribe((r) => this.statements.set(r.accounts));
  }

  consultStatement(): void {
    const id = this.supplier()?.supplier_id;
    const from = this.statementFrom();
    const to = this.statementTo();
    if (!id || !from || !to) return;

    this.statementLoading.set(true);
    this.api.supplierShipmentsInRange(id, from, to).subscribe({
      next: (r) => {
        const total = r.shipments.reduce((sum, sh) => sum + Number(sh.cost ?? 0), 0);
        this.statementSummary.set({ count: r.shipments.length, total });
        this.statementLoading.set(false);
      },
      error: () => this.statementLoading.set(false),
    });
  }

  downloadStatement(format: 'pdf' | 'excel'): void {
    const id = this.supplier()?.supplier_id;
    const from = this.statementFrom();
    const to = this.statementTo();
    if (!id || !from || !to) return;

    this.downloadingFormat.set(format);
    this.api.downloadSupplierStatement(id, from, to, format).subscribe({
      next: (blob) => {
        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        this.triggerDownload(blob, `estado-cuenta-${from}-${to}.${ext}`);
        this.downloadingFormat.set(null);
        this.loadStatements();
      },
      error: () => this.downloadingFormat.set(null),
    });
  }

  downloadHistoryStatement(account: Account): void {
    this.api.downloadDocument(account.minio_key).subscribe({
      next: (blob) => {
        const ext = account.minio_key.slice(account.minio_key.lastIndexOf('.') + 1) || 'pdf';
        this.triggerDownload(
          blob,
          `estado-cuenta-${account.start_period}-${account.end_period}.${ext}`,
        );
      },
    });
  }

  // Forces a "Save As" download rather than opening the file in a new tab.
  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  asNumber(v: string | null | undefined): number {
    return Number(v) || 0;
  }

  startEditRow(sh: Shipment): void {
    this.editingRowId.set(sh.shipment_id);
    this.editForm = {
      cost: sh.cost != null ? Number(sh.cost) : null,
      price: sh.price != null ? Number(sh.price) : null,
    };
  }

  cancelEditRow(): void {
    this.editingRowId.set(null);
  }

  saveRow(sh: Shipment): void {
    this.savingRow.set(true);
    this.api.updateShipmentPricing(sh.shipment_id, this.editForm).subscribe({
      next: (r) => {
        this.shipments.update((list) =>
          list.map((x) => (x.shipment_id === sh.shipment_id ? r.shipment : x)),
        );
        this.editingRowId.set(null);
        this.savingRow.set(false);
        // Cost feeds the supplier's consumed/available balance, so refresh it.
        const id = this.supplier()?.supplier_id;
        if (id) this.api.getSupplier(id).subscribe((res) => this.supplier.set(res.supplier));
      },
      error: () => this.savingRow.set(false),
    });
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
