import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/api.service';
import { Supplier } from '../../../core/models';
import { PhoneMaskDirective } from '../../../core/phone-mask.directive';
import { FieldErrorComponent } from '../../../shared/field-error.component';

@Component({
  selector: 'app-suppliers',
  imports: [FormsModule, PhoneMaskDirective, FieldErrorComponent],
  templateUrl: './suppliers.component.html',
})
export class SuppliersComponent implements OnInit {
  readonly items = signal<Supplier[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);

  form = this.empty();

  constructor(private readonly api: ApiService) {}

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

  save(): void {
    this.saving.set(true);
    this.api.createSupplier(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.form = this.empty();
        this.reload();
      },
      error: () => this.saving.set(false),
    });
  }

  private empty() {
    return { name: '', email: '', phone: '', rfc: '', creditAmount: null as number | null };
  }
}
