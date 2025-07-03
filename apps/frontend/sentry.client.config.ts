import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: ENVIRONMENT,
  debug: ENVIRONMENT === 'development',

  // Performance monitoring
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Session replay
  replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Error filtering
  beforeSend(event, hint) {
    // Don't send errors in development unless explicitly enabled
    if (ENVIRONMENT === 'development' && !process.env.SENTRY_SEND_DEV_ERRORS) {
      return null;
    }

    // Filter out common irrelevant errors
    const error = hint.originalException;
    
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as Error).message;
      
      // Filter out network errors that aren't actionable
      if (message.includes('Network Error') || 
          message.includes('Failed to fetch') ||
          message.includes('Load failed')) {
        return null;
      }
      
      // Filter out browser extension errors
      if (message.includes('Non-Error promise rejection') ||
          message.includes('Script error') ||
          message.includes('extension://')) {
        return null;
      }
    }

    return event;
  },

  // Additional configuration for client-side
  integrations: [
    // Performance monitoring for navigation is built into Next.js Sentry automatically
    Sentry.replayIntegration({
      // Mask sensitive data in session replays
      maskAllText: ENVIRONMENT === 'production',
      blockAllMedia: ENVIRONMENT === 'production',
    }),
  ],

  // Custom tags
  initialScope: {
    tags: {
      component: 'frontend',
      platform: 'nextjs',
    },
  },
}); 