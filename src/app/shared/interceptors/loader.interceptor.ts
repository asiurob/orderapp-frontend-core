import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

/**
 * Interceptor HTTP para mostrar/ocultar el loader global.
 * Se activa automáticamente en todas las peticiones HTTP a recursos externos.
 * 
 * @param req - Request HTTP
 * @param next - Función para continuar con el siguiente interceptor
 * @returns Observable de la petición con manejo del loader
 */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);

  // Mostrar loader al inicio de la petición
  loaderService.show();

  // Ocultar loader cuando la petición termine (éxito o error)
  return next(req).pipe(
    finalize(() => {
      loaderService.hide();
    })
  );
};
