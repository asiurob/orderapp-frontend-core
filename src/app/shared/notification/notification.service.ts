import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  private defaultConfig: MatSnackBarConfig = {
    duration: 5000, // 5 segundos por default
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };

  // Para mensajes de ÉXITO (Verde)
  success(message: string): void {
    this.show(message, 'success-snackbar', '✅');
  }

  // Para mensajes de ERROR (Rojo)
  error(message: string): void {
    this.show(message, 'error-snackbar', '❌');
  }

  // Para mensajes de INFO (Azul/Neutro)
  info(message: string): void {
    this.show(message, 'info-snackbar', 'ℹ️');
  }

  private show(message: string, panelClass: string, emoji: string): void {
    this.snackBar.open(`${emoji} ${message}`, 'Cerrar', {
      ...this.defaultConfig,
      panelClass: [panelClass] // Usaremos estas clases en styles.scss
    });
  }
}