import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appInputNumber]',
  standalone: true,
})
export class InputNumberDirective {

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const valueAsNumber = (event.target as HTMLInputElement).valueAsNumber;

    if (isNaN(valueAsNumber)) {
      this.control.control?.patchValue(null);
    } else {
      // Actualizamos el FormControl con el valor numérico
      this.control.control?.patchValue(valueAsNumber);
    }
  }
}