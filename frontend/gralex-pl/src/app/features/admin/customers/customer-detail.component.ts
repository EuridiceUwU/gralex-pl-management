import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/api.service';
import { Account, Customer, Shipment } from '../../../core/models';

@Component({
  selector: 'app-customer-detail',
  imports: [DecimalPipe, DatePipe, FormsModule],
  templateUrl: './customer-detail.component.html',
})
export class CustomerDetailComponent implements OnInit {
  readonly customer = signal<Customer | null>(null);
  readonly shipments = signal<Shipment[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly uploadingConstancy = signal(false);
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
        (sh.receiver_name || '').toLowerCase().includes(q) ||
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
  }

  private load(id: number): void {
    this.loading.set(true);
    this.api.getCustomer(id).subscribe({
      next: (r) => {
        this.customer.set(r.customer);
        this.api.customerShipments(id).subscribe((s) => {
          this.shipments.set(s.shipments);
          this.loading.set(false);
        });
        this.loadStatements();
      },
      error: () => this.router.navigate(['/admin/customers']),
    });
  }

  private loadStatements(): void {
    const id = this.customer()?.customer_id;
    if (!id) return;
    this.api.customerStatements(id).subscribe((r) => this.statements.set(r.accounts));
  }

  consultStatement(): void {
    const id = this.customer()?.customer_id;
    const from = this.statementFrom();
    const to = this.statementTo();
    if (!id || !from || !to) return;

    this.statementLoading.set(true);
    this.api.customerShipmentsInRange(id, from, to).subscribe({
      next: (r) => {
        const total = r.shipments.reduce((sum, sh) => sum + Number(sh.price ?? 0), 0);
        this.statementSummary.set({ count: r.shipments.length, total });
        this.statementLoading.set(false);
      },
      error: () => this.statementLoading.set(false),
    });
  }

  downloadStatement(format: 'pdf' | 'excel'): void {
    const id = this.customer()?.customer_id;
    const from = this.statementFrom();
    const to = this.statementTo();
    if (!id || !from || !to) return;

    this.downloadingFormat.set(format);
    this.api.downloadCustomerStatement(id, from, to, format).subscribe({
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

  // Forces a "Save As" download rather than opening the file in a new tab
  // (used for statement exports; viewConstancy() above still opens inline).
  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Shows the paquetería label for a guide: the carrier, using carrier_other
  // when the carrier is "Otro".
  paqueteria(sh: Shipment): string {
    if (sh.carrier === 'Otro') return sh.carrier_other || 'Otro';
    return sh.carrier || '—';
  }

  viewConstancy(): void {
    const key = this.customer()?.constancy_minio_key;
    if (!key) return;
    this.api.downloadDocument(key).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
    });
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
      },
      error: () => this.savingRow.set(false),
    });
  }

  onConstancyFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file
    const id = this.customer()?.customer_id;
    if (!file || !id) return;

    this.uploadingConstancy.set(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('documentType', 'Constancia SAT');
    this.api.uploadDocument(fd).subscribe({
      next: (r) => {
        this.api.updateCustomer(id, { constancyDocumentId: r.document.minio_id }).subscribe({
          next: () => {
            this.uploadingConstancy.set(false);
            this.reloadCustomer();
          },
          error: () => this.uploadingConstancy.set(false),
        });
      },
      error: () => this.uploadingConstancy.set(false),
    });
  }

  private reloadCustomer(): void {
    const id = this.customer()?.customer_id;
    if (!id) return;
    this.api.getCustomer(id).subscribe((r) => this.customer.set(r.customer));
  }

  confirmRemove(sh: Shipment): void {
    this.removeTarget.set(sh);
  }

  dismissModal(): void {
    this.removeTarget.set(null);
  }

  executeRemove(): void {
    const sh = this.removeTarget();
    if (!sh) return;
    this.removeTarget.set(null);
    this.api.removeShipmentCustomer(sh.shipment_id).subscribe({
      next: () => this.reloadShipments(),
      error: () => this.reloadShipments(),
    });
  }

  private reloadShipments(): void {
    const id = this.customer()?.customer_id;
    if (!id) return;
    this.api.customerShipments(id).subscribe((s) => this.shipments.set(s.shipments));
  }

  goBack(): void {
    this.router.navigate(['/admin/customers']);
  }
}
