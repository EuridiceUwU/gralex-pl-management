import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { FieldErrorComponent } from '../../../shared/field-error.component';

@Component({
  selector: 'app-change-password',
  imports: [FormsModule, FieldErrorComponent],
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {
  newPassword = '';
  confirmPassword = '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.changePassword(this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo actualizar la contraseña');
      },
    });
  }
}
