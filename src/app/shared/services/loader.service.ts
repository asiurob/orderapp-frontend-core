import { Injectable, signal, computed } from '@angular/core';

/**
 * Servicio para manejar el estado global del loader.
 * Usa un contador para manejar múltiples peticiones simultáneas.
 */
@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  /**
   * Contador de peticiones activas
   */
  private requestCount = signal(0);

  /**
   * Signal computado que indica si el loader debe mostrarse
   * Se activa cuando hay al menos una petición activa
   */
  readonly isLoading = computed(() => this.requestCount() > 0);

  /**
   * Incrementa el contador de peticiones activas
   */
  show(): void {
    this.requestCount.update(count => count + 1);
  }

  /**
   * Decrementa el contador de peticiones activas
   */
  hide(): void {
    this.requestCount.update(count => Math.max(0, count - 1));
  }

  /**
   * Resetea el contador a 0 (útil para casos extremos)
   */
  reset(): void {
    this.requestCount.set(0);
  }
}
