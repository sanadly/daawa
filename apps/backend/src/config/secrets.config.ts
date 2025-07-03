import { registerAs } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface SecretsConfig {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  session: {
    secret: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  externalApis: {
    googleMaps: string;
    stripeSecret: string;
    stripePublishable: string;
  };
  monitoring: {
    sentryDsn?: string;
    newRelicKey?: string;
  };
  security: {
    bcryptRounds: number;
    helmetEnabled: boolean;
    rateLimitEnabled: boolean;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
}

/**
 * Load secrets from various sources based on environment
 * Priority: Secrets Manager > Encrypted Files > Environment Variables
 */
const loadSecrets = (): SecretsConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // In production, try to load from secrets manager or encrypted files
  if (nodeEnv === 'production') {
    return loadProductionSecrets();
  } else if (nodeEnv === 'staging') {
    return loadStagingSecrets();
  } else {
    return loadDevelopmentSecrets();
  }
};

/**
 * Load production secrets from AWS Secrets Manager or similar
 */
const loadProductionSecrets = (): SecretsConfig => {
  // In a real production environment, you would integrate with:
  // - AWS Secrets Manager
  // - Azure Key Vault
  // - HashiCorp Vault
  // - Google Secret Manager
  
  // For now, load from environment variables that should be provided by the secrets manager
  return {
    database: {
      host: getRequiredEnv('PROD_DB_HOST'),
      port: parseInt(getRequiredEnv('PROD_DB_PORT')),
      username: getRequiredEnv('PROD_DB_USER'),
      password: getRequiredEnv('PROD_DB_PASSWORD'),
      name: getRequiredEnv('PROD_DB_NAME'),
      ssl: getRequiredEnv('PROD_DB_SSL') === 'true',
    },
    jwt: {
      secret: getRequiredEnv('PROD_JWT_SECRET'),
      expiresIn: process.env.PROD_JWT_EXPIRES_IN || '24h',
    },
    session: {
      secret: getRequiredEnv('PROD_SESSION_SECRET'),
    },
    redis: {
      host: getRequiredEnv('PROD_REDIS_HOST'),
      port: parseInt(process.env.PROD_REDIS_PORT || '6379'),
      password: process.env.PROD_REDIS_PASSWORD,
      db: parseInt(process.env.PROD_REDIS_DB || '0'),
    },
    smtp: {
      host: getRequiredEnv('PROD_SMTP_HOST'),
      port: parseInt(process.env.PROD_SMTP_PORT || '587'),
      user: getRequiredEnv('PROD_SMTP_USER'),
      password: getRequiredEnv('PROD_SMTP_PASSWORD'),
      from: process.env.PROD_SMTP_FROM || 'noreply@daawa.com',
    },
    externalApis: {
      googleMaps: getRequiredEnv('PROD_GOOGLE_MAPS_KEY'),
      stripeSecret: getRequiredEnv('PROD_STRIPE_SECRET'),
      stripePublishable: getRequiredEnv('PROD_STRIPE_PUBLIC'),
    },
    monitoring: {
      sentryDsn: process.env.PROD_SENTRY_DSN,
      newRelicKey: process.env.PROD_NEW_RELIC_KEY,
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '14'),
      helmetEnabled: process.env.HELMET_ENABLED === 'true',
      rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
  };
};

/**
 * Load staging secrets
 */
const loadStagingSecrets = (): SecretsConfig => {
  return {
    database: {
      host: getRequiredEnv('STAGING_DB_HOST'),
      port: parseInt(process.env.STAGING_DB_PORT || '5432'),
      username: getRequiredEnv('STAGING_DB_USER'),
      password: getRequiredEnv('STAGING_DB_PASSWORD'),
      name: process.env.STAGING_DB_NAME || 'daawa_staging',
      ssl: process.env.STAGING_DB_SSL === 'true',
    },
    jwt: {
      secret: getRequiredEnv('STAGING_JWT_SECRET'),
      expiresIn: process.env.STAGING_JWT_EXPIRES_IN || '7d',
    },
    session: {
      secret: getRequiredEnv('STAGING_SESSION_SECRET'),
    },
    redis: {
      host: getRequiredEnv('STAGING_REDIS_HOST'),
      port: parseInt(process.env.STAGING_REDIS_PORT || '6379'),
      password: process.env.STAGING_REDIS_PASSWORD,
      db: parseInt(process.env.STAGING_REDIS_DB || '0'),
    },
    smtp: {
      host: getRequiredEnv('STAGING_SMTP_HOST'),
      port: parseInt(process.env.STAGING_SMTP_PORT || '587'),
      user: getRequiredEnv('STAGING_SMTP_USER'),
      password: getRequiredEnv('STAGING_SMTP_PASSWORD'),
      from: process.env.STAGING_SMTP_FROM || 'staging@daawa.com',
    },
    externalApis: {
      googleMaps: getRequiredEnv('STAGING_GOOGLE_MAPS_KEY'),
      stripeSecret: getRequiredEnv('STAGING_STRIPE_SECRET'),
      stripePublishable: getRequiredEnv('STAGING_STRIPE_PUBLIC'),
    },
    monitoring: {
      sentryDsn: process.env.STAGING_SENTRY_DSN,
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      helmetEnabled: true,
      rateLimitEnabled: true,
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200'),
    },
  };
};

/**
 * Load development secrets (more permissive for local development)
 */
const loadDevelopmentSecrets = (): SecretsConfig => {
  return {
    database: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      name: process.env.DATABASE_NAME || 'daawa_development',
      ssl: process.env.DATABASE_SSL === 'true',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-jwt-secret-not-secure',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    session: {
      secret: process.env.SESSION_SECRET || 'dev-session-secret-not-secure',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    },
    smtp: {
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      user: process.env.SMTP_USER || 'your-mailtrap-user',
      password: process.env.SMTP_PASSWORD || 'your-mailtrap-password',
      from: process.env.SMTP_FROM || 'dev@daawa.com',
    },
    externalApis: {
      googleMaps: process.env.GOOGLE_MAPS_API_KEY || 'dev-google-maps-key',
      stripeSecret: process.env.STRIPE_SECRET_KEY || 'sk_test_dev_stripe_key',
      stripePublishable: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dev_stripe_key',
    },
    monitoring: {
      sentryDsn: process.env.SENTRY_DSN,
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
      helmetEnabled: process.env.HELMET_ENABLED !== 'false',
      rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
    },
  };
};

/**
 * Helper function to get required environment variables
 */
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

/**
 * Try to load encrypted secrets file (for local secure storage)
 */
const loadEncryptedSecretsFile = (filePath: string): Record<string, string> | null => {
  try {
    if (fs.existsSync(filePath)) {
      const encryptedContent = fs.readFileSync(filePath, 'utf8');
      // In a real implementation, you would decrypt this content
      // For now, assume it's a JSON file
      return JSON.parse(encryptedContent);
    }
  } catch (error) {
    console.warn(`Failed to load encrypted secrets file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  return null;
};

export default registerAs('secrets', loadSecrets); 