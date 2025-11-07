import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';
import { AuthService } from '@auth0/auth0-angular';

import { ApolloClientOptions, InMemoryCache } from '@apollo/client/core';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { setContext } from '@apollo/client/link/context';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideRouter(routes),
    provideAuth0({
      domain: 'siurob.auth0.com',
      clientId: 's6PIKbsa8jRdIgTnhQvsVrUr0asa2wTF',
      authorizationParams: {
        redirect_uri: `${window.location.origin}/auth/callback`,
        audience: 'http://localhost:4000/graphql'
      },
      httpInterceptor: {
        allowedList: ['http://localhost:4000/graphql']
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
              audience: 'http://localhost:4000/graphql'
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
          uri: 'http://localhost:4000/graphql',
        })),
      };
    }),
  ]
};