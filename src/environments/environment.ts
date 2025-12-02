/**
 * Environment configuration for development
 * This file is used when running `ng serve` or `ng build` without --configuration=production
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4000/graphql',
  wsUrl: 'ws://localhost:4000/graphql',
  auth0: {
    domain: 'dev-13rjs7vtjh8vok5m.us.auth0.com',
    clientId: 'oLPNzsXH75c12IbLg1dhWAVfXMuIRDau',
    audience: 'https://api.orderapp.com.mx'
  }
};

