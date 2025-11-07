import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';

import { ApolloClientOptions, InMemoryCache } from '@apollo/client/core';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';

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
        redirect_uri: `${window.location.origin}/auth/callback`
      }
    }),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
        return {
          cache: new InMemoryCache(),
          link: httpLink.create({
          uri: 'http://localhost:4000/graphql',
          }),
        };
      }),
  ]
};