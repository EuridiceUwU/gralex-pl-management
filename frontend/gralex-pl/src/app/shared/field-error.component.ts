import { Component, Input } from '@angular/core';
import { NgModel } from '@angular/forms';

/**
 * Renders a standard validation message for a template-driven field once it has
 * been touched/dirtied. Usage: <app-field-error [field]="nameRef" />
 */
@Component({
  selector: 'app-field-error',
  template: `
    @if (field && field.invalid && (field.dirty || field.touched)) {
      <p class="mt-1 text-xs font-medium text-red-600">
        @if (field.errors?.['required']) {
          Este campo es obligatorio.
        } @else if (field.errors?.['email']) {
          Ingresa un correo electrónico válido.
        } @else if (field.errors?.['minlength']) {
          Mínimo {{ field.errors?.['minlength'].requiredLength }} caracteres.
        } @else if (field.errors?.['maxlength']) {
          Máximo {{ field.errors?.['maxlength'].requiredLength }} caracteres.
        } @else if (field.errors?.['min']) {
          El valor no puede ser negativo.
        } @else if (field.errors?.['pattern']) {
          {{ patternMessage }}
        }
      </p>
    }
  `,
})
export class FieldErrorComponent {
  @Input() field: NgModel | null = null;
  @Input() patternMessage = 'Formato inválido.';
}
