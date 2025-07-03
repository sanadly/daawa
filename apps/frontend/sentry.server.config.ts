import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: ENVIRONMENT,
  debug: ENVIRONMENT === 'development',

  // Performance monitoring  
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Error filtering for server-side
  beforeSend(event, hint) {
    // Don't send errors in development unless explicitly enabled
    if (ENVIRONMENT === 'development' && !process.env.SENTRY_SEND_DEV_ERRORS) {
      return null;
    }

    // Filter out common server errors that aren't actionable
    const error = hint.originalException;
    
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as Error).message;
      
      // Filter out connection errors during development
      if (ENVIRONMENT === 'development' && 
          (message.includes('ECONNREFUSED') || 
           message.includes('ENOTFOUND'))) {
        return null;
      }
    }

    return event;
  },

  // Server-side integrations
  integrations: [
    // Add server-specific integrations
  ],

  // Custom tags
  initialScope: {
    tags: {
      component: 'frontend-server',
      platform: 'nextjs-server',
    },
  },
}); 