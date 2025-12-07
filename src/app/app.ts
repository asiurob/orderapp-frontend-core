import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DisableAutocompleteDirective } from './directives/disable-autocomplete.directive';

@Component({
  selector: 'ord-core-root',
  imports: [RouterOutlet, DisableAutocompleteDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('core-app');
}
