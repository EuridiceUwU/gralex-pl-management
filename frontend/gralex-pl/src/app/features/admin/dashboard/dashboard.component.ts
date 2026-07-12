import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { ApiService } from '../../../core/api.service';
import { DashboardResponse, StatusBreakdown, SupplierBreakdown } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  readonly data = signal<DashboardResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.dashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las métricas');
        this.loading.set(false);
      },
    });
  }

  cards() {
    const s = this.data()?.summary;
    if (!s) return [];
    return [
      { label: 'Guías totales', value: s.total_shipments, suffix: '', accent: 'bg-brand-500' },
      { label: 'Ingresos', value: Number(s.total_revenue), prefix: '$', accent: 'bg-emerald-500' },
      { label: 'Margen', value: Number(s.total_margin), prefix: '$', accent: 'bg-brand-700' },
      { label: 'Clientes', value: s.total_customers, suffix: '', accent: 'bg-amber-500' },
    ];
  }

  maxSupplier(rows: SupplierBreakdown[]): number {
    return Math.max(1, ...rows.map((r) => r.total));
  }

  maxStatus(rows: StatusBreakdown[]): number {
    return Math.max(1, ...rows.map((r) => r.total));
  }

  barWidth(value: number, max: number): string {
    return `${Math.round((value / max) * 100)}%`;
  }
}
