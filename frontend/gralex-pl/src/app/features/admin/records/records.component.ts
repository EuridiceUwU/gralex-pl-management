import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../../core/api.service';
import { AuditRecord, RecordAction, RecordFilters } from '../../../core/models';

const TABLE_LABELS: Record<string, string> = {
  Users: 'Usuarios',
  Roles: 'Roles',
  Employees: 'Empleados',
  Suppliers: 'Proveedores',
  Customers: 'Clientes',
  Shipments: 'Guías',
  Minio_documents: 'Documentos',
  Accounts: 'Estados de cuenta',
};

// Columns that are noisy or redundant in the changed-fields view (already
// shown elsewhere in the row, or internal bookkeeping the admin doesn't need).
const DIFF_IGNORE_KEYS = new Set(['created_at']);

interface FieldChange {
  key: string;
  oldValue: unknown;
  newValue: unknown;
}

@Component({
  selector: 'app-records',
  imports: [FormsModule, DatePipe],
  templateUrl: './records.component.html',
})
export class RecordsComponent implements OnInit {
  readonly records = signal<AuditRecord[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly loading = signal(true);
  readonly tables = signal<string[]>([]);
  readonly expandedId = signal<number | null>(null);
  readonly downloadingFormat = signal<'pdf' | 'excel' | null>(null);

  readonly actions: RecordAction[] = ['Agregó', 'Editó', 'Eliminó'];

  filters: { from: string; to: string; action: RecordAction | ''; tableName: string } = {
    from: '',
    to: '',
    action: '',
    tableName: '',
  };

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.recordTables().subscribe((r) => this.tables.set(r.tables));
    this.load();
  }

  tableLabel(tableName: string): string {
    return TABLE_LABELS[tableName] ?? tableName;
  }

  actionBadgeClass(action: RecordAction): string {
    switch (action) {
      case 'Agregó':
        return 'bg-emerald-50 text-emerald-700';
      case 'Editó':
        return 'bg-brand-50 text-brand-700';
      case 'Eliminó':
        return 'bg-red-50 text-red-700';
    }
  }

  private currentFilters(): RecordFilters {
    return {
      from: this.filters.from || undefined,
      to: this.filters.to || undefined,
      action: this.filters.action || undefined,
      tableName: this.filters.tableName || undefined,
    };
  }

  load(): void {
    this.loading.set(true);
    this.api
      .records({ ...this.currentFilters(), page: this.page(), pageSize: this.pageSize })
      .subscribe({
        next: (r) => {
          this.records.set(r.records);
          this.total.set(r.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.expandedId.set(null);
    this.load();
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.load();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  toggleExpand(record: AuditRecord): void {
    this.expandedId.set(this.expandedId() === record.record_id ? null : record.record_id);
  }

  // Reduces old_values/new_values to just the keys that actually changed, so
  // an admin sees "campo: antes → ahora" instead of two full JSON blobs.
  changedFields(record: AuditRecord): FieldChange[] {
    const before = record.old_values ?? {};
    const after = record.new_values ?? {};
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const changes: FieldChange[] = [];

    for (const key of keys) {
      if (DIFF_IGNORE_KEYS.has(key)) continue;
      const oldValue = (before as Record<string, unknown>)[key];
      const newValue = (after as Record<string, unknown>)[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ key, oldValue, newValue });
      }
    }

    return changes;
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    return String(value);
  }

  download(format: 'pdf' | 'excel'): void {
    this.downloadingFormat.set(format);
    this.api.downloadRecordsExport(this.currentFilters(), format).subscribe({
      next: (blob) => {
        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        this.triggerDownload(blob, `historial-cambios.${ext}`);
        this.downloadingFormat.set(null);
      },
      error: () => this.downloadingFormat.set(null),
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
