import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoaderService } from '../services/loader.service';

/**
 * Componente de loader global minimalista.
 * Se muestra como una barra de progreso infinita justo debajo del header.
 */
@Component({
  selector: 'ord-core-loader',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
  /**
   * Servicio de loader inyectado
   */
  protected loaderService = inject(LoaderService);

  /**
   * Signal reactivo que indica si el loader debe mostrarse
   */
  protected isLoading = this.loaderService.isLoading;
}
