/**
 * Environment configuration for production
 * This file is used when running `ng build --configuration=production`
 * 
 * ⚠️ TEMPORAL: Usa la URL de Cloud Run hasta configurar el dominio (Fase 7)
 * Después de la Fase 7, cambiar a: 'https://api.orderapp.com.mx/graphql'
 */
export const environment = {
  production: true,
  // URL temporal de Cloud Run (cambiar después de Fase 7)
  apiUrl: 'https://api.orderapp.com.mx/graphql',
  wsUrl: 'wss://api.orderapp.com.mx/graphql',
  auth0: {
    domain: 'dev-13rjs7vtjh8vok5m.us.auth0.com',
    clientId: 'oLPNzsXH75c12IbLg1dhWAVfXMuIRDau',
    audience: 'https://api.orderapp.com.mx'
  }
};

