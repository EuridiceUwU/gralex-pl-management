import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

  form = this.empty();

  constructor(private readonly api: ApiService) {}

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

  save(): void {
    this.saving.set(true);
    this.api.createCustomer(this.form).subscribe({
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
    return { name: '', companyName: '', email: '', phone: '', rfc: '', cp: '' };
  }
}
