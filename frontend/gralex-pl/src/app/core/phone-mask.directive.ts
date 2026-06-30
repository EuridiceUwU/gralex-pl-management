import { Directive, ElementRef, HostListener, Renderer2, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Visual phone mask. The user sees `271-230-4713` while the bound ngModel keeps
 * the raw digits (`2712304713`) so the backend receives the number unformatted.
 *
 * Implemented as a ControlValueAccessor so it cooperates with ngModel.
 */
@Directive({
  selector: 'input[phoneMask]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneMaskDirective),
      multi: true,
    },
  ],
})
export class PhoneMaskDirective implements ControlValueAccessor {
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private readonly el: ElementRef<HTMLInputElement>,
    private readonly renderer: Renderer2,
  ) {}

  @HostListener('input')
  handleInput(): void {
    const digits = this.digitsOf(this.el.nativeElement.value);
    this.setDisplay(digits);
    this.onChange(digits);
  }

  @HostListener('blur')
  handleBlur(): void {
    this.onTouched();
  }

  writeValue(value: string): void {
    this.setDisplay(this.digitsOf(value));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
  }

  private digitsOf(value: string): string {
    return (value || '').replace(/\D/g, '').slice(0, 10);
  }

  private setDisplay(digits: string): void {
    this.renderer.setProperty(this.el.nativeElement, 'value', this.format(digits));
  }

  private format(digits: string): string {
    let out = digits.slice(0, 3);
    if (digits.length >= 4) out += '-' + digits.slice(3, 6);
    if (digits.length >= 7) out += '-' + digits.slice(6, 10);
    return out;
  }
}
