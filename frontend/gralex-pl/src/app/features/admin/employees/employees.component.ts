import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
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
  readonly editingId = signal<number | null>(null);
  readonly search = signal('');
  readonly confirmTarget = signal<Employee | null>(null);
  readonly showPassword = signal(false);

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    if (!q) return this.items();
    return this.items().filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.role_name || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.phone || '').includes(q),
    );
  });

  form = this.empty();

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
  ) {}

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

  // True when the row belongs to the logged-in user (can't deactivate self).
  isSelf(e: Employee): boolean {
    return e.employee_id === this.auth.user()?.employee_id;
  }

  startEdit(e: Employee): void {
    this.editingId.set(e.employee_id);
    const role = this.roles().find((r) => r.role_name === e.role_name);
    this.form = {
      roleId: role?.role_id ?? null,
      name: e.name,
      email: e.email || '',
      phone: e.phone || '',
      password: '',
    };
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.showPassword.set(false);
    this.form = this.empty();
  }

  save(): void {
    this.saving.set(true);
    // On edit only data is updated (name, role, email, phone) — password is
    // never sent here; on create the optional password is included.
    const obs = this.editingId()
      ? this.api.updateEmployee(this.editingId()!, {
          roleId: this.form.roleId,
          name: this.form.name,
          email: this.form.email,
          phone: this.form.phone,
        })
      : this.api.createEmployee(this.form);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.reload();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDeactivate(e: Employee): void {
    this.confirmTarget.set(e);
  }

  cancelConfirm(): void {
    this.confirmTarget.set(null);
  }

  deactivate(): void {
    const e = this.confirmTarget();
    if (!e) return;
    this.confirmTarget.set(null);
    this.api.deleteEmployee(e.employee_id).subscribe({
      next: () => this.reload(),
    });
  }

  activate(e: Employee): void {
    this.api.updateEmployee(e.employee_id, { status: true }).subscribe({
      next: () => this.reload(),
    });
  }

  private empty() {
    return { roleId: null as number | null, name: '', email: '', phone: '', password: '' };
  }
}
