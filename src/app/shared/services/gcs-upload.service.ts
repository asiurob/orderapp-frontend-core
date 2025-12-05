import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, map, catchError, throwError, filter } from 'rxjs';

/**
 * Servicio genérico para subir archivos a Google Cloud Storage mediante Signed URLs
 * 
 * Este servicio es completamente agnóstico y no conoce el contexto de uso
 * (productos, logos, documentos, etc.). Solo se encarga de subir archivos.
 */
@Injectable({
  providedIn: 'root'
})
export class GcsUploadService {
  private http = inject(HttpClient);

  /**
   * Sube un archivo a Google Cloud Storage usando una Signed URL
   * 
   * @param signedUrl - URL firmada generada por el backend
   * @param file - Archivo a subir
   * @returns Observable que emite el porcentaje de progreso (0-100) y se completa con null cuando termina
   * 
   * @example
   * ```typescript
   * this.gcsUploadService.uploadFile(signedUrl, file).subscribe({
   *   next: (progress) => {
   *     if (progress !== null) {
   *       // Progreso: progress%
   *     } else {
   *       // Upload completado
   *     }
   *   },
   *   error: (error) => {
   *     // Manejar error
   *   }
   * });
   * ```
   */
  uploadFile(signedUrl: string, file: File): Observable<number | null> {
    return this.http.put(signedUrl, file, {
      headers: {
        'Content-Type': file.type // CRÍTICO: Debe coincidir exactamente con el tipo del archivo
      },
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round((100 * event.loaded) / event.total);
          return progress;
        } else if (event.type === HttpEventType.Response) {
          // Upload completado
          return null;
        }
        return undefined;
      }),
      filter((value): value is number | null => value !== undefined),
      catchError(error => {
        return throwError(() => new Error(`Error al subir el archivo: ${error.message || 'Error desconocido'}`));
      })
    );
  }
}

