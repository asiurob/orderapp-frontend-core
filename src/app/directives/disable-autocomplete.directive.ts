import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

/**
 * Directiva que deshabilita el autocomplete del navegador en todos los inputs, textareas y selects.
 * 
 * Se aplica automáticamente a todos los elementos que no tengan explícitamente autocomplete="on".
 * Usa múltiples estrategias para deshabilitar el autocomplete:
 * - Atributos estándar (autocomplete, autocorrect, autocapitalize)
 * - Trucos para Password Managers (LastPass, 1Password)
 * - Hack maestro para Chrome: valores random que rompen el cache
 * 
 * @example
 * ```html
 * <!-- Se aplica automáticamente, no necesitas hacer nada -->
 * <input matInput formControlName="name">
 * 
 * <!-- Si quieres permitir autocomplete, usa autocomplete="on" -->
 * <input matInput formControlName="email" autocomplete="on">
 * ```
 */
@Directive({
  // Se aplica automáticamente a todos estos elementos que no tengan autocomplete="on"
  selector: 'input:not([autocomplete="on"]), textarea:not([autocomplete="on"]), select:not([autocomplete="on"])',
  standalone: true
})
export class DisableAutocompleteDirective implements AfterViewInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    const element = this.el.nativeElement;

    // 1. Atributos estándar y trucos
    this.renderer.setAttribute(element, 'autocomplete', 'off');
    this.renderer.setAttribute(element, 'autocorrect', 'off');
    this.renderer.setAttribute(element, 'autocapitalize', 'off');
    this.renderer.setAttribute(element, 'spellcheck', 'false');

    // 2. Trucos para Password Managers (LastPass, 1Password)
    this.renderer.setAttribute(element, 'data-lpignore', 'true');
    this.renderer.setAttribute(element, 'data-form-type', 'other');

    // 3. El Hack Maestro para Chrome (Random String)
    // Chrome a veces ignora 'off'. Si le pones basura, se confunde y no muestra nada.
    const randomString = Math.random().toString(36).substring(2, 10);

    if (element.type === 'password') {
      // Para passwords, 'new-password' suele funcionar mejor que 'off'
      this.renderer.setAttribute(element, 'autocomplete', 'new-password');
    } else {
      // Para texto normal, ponerle un valor random rompe el cache de Chrome
      this.renderer.setAttribute(element, 'autocomplete', `nop-${randomString}`);
      // A veces el name dispara el autocomplete, así que también lo randomizamos si no tiene name
      if (!element.name || element.name === '') {
        this.renderer.setAttribute(element, 'name', `field-${randomString}`);
      }
    }
  }
}

