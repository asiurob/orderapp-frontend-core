import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';
import { AuthService } from '@auth0/auth0-angular';

import { ApolloClientOptions, InMemoryCache } from '@apollo/client/core';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { setContext } from '@apollo/client/link/context';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { loaderInterceptor } from './shared/interceptors/loader.interceptor';

export const appConfig: ApplicationConfig = {
providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(
      withInterceptors([loaderInterceptor])
    ),
    provideRouter(routes),
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: `${window.location.origin}/auth/callback`,
        audience: environment.auth0.audience
      },
      httpInterceptor: {
        allowedList: [environment.apiUrl]
      }
    }),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      const authService = inject(AuthService);
      
      // Link que agrega el token de Auth0 a cada petición
      const authLink = setContext(async (_, { headers }) => {
        try {
          // Verificar estado de autenticación primero
          const isAuthenticated = await firstValueFrom(authService.isAuthenticated$);
          
          if (!isAuthenticated) {
            return { headers };
          }

          // Obtener el token de Auth0 (getAccessTokenSilently devuelve un Observable)
          const tokenObservable = authService.getAccessTokenSilently({
            authorizationParams: {
              audience: environment.auth0.audience
            }
          });
          
          const token = await firstValueFrom(tokenObservable);

          if (token && typeof token === 'string') {
            return {
              headers: {
                ...headers,
                authorization: `Bearer ${token}`,
              },
            };
          }
        } catch (error) {
          // Si hay error al obtener el token, continuar sin header de autorización
        }

        // Si hay error o no hay token, continuar sin header de autorización
        return { headers };
      });

      return {
        cache: new InMemoryCache(),
        link: authLink.concat(httpLink.create({
          uri: environment.apiUrl,
        })),
      };
    }),
  ]
};