import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/api.service';
import { Employee } from '../../../core/models';
import { PhoneMaskDirective } from '../../../core/phone-mask.directive';
import { FieldErrorComponent } from '../../../shared/field-error.component';

@Component({
  selector: 'app-employees',
  imports: [FormsModule, PhoneMaskDirective, FieldErrorComponent],
  templateUrl: './employees.component.html',
})
export class EmployeesComponent implements OnInit {
  readonly items = signal<Employee[]>([]);
  readonly roles = signal<{ role_id: number; role_name: string }[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);

  form = this.empty();

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.reload();
    this.api.roles().subscribe((r) => this.roles.set(r.roles));
  }

  reload(): void {
    this.loading.set(true);
    this.api.employees().subscribe({
      next: (r) => {
        this.items.set(r.employees);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    this.saving.set(true);
    this.api.createEmployee(this.form).subscribe({
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
    return { roleId: null as number | null, name: '', email: '', phone: '', password: '' };
  }
}
